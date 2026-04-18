# Round 11: Phase 6 — Docs uplift

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 6

## Goal

Bring user-facing and shared docs in line with the post-refactor
layout. Kill stale paths (`src/skills.js`, `bin/cli.js`, etc.) in
docs + ToC. Keep historical cycles and the master plan's
descriptive-state sections as point-in-time records.

## Plan

- [x] Scan docs/ for stale source paths
- [x] Update `docs/ToC.md` source entry table to reflect final layout
- [x] Update workflow line refs (skill.workflow.md)
- [x] Update `.agents/context/skill-refs.md` implementation pointer
- [x] Verify pnpm check green

## Do

### Files modified

- `docs/ToC.md`:
  - Rewrote "Source entry points" table — rows now point to the
    folder barrels (`src/scaffold/`, `src/skills/`, `src/templates/`,
    `src/cli/`, `src/utils/`) plus `src/index.js` and
    `bin/a2scaffold`. Dropped the old per-file rows (`scaffold.js`,
    `skills.js`, `templates.js`).
  - Updated the inline-reference example in "How to use this index"
    from `src/skills.js#L32` → `src/skills/validate.js#L14`.
- `docs/agents/workflows/skill.workflow.md`:
  - "Validation rules" pointer updated from
    `src/skills.js#L32` → `src/skills/validate.js`.
- `.agents/context/skill-refs.md`:
  - Implementation pointer: `src/skills.js` → `src/skills/ref.js`.

### What I did NOT touch (by design)

- **Historical PDCA cycles** (`Round_01.md`, `Round_04.md`,
  `Round_05.md`, `Round_06.md`, `Round_07.md`, `Round_08.md`,
  `Round_09.md`, `Round_10.md`) — these are point-in-time records of
  what was true when each round ran. Rewriting them would destroy
  history.
- **Master plan** (`docs/agents/plan/20260418-repo-refactor.plan.md`) —
  its "Current State" section describes the pre-refactor layout on
  purpose. Keeping it as-is preserves the journey documentation.
  Only the "Changelog" section at the bottom gets appended.
- **Authoritative READ-ONLY**
  (`.agents/skills/create-template/SKILL.md`,
  `.agents/prompts/create-template.prompt.md`) — out of scope for
  agent edits without explicit human instruction. Minor path staleness
  won't break functionality.

## Check

- [x] `pnpm lint:md` — 0 errors (21 files linted)
- [x] `pnpm format:check` — clean (after `pnpm format` realigned ToC table)
- [x] `pnpm check` — exit 0, 66/66 tests pass
- [x] Manual: all ToC links resolve to real files/directories
- [x] Manual: `.agents/context/skill-refs.md` now points to the real ref module

## Act

### Learnings

- **Historical docs stay historical.** The instinct was to
  retroactively update everything, but the PDCA cycles are the
  repo's memory of how decisions were made — rewriting them
  removes signal. Same reason the master plan's "Current State"
  section is intentionally frozen at 2026-04-18.
- **Folder rows in ToC > per-file rows.** After the split, each
  concern has 3–7 files. Listing every file would bloat ToC and
  churn with every split. Linking to the folder + a one-line role
  description tells contributors where to open first.
- **Prettier + markdownlint auto-fix the table alignment**, so I can
  stop hand-padding pipe columns. Still need to run `pnpm format`
  before commit (or rely on the pre-commit hook).

### Follow-ups for next phases

- **Phase 7 (Round 12)**: implement ref-chain validator in
  `src/skills/validate.js`. The workflow doc's "Planned" note about
  ref-chain checks becomes reality; update
  `skill.workflow.md#skill-validate` then.
- If the master plan is ever migrated to a new date/version, capture
  the "Current State" diff instead of rewriting — useful as a
  before/after.

### Promotions

- None this round. (Path updates are housekeeping, not reusable
  knowledge.)
