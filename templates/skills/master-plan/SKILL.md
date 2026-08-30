---
name: master-plan
description: Decompose a non-trivial refactor or feature into numbered, commit-sized phases with acceptance gates. Use before starting any multi-step change that will land across several commits (e.g. folder restructures, cross-cutting renames, staged migrations). Skip for one-shot fixes.
metadata:
  author: a2scaffold
  version: '1.0'
---

## Trigger

Activate this skill when the request matches **all** of:

- The change touches multiple files or concerns (not a single-spot fix).
- The change can be staged — each step leaves the repo's check command
  green and the tree shippable.
- The user has not already given you an explicit phase breakdown.

Skip for typo fixes, single-function tweaks, or docs-only edits — the
planning overhead exceeds the work.

## Procedure

### 1. Restate the goal in one sentence

Write the end state in the form:
`<verb> <subject> so that <outcome>`.

If you can't compress it to one sentence, the scope is too broad — ask
the user to split the request before planning.

### 2. Find the gate, then list the invariants

**The gate is the repo's own check command. Find it, do not guess it**, in
this order:

1. `.agents/context/` — a scaffolded repo states its conventions there.
2. The manifest's script block — `package.json`, `Makefile`, `justfile`,
   `pyproject.toml`, `Cargo.toml`.
3. The CI workflow, which runs the real gate whatever the docs say.

Then enumerate what must stay true across every phase:

- The gate passes after **each** commit, not just at the end.
- The public surface is unchanged — exported API, CLI flags, file formats —
  unless changing it is the goal.
- Any invariant the user called out explicitly.

These become the acceptance criteria for each phase.

### 3. Draft phases

One phase = one commit. Each phase must:

- Have a verb-led title, naming a real path (e.g. "Phase 4 — split
  `<path/to/oversized-module>` into per-concern files").
- Be reviewable in isolation — no phase depends on a later phase to
  pass tests.
- Name the files touched (paths, not vague areas).
- State the acceptance gate — the check command from step 2, plus any
  manual smoke the change needs.

Target 3–8 phases. More than 8 means the steps are too small; fewer
than 3 means the work doesn't need this skill.

### 4. Write the plan to `.agents/plan/cycles/Round_NNN.md`

**Copy `.agents/plan/cycles/_TEMPLATE.md`** — do not invent a layout. The
round file is read by the PDCA lifecycle, the Definition of Done, and anything
that asks "which round decided X?", and all of those expect its sections.
Use the next unused number, zero-padded to three digits.

Fill the template's own sections; the plan goes in `## Plan`:

```markdown
## Plan

**Invariants** — true after every phase, not just the last:

- <invariant 1>
- <invariant 2>

### Phase 1 — <verb-led title>

- **Files:** `path/a.js`, `path/b.js`
- **Change:** <what happens>
- **Gate:** <the repo's check command> + <any extra check>

### Phase 2 — ...
```

Leave `## Do`, `## Check` and `## Act` empty for now — they are filled during
execution, in steps 6 and 7. Set `**Status**: Planning` and `**Part of**`
before you post the plan back.

### 5. Confirm with the user before executing

Post the phase list back. Wait for explicit approval (or amendments)
before starting Phase 1. Do **not** bundle multiple phases into one
commit unless the user asks.

### 6. Execute one phase at a time

For each phase:

1. Make the edits.
2. Run the gate from step 2. All of it — not the subset you think is
   affected.
3. Commit with a message matching the repo's own convention. Do not
   invent one — read `commitlint.config.js`, `CONTRIBUTING.md`, or the
   last twenty subjects from `git log --oneline`, in that order.
4. Report completion and move to the next phase.

If a gate fails, **stop** and report. Do not skip phases or amend
a green commit to squeeze in later work.

### 7. Close the round

Fill in the round file's own closing sections — `## Check` (including what you
could **not** verify) and `## Act` — then move `**Status**` to `Review`. If the
round produced knowledge worth keeping, append an entry to
`.agents/plan/promotions.md`. The plan stays in `## Plan` as the record of what
was planned versus what shipped.
