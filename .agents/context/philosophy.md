# Philosophy — a2scaffold

> Canonical. The principles that decide close calls when the rules do not
> cover the case. Summarised in the root instruction files
> ([CLAUDE.md](../../CLAUDE.md), [AGENTS.md](../../AGENTS.md),
> [GEMINI.md](../../GEMINI.md)); this is the authoritative version.
>
> A principle earns a place here only after it has settled a real
> disagreement. If it has never been tested, it is an aspiration, not a
> principle — keep it in `.agents/memory/` until it has.

---

## Product

### 1. A personal tool that might generalise — in that order

`a2scaffold` exists because copy-pasting `AGENTS.md` snippets between repos
was annoying. It is not a platform, and it carries no vision statement, no
horizon, and no 1.0 promise.

The working hypothesis is stated so it can be falsified:

> A single CLI that scaffolds `.agents/` governance + composable skills into
> any repo beats copy-pasting snippets — at least for the author.

**In practice**: an idea gets a plan doc only after daily use surfaces the
pain it solves. Everything else waits in the parking lot of
[ecosystem-ideas.draft.md](../../docs/agents/plan/ecosystem-ideas.draft.md).

### 2. Keep the discards

Rejected ideas stay written down, with the reason. A list of what was built
without the list of what was refused reads as if nothing was ever traded
away.

**In practice**: killing an idea means moving it to the "Discarded" section
with a one-line reason — not deleting it.

### 3. Paths are the grouping

`templates/scaffold/base/`, `templates/skills/planning/master-plan/` — the
directory path _is_ the namespace. No manifest, no registry schema, no
grouping metadata to keep in sync with the filesystem.

**In practice**: before adding a config key that describes layout, check
whether a directory would say the same thing.

---

## Engineering

### 4. Explicit over implicit

No hidden fallbacks, no silent network access, no magic defaults. If the
tool is about to do something the user did not ask for, it stops and says
so.

**In practice**: `skill add foo` resolves locally only. Reaching the network
requires an explicit `--from <registry>`. Failures name the fix rather than
guessing at intent:

```text
✗ skill 'foo' not found locally.
  Try: a2scaffold skill add foo --from main
```

### 5. Built-ins over dependencies

Two production dependencies (`@nci-gis/js-tmpl`, `js-yaml`). Arg parsing is
`node:util parseArgs`; tests are `node:test`. Type safety is JSDoc plus
`tsc --noEmit` — no build step.

**In practice**: adding a dependency is a decision to raise with the human,
not a detail to slip into a diff.

### 6. Every change lands green

Refactors ship as independently landable phases. No "WIP" merges to `main`,
no partial states, no phase that only makes sense once the next one lands.

**In practice**: `pnpm check` (lint + format + typecheck + test) passes
before a phase is called done. Pre-commit hooks are a convenience; CI is the
gate.

---

## Collaboration

### 7. Humans own canon, agents own drafts

`.agents/context/`, `.agents/prompts/`, and `.agents/skills/` are
human-curated and authoritative. `.agents/memory/` is where agents write.
A discovery that contradicts canon does not edit canon — it becomes a memory
file flagged for review.

**In practice**: promotion from `memory/` to `context/` requires human review
and a log entry in [promotions.md](../plan/promotions.md). Full authority
table in [AGENTS.md](../AGENTS.md).

### 8. Stability over speed

A pattern seen once is an observation. A pattern seen repeatedly, across
different tasks, is a convention. Only conventions get promoted.

**In practice**: promotion to `context/` wants a pattern validated three or
more times and broadly applicable.

### 9. Ask before assuming; small steps over big rewrites

The human partner knows the intent better than the agent does. Confirm
before changing public behaviour, then work in increments that can each be
reviewed and reverted on their own.

**In practice**: state the ambiguity and the assumption you would make, do
everything the ambiguity does not block, and ask at the point where it
actually matters.

### 10. One knowledge base, thin harness stubs

Claude Code, Codex, Gemini CLI, and Copilot each read a different file.
Those files are stubs. The knowledge lives once, in `.agents/`, and each
stub points at it — inline via `@` import where the harness supports it,
by explicit instruction where it does not.

**In practice**: project knowledge is never written into a harness stub. If
it matters to more than one agent, it belongs in `.agents/`. See
[Root instruction files](../AGENTS.md#root-instruction-files).

---

## How to change this file

`.agents/context/` is human-owned and authoritative. Agents must not edit it
directly.

To propose a change: write the finding to `.agents/memory/`, flag it for
review, and let the human promote it — logging the promotion in
[plan/promotions.md](../plan/promotions.md).
