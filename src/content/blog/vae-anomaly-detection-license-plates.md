---
title: "Catching Fake License Plates with a Variational Autoencoder"
date: 2025-04-10
description: "How I built a VAE-based anomaly detection pipeline at Nayan to flag fraudulent license plates in live traffic — achieving 96.42% AUC-ROC in production."
---

At [Nayan](https://www.nayan.co), one of my first projects was building a system to detect **fraudulent and illegal license plates** in real-time traffic streams. The challenge: you can't just train a classifier on "fake" plates, because the space of possible fakes is unbounded. Instead, I used a **Variational Autoencoder** to learn what legitimate plates look like, and flag anything that doesn't fit.

## Why a VAE?

The classic approach to anomaly detection is to model the normal distribution and flag outliers. A VAE does this naturally:

1. **Encoder** compresses a license plate image into a latent vector
2. **Decoder** reconstructs the image from the latent vector
3. **Reconstruction error** tells you how "normal" the plate looks

Fraudulent plates — wrong fonts, incorrect spacing, tampered characters — produce higher reconstruction error because the model has never seen those patterns during training.

## The Pipeline

```
Camera feed → YOLOv12 (plate detection) → Crop → VAE (anomaly scoring) → Threshold → Alert
```

The plate detection step uses YOLOv12 to localize license plates in each frame. The cropped plate image is then fed through the VAE. If the reconstruction error exceeds a learned threshold, the plate is flagged as anomalous.

## Training

I trained the VAE on a dataset of ~50K legitimate Indian license plates, augmented with:
- Rotation (±5°)
- Brightness/contrast variations
- Partial occlusion (simulating dirt/damage)
- Different lighting conditions

The key was **not** training on any fake plates. The model should only know what "normal" looks like.

## Results

| Metric | Score |
|--------|-------|
| AUC-ROC | 96.42% |
| AUC-PR | 95.90% |
| F1 | 86.64% |

The F1 is lower because the threshold is deliberately conservative — we'd rather flag a legitimate plate for human review than miss a fraudulent one. In a law enforcement context, false negatives are more costly than false positives.

## Challenges

1. **State-specific plate formats** — India has different plate formats across states. The VAE needs to learn all of them as "normal." I handled this by training on a geographically diverse dataset.
2. **Weathered plates** — old, faded plates have high reconstruction error even though they're legitimate. Adding augmentation for aging/wear helped.
3. **Real-time constraints** — the VAE inference needs to be fast enough for live streams. I used a lightweight architecture (4 conv layers, 64-dim latent space) that runs in ~5ms per plate on GPU.

## What I'd Do Differently

If I were starting over, I'd experiment with a **VQ-VAE** (Vector Quantized VAE) for better discrete anomaly boundaries. The continuous latent space of a standard VAE sometimes blurs the line between "slightly unusual" and "definitely fake."

I'd also explore contrastive learning approaches — but the beauty of the VAE approach is that it requires **zero** labeled anomaly data. You only need examples of normal plates.

---

*This system is deployed across Nayan's camera network in 12+ countries. Nayan won TieCon 50 (Top Startup of the Year, 2025, Silicon Valley).*
