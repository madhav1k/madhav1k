---
title: "Building a 4-Stage Agentic Pipeline with LangGraph"
date: 2026-01-15
description: "How I designed a multi-stage LLM pipeline to process linguistic attestations into verified dictionary entries — and what I learned about taming hallucinations in production."
---

When I started building the platform, the core challenge was clear: take raw linguistic attestations from diverse sources and transform them into verified, peer-reviewed dictionary entries with etymological linking. An LLM could do parts of this, but trusting it end-to-end was out of the question.

So I designed a 4-stage agentic pipeline: **Ingest → Enrich → Define → Verify**.

## Why Stages?

The naive approach is to throw everything at a single LLM call: "Here's some text, give me a dictionary entry." This fails spectacularly because:

1. **Hallucination compounds** — the model invents etymologies that sound plausible but are fabricated
2. **No audit trail** — when something is wrong, you can't tell which step introduced the error
3. **Validation is impossible** — you can't write a schema for "is this etymology correct?" in one shot

Breaking the work into stages lets you validate the output of each step independently before feeding it into the next.

## The Pipeline

### Stage 1: Ingest

The ingestion stage gathers attestations — real-world usage examples of a word from source texts. This stage is mostly deterministic: scraping, parsing, deduplication. The LLM isn't involved yet.

### Stage 2: Enrich

This is where the LLM first enters the picture. Given a raw attestation, it identifies the relevant senses, performs part-of-speech tagging, and does initial linguistic decomposition.

The key insight: I use **Pydantic models** to validate the output schema. If the LLM returns something that doesn't conform (wrong POS tag, missing fields), the stage retries with the validation error injected into the prompt.

```python
class EnrichedAttestation(BaseModel):
    word: str
    part_of_speech: Literal["noun", "verb", "adjective", "adverb", "other"]
    senses: list[Sense]
    morphological_decomposition: Optional[str]
```

### Stage 3: Define

With enriched data, the Define stage establishes etymological kinship — linking the word to its roots across languages. This is where **Neo4j** becomes essential. The graph database stores known etymological trees, and the LLM proposes new connections that get validated against existing graph patterns.

### Stage 4: Verify

The final stage is a verification pass. A separate LLM call (acting as a reviewer) checks the entire entry for internal consistency, cross-references the proposed etymology against the graph, and scores confidence. Entries below the threshold get flagged for human review.

## LangGraph for Orchestration

I chose [LangGraph](https://github.com/langchain-ai/langgraph) over a simple chain because:

- **Conditional edges** — if verification fails, the entry loops back to Enrich with reviewer feedback
- **State management** — each stage reads from and writes to a shared state object
- **Persistence** — I can checkpoint mid-pipeline and resume later

The graph definition looks roughly like:

```python
workflow = StateGraph(PipelineState)
workflow.add_node("ingest", ingest_node)
workflow.add_node("enrich", enrich_node)
workflow.add_node("define", define_node)
workflow.add_node("verify", verify_node)

workflow.add_edge("ingest", "enrich")
workflow.add_edge("enrich", "define")
workflow.add_conditional_edges("verify", route_on_confidence)
```

## Lessons Learned

1. **Pydantic is your best friend** — strict output validation at every stage catches most hallucinations before they propagate
2. **Separate the judge from the generator** — the verify stage uses a different system prompt and sometimes a different model temperature
3. **Graph databases for linguistic data** — Neo4j was the right call; etymological relationships are inherently graph-shaped
4. **Don't over-automate** — the pipeline flags uncertain entries for human review rather than guessing

The pipeline currently processes attestations with a hallucination rate under 3% on verified entries. Not perfect, but good enough for a living document that gets community corroboration.

---

*The 11 Swift packages powering the platform are open source.*
