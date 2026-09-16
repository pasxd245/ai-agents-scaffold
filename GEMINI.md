# GEMINI.md — a2scaffold

<!-- a2scaffold:start -->

> The Gemini CLI reads this file. It is a stub: the project knowledge lives
> in `.agents/`, imported below.

## Shared knowledge base

`.agents/` holds the directory layout, authority rules, load order, and the
pair-programming workflow. Treat it as part of these instructions.
Agents that expand `@` imports load it inline; others open it directly.

@.agents/AGENTS.md

<!-- a2scaffold:end -->

## Philosophy

These principles decide the close calls. The full version — with rationale
and worked examples — lives in
[philosophy.md](.agents/context/philosophy.md).

1. **A personal tool that might generalise — in that order.** Ideas earn a
   plan doc only after daily use proves the pain.
2. **Explicit over implicit.** No hidden fallbacks, no silent network
   access, no magic defaults.
3. **Built-ins over dependencies.** Two production deps. Adding a third is a
   decision to raise, not a detail to slip in.
4. **Every change lands green.** Independently landable phases; `pnpm check`
   passes before a phase is done.
5. **Humans own canon, agents own drafts.** Findings go to
   `.agents/memory/`, never straight into `.agents/context/`.
6. **Stability over speed.** A pattern seen once is an observation; only
   repeated patterns get promoted.
7. **Ask before assuming.** Confirm before changing public behaviour, then
   work in small reviewable steps.

<!--

## Your instructions here

Gemini-specific rules go below. Anything that applies to every harness
belongs in `.agents/`, not here.

-->
