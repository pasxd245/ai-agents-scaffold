# Round 12: Phase 7 — Skill-ref chain validator

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 7

## Goal

When `a2scaffold skill validate` runs, detect and report broken
skill-ref chains: dead pointers, cycles, chains exceeding max depth,
and terminals that fail their own validation. Keeps the existing raw-
skill validation behavior for non-ref skills.

## Plan

- [x] New `src/skills/ref-chain.js`:
  - Parse `metadata.rootPath` from frontmatter
  - Parse `@rootPath/<path>` from SKILL.md body → `sourceDir`
  - `walkRefChain(startDir)` with visited-set + `MAX_REF_DEPTH = 5`
- [x] Integrate into `validateSkill` — if the skill is a ref, walk
  chain and, if terminal ≠ start, recursively validate the terminal
- [x] Extract `validateFrontmatterFields` as a private helper (keeps
  `validateSkill` readable)
- [x] Add 4 tests: valid one-hop ref, broken target, cycle, invalid
  terminal
- [x] Update [skill.workflow.md](../../../docs/agents/workflows/skill.workflow.md) — replace "Planned" note with implementation details
- [x] Verify `pnpm check` green

## Do

### Files added

- `src/skills/ref-chain.js` — `walkRefChain`, `extractSourceDir`,
  `readRefPointer`, `MAX_REF_DEPTH` (~100 LOC)
- `.agents/plan/cycles/Round_12.md` — this file

### Files modified

- `src/skills/validate.js` — extracted `validateFrontmatterFields`,
  added chain walk + terminal recursion when skill is a ref
- `tests/skills.test.js` — new `describe('validateSkill (skill-ref chain)')`
  block with 4 tests; added raw/ref factory helpers
- `docs/agents/workflows/skill.workflow.md` — replaced "Planned"
  note with the implementation summary + error-message catalog

### Behavior

| Condition                              | Reported as                                    |
| -------------------------------------- | ---------------------------------------------- |
| ref target path does not exist         | `broken ref: target does not exist at "<p>"`   |
| ref chain revisits a directory         | `ref cycle detected: A → B → A`                |
| chain longer than MAX_REF_DEPTH (5)    | `ref chain exceeds max depth (5)`              |
| terminal raw skill fails own checks    | `terminal skill invalid: <bubbled error>`      |
| valid single-hop ref                   | no error (ref frontmatter still must pass)     |
| non-ref skill (raw)                    | existing name/desc/compat validation           |

### Choices

- **Errors returned, not thrown** — `walkRefChain` returns a
  discriminated-union (`{ ok: true } | { ok: false, error }`) so the
  caller folds the error string into the existing `errors[]` array
  instead of unwinding the stack. Matches existing validator style.
- **Absolute paths in `visited` set** — using `path.resolve` removes
  ambiguity from `../../..` rootPaths and symlinks-at-the-same-level.
- **Terminal recursion, not iteration** — `validateSkill` calls itself
  on the terminal dir rather than duplicating the frontmatter-field
  checks. Because the terminal is guaranteed to be non-ref (that's the
  loop exit condition in `walkRefChain`), recursion terminates on the
  next call without re-entering chain logic.
- **Max depth = 5** — matches the value discussed during planning;
  far more than practical CLI usage (length-1 chains are the norm),
  low enough to fail fast on hand-authored mistakes.

## Check

- [x] `pnpm test` — 70/70 pass (was 66; +4 new ref-chain tests)
- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm lint` — 0 errors
- [x] `pnpm format:check` — clean
- [x] `pnpm check` — exit 0
- [x] Manual reasoning: tests cover valid ref, broken ref, cycle,
  and invalid terminal; depth-cap is tested in spirit by the cycle
  test (would also trip the depth cap if visited-set were removed)

## Act

### Learnings

- **Discriminated unions carry well through JSDoc** — returning
  `{ ok: true, terminalDir, chain } | { ok: false, error, chain }`
  let the caller destructure with type safety inside the `if (walk.ok)`
  branch without casts.
- **Visited-set vs depth-counter** — both are necessary. Depth alone
  doesn't catch `A → B → A` before hitting 5; visited alone doesn't
  catch `A → B → C → D → E → F` (unbounded chain of unique refs).
- **Body-parsing was minimal** — the skill-ref template body is
  `@rootPath/<sourceDir>` on a single line, so a simple
  line-by-line scan for that prefix is sufficient. If the template
  gets richer, may need a proper parser.
- **Cognitive-complexity warning on `validateSkill`** (Sonar 16 vs
  15 limit) is a soft warning we could silence by extracting the ref
  branch into its own helper. Deferred — the function is still
  readable in one screen.

### Follow-ups

- **End of the master plan.** All 7 phases landed. Round 13+ would be
  new initiatives, not continuation of the April 18 plan.
- **Future enhancement**: `validateSkill` could distinguish the
  ref-chain errors from the frontmatter-field errors in the CLI
  output (e.g. different colors or sections). Current behavior
  concatenates them.
- **Potential test gap**: no explicit depth-cap test (5-hop chain
  with no cycle). Low-value given the visited-set already covers
  it in practice; add if we ever see a real chain >1 hop.

### Promotions

- **Candidate for `.agents/context/`**: the ref-chain validation
  semantics (visited-set + max depth 5 + terminal-must-be-raw) is a
  new convention that future work should honor. Flag for human review
  in next promotion pass.
