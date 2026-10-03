# Idea: a repo "ledger" built by `a2scaffold ledger build`

**Date**: 2026-10-03
**Agent**: Claude Code (Opus 5.5)
**Confidence**: Low — an idea from a conversation with the author, not
validated by use; the pain behind it has evidence, the design does not
**Status**: New
**Source**: a conversation in which the author proposed that `.agents/` grow a
"ledger" for the repo, and asked for it to be parked here to think about
further — no round, no plan doc
**Review-by**: 2026-12-03 — two months; by then either the hand-built
experiment below has run or the idea should be dropped or re-argued

## Problem

Knowledge about the repo's current state is spread across `plan/cycles/`,
`plan/promotions.md`, `plan/programs/`, `memory/`, the parking lot in
`docs/agents/plan/ecosystem-ideas.draft.md`, and `git log`. Nothing joins
them, so every question of the form "what does this new thing touch, and
what will the repo look like after it lands?" is answered from scratch.

## Finding

The author's idea, as stated:

```text
a2scaffold ledger build
   │  distil + accumulate selected knowledge about the repo itself
   ▼
 LEDGER  — the repo's state, accumulated
   │
   ▼  anything that comes in (issue, idea, PR, memory)
 impact on now   vs   what the repo becomes after it is implemented
   │
   ▼
 analysis · enrichment · planning · recommendations
```

Design points raised in the conversation, none decided:

1. **Split it in two.** `ledger build` is deterministic, a CLI with no LLM:
   it reads rounds, promotions, `decisions/`, `programs/`, memory headers
   (`Status`, `Review-by`), `git log`, version and test counts, and stamps
   the result with the commit SHA. Distilling, impact analysis and
   recommendations are a skill or prompt an agent runs with the ledger as
   input. The split follows philosophy #2 (no silent network access) and #3
   (no LLM dependency in the CLI).
2. **Derived, never authored.** `context/` is rules (human, authoritative),
   `memory/` is drafts (agent); the ledger is computed from both and
   regenerable. Being disposable keeps it outside the authority table.
3. **Entry shape**, a sketch only:

   ```yaml
   - id: open/sync-orphans
     kind: open-item # capability | decision | invariant | open-item | metric | debt
     source: memory/2026-09-16-pre-release-adversarial-review.md
     since: 2026-09-16
     status: open
     affects: [src/scaffold/sync, decision/gemini-axis]
   ```

   Impact analysis walks `affects`: "now" is the entries an incoming item
   touches or contradicts; "after" is the entries it changes, adds or closes.

4. **Risks.** A wrong ledger is worse than none, hence regenerable and
   SHA-stamped. It can drift into a second `context/`. It must be on-demand,
   never loaded per session: `AGENTS.md` sits at 97 of its 100 lines.
5. **Tension with existing canon.** [plan/PDCA.md](../plan/PDCA.md) drops
   "file-by-file ledgers" when compacting rounds. A repo ledger has to say
   how it differs from what that rule removes.

## Evidence

- `memory/2026-09-28-what-comes-after-round-016.md` is a hand-built ledger:
  it gathered open work from four memory files, a closed round's backlog, a
  program and a parking lot, measured the repo, and ranked the result. It
  took a session and carries its own `Review-by`, because it goes stale.
- `context/harness-behaviour.md` was wrong from 2026-09-23 to 2026-09-28
  while the template was right; a ledger tracking source, date and
  review-by per entry is the kind of thing that could have flagged it.

## Open questions

- **Scope**: a product feature (every scaffolded repo gets `ledger build`),
  or a tool for this repo first?
- **Reader**: mainly agents (structured YAML/JSON) or humans (markdown)?
- **Where it lives**: under `.agents/` (and so which authority row), or
  generated into a gitignored path?
- **What counts as "anything that comes in"**, and what the impact report
  looks like.

## Recommendation

**Do**: before any code, hand-build a ledger for this repo and run two or
three real items through it — e.g. "release v0.3.0" and "seeded canon
rots" from the 2026-09-28 ranking. Compare the impact analysis with and
without it. Open a round only if it is clearly better or faster
(philosophy #1).
**Don't**: write `ledger build` first and look for a use afterwards, or let
the ledger become hand-maintained.

## Promotion candidate?

- [ ] `context/` — stable, broadly applicable, seen more than once
- [ ] `skills/` — a reusable procedure with a clear trigger
- [x] Not yet — an idea; needs the experiment above
