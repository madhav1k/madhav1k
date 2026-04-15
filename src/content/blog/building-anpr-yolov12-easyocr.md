---
title: "Building a Production ANPR System with YOLOv12 + EasyOCR"
date: 2025-05-02
description: "How Nayan's Automatic Number Plate Recognition engine works — from detection to OCR to serving results on live CCTV and dashcam streams."
---

Automatic Number Plate Recognition (ANPR) sounds straightforward: find the plate, read the text. In practice, building one that works on live CCTV and dashcam footage across 12+ countries is a different beast entirely.

At [Nayan](https://www.nayan.co), I built the production ANPR engine from scratch. Here's how it works.

## Architecture

The system is a two-stage pipeline:

```
Video stream → Frame extraction → YOLOv12 (localization) → Crop → EasyOCR (recognition) → Structured output
```

### Stage 1: Detection with YOLOv12

YOLOv12 localizes the license plate in each frame. I chose YOLOv12 over earlier versions because of its improved accuracy on small objects — license plates at a distance are often only 30-50 pixels wide.

Key training decisions:
- **Multi-scale training** — plates appear at vastly different sizes depending on camera distance
- **Augmentation** — motion blur (dashcams), night-time contrast, rain/glare overlays
- **Anchor-free detection** — YOLOv12's architecture handles the variable aspect ratios of plates across countries

### Stage 2: OCR with EasyOCR

Once the plate is localized and cropped, EasyOCR reads the characters. I chose EasyOCR over Tesseract because:

1. **Multilingual support** — plates in Arabic, Hindi, Latin scripts all need to work
2. **Better accuracy on distorted text** — dashcam footage has motion blur, perspective distortion
3. **GPU acceleration** — EasyOCR runs on the same GPU as the detection model

### Post-processing

Raw OCR output is noisy. I added a post-processing layer that:
- Validates against known plate formats (regex patterns per country)
- Corrects common OCR mistakes (0 vs O, 1 vs I, 8 vs B)
- Deduplicates across frames (the same plate appears in multiple consecutive frames)

## Serving on Live Streams

The system processes CCTV and dashcam feeds in real-time. The architecture:

1. **Frame sampler** — not every frame needs processing. I sample at 2-5 FPS depending on vehicle speed estimates
2. **Batch inference** — multiple plates from the same frame go through the model in a single batch
3. **Result deduplication** — a sliding window tracks recently seen plates to avoid duplicate alerts

## Challenges in Production

**Night vision:** IR cameras produce grayscale images with different contrast characteristics. I trained a separate detection model fine-tuned on IR footage.

**Occluded plates:** Vehicles behind each other, dirt, stickers. The detection model is trained with partial occlusion augmentation, and the OCR handles partial reads gracefully (returning a confidence score).

**Latency budget:** The full pipeline — detection + crop + OCR + post-processing — needs to complete in under 100ms per frame to keep up with the stream. On an NVIDIA T4, we typically hit 40-60ms.

## The Stack

- **Detection:** YOLOv12 (custom trained, PyTorch)
- **OCR:** EasyOCR (GPU-accelerated)
- **Inference server:** Python, served via a gRPC endpoint
- **Stream processing:** OpenCV for frame extraction, asyncio for concurrent stream handling

---

*This ANPR engine powers law enforcement use cases across Nayan's deployments in 12+ countries, processing CCTV and dashcam feeds for traffic violation detection.*
