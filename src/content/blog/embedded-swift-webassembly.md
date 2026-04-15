---
title: "Shipping a Frontend in Embedded Swift + WebAssembly"
date: 2026-03-10
description: "Why I skipped JavaScript entirely and built my frontend in Embedded Swift compiled to WebAssembly — the DX, the tradeoffs, and the tooling I had to build."
---

The platform's frontend has zero JavaScript. The entire UI is written in **Embedded Swift**, compiled to **WebAssembly**, and served as a static binary. No React, no Svelte, no build toolchain circus.

This is not the obvious choice. Here's why I did it and what it's actually like.

## The Motivation

The backend is Swift/Vapor. The 11 packages I maintain are all Swift. When I started building the frontend, I had two options:

1. Learn a JavaScript framework, maintain a second toolchain, and live with the impedance mismatch between Swift types on the backend and TypeScript types on the frontend
2. Write Swift for the frontend too

I chose option 2. The enabling technology is [Embedded Swift](https://www.swift.org/documentation/articles/embedded-swift.html) — a subset of Swift designed for constrained environments (microcontrollers, WASM runtimes).

## How It Works

Embedded Swift compiles to a `.wasm` binary that runs in the browser. The binary interacts with the DOM through imported JavaScript functions (a thin interop layer). I wrote a set of Swift result builders that let me express HTML structure in Swift:

```swift
body {
    header {
        nav {
            link("Home", href: "/")
            link("Blog", href: "/blog")
        }
    }
    main {
        h1("Welcome")
        p("An AI-powered knowledge platform.")
    }
}
```

This compiles down to DOM manipulation calls in the WASM binary. No virtual DOM, no diffing — just direct DOM writes on initial render and targeted updates on state changes.

## The Packages I Built

Because this ecosystem doesn't exist yet, I had to build the tooling:

- **`web-types`** — Swift types for HTML elements, attributes, events
- **`web-builders`** — Result builders for declarative HTML/CSS
- **`web-components`** — Reusable UI components (buttons, forms, modals)
- **`web-apis`** — Swift bindings for browser APIs (fetch, localStorage, history)
- **`web-formats`** — Data formatting (dates, numbers, markdown)
- **`web-security`** — Auth tokens, CSRF, content security policy
- **`design-tokens`** — Type-safe design system (colors, spacing, typography)
- **`embedded-swift-utilities`** — Low-level WASM interop helpers

All of these are open source.

## What's Good

**Type safety across the full stack.** A backend API returns a `DictionaryEntry` struct. The frontend receives the same `DictionaryEntry` struct. No serialization mismatches, no "oops I renamed this field on the backend but forgot the frontend."

**Bundle size.** The compiled WASM binary for the frontend is ~180KB gzipped. A typical React app with dependencies starts at 200KB+ before you write a single line of your own code.

**No node_modules.** Swift Package Manager resolves dependencies. No `package.json`, no webpack, no Vite config.

## What's Hard

**Debugging.** WASM debugging tools are improving but still rough compared to Chrome DevTools for JavaScript. Stack traces reference WASM offsets, not Swift line numbers.

**Ecosystem.** There's no equivalent of npm for this. Every abstraction I needed, I had to write. This is why I ended up with 11 packages.

**Hot reload.** Doesn't exist. Compile, refresh, repeat. The compile is fast (~2 seconds for incremental builds), but it's not instant.

**Interop ceremony.** Calling browser APIs from Swift requires writing bindings. The `web-apis` package handles the common ones, but if you need something exotic, you're writing JavaScript glue code.

## Would I Do It Again?

Yes — but only because I'm already maintaining a Swift backend and the type-safety payoff is real. If I were starting a greenfield project with a team, I'd probably pick a proven framework.

The interesting thing is that this approach gets better over time. Every package I write is reusable across projects. The upfront investment is high, but the marginal cost of the next Swift+WASM project is much lower.

---

*All 11 packages are open source. If you're exploring Embedded Swift for the web, they might save you some months of work.*
