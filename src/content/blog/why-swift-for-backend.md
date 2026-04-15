---
title: "Why I Chose Swift Over Python for My Backend"
date: 2025-11-20
description: "Migrating from Python/Django to Swift/Vapor — the reasoning, the tradeoffs, and whether it was worth it."
---

This will sound controversial: I migrated my entire backend from Python/Django to **Swift/Vapor**. Not because Swift is trendy for server-side (it isn't), but because the economics made sense for a solo founder.

## The Problem

The platform started as a Django app on a `t4g.medium` EC2 instance. It worked, but even with moderate traffic, Python's memory footprint was eating into my AWS bill. As a bootstrapped founder, every dollar matters.

I'd been writing Swift packages for the frontend (compiled to WebAssembly), and the idea of a **single-language stack** was appealing. But the real motivation was performance per dollar.

## The Numbers

After migration:

| Metric | Python/Django | Swift/Vapor |
|--------|--------------|-------------|
| Instance | t4g.medium | t4g.small |
| Memory at idle | ~450MB | ~30MB |
| p95 latency | ~320ms | ~85ms |
| Monthly cost | ~$30 | Free tier |

Swift's compiled binary uses a fraction of the memory. The Vapor framework is surprisingly mature — routing, middleware, async/await, it's all there.

## What I Gave Up

Let's be honest about the tradeoffs:

1. **Ecosystem** — Python has a package for everything. Swift's server ecosystem is small. I ended up writing 11 packages myself for things that would be `pip install` in Python.
2. **Hiring** — if I ever hire, finding Swift backend engineers is harder than finding Python ones.
3. **AI/ML integration** — my LangGraph pipeline still runs in Python. The Swift backend calls it via HTTP. This boundary is actually clean, but it's an extra hop.
4. **Compile times** — Swift Package Manager resolution on a large dependency graph is... not fast.

## What I Gained

1. **Type safety everywhere** — from the database layer to the API response, everything is typed. Refactoring is fearless.
2. **Performance** — sub-100ms p95 on a free tier instance. Can't argue with that.
3. **Single language** — Swift on the backend, Swift compiled to WASM on the frontend. One mental model.
4. **Forced modularity** — because the ecosystem is small, I had to build things myself. This forced me to think carefully about package boundaries, which resulted in 11 clean, composable libraries.

## Would I Recommend It?

For most people? No. Python/Django or Go would be the pragmatic choice.

For a solo founder who's already deep in the Apple ecosystem and wants to minimize infrastructure costs? It's worth considering. The key insight is that **Swift's performance characteristics let you run on smaller (or free) instances**, which matters when you're paying out of pocket.

The 11 packages I wrote — `web-security` for auth and crypto, `diff-engine` for version control, `web-apis` for routing, `admin-core` for the admin panel, and more — are open source. If you're exploring Swift on the server, they might save you some time.

---

*This is part of a series on building the platform from scratch. Next up: [how the agentic pipeline works](/blog/building-agentic-pipeline).*
