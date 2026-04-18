# Round 08: Phase 3 — Split `src/cli/`

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 3

## Goal

Break the single-file CLI (`src/cli/main.js`, ~450 LOC) into a cohesive
tree: a thin dispatcher (`index.js`), a help/version module, an args
module, and one file per subcommand under `commands/`. No behavior
change; all 66 tests still pass.

## Plan

- [x] Extract help text + `pkg` loader → `src/cli/help.js`
- [x] Extract arg-parsing helpers → `src/cli/args.js`
      (`detectCommand`, `parseSkillArgs`, `parseSkillRefArgs`, plus
      internal `isValueFlag` / `findFirstPositional`)
- [x] One file per subcommand under `src/cli/commands/`:
      `scaffold.js`, `skill-add.js`, `skill-list.js`,
      `skill-validate.js`, `skill-ref.js`
- [x] Skill dispatcher `src/cli/commands/skill.js`
- [x] Lean entry `src/cli/index.js` exposing `run()`
- [x] Retarget `bin/a2scaffold` to `src/cli/index.js`
- [x] Delete `src/cli/main.js`
- [x] Verify `pnpm check` + CLI smoke tests green

## Do

### Files added

- `src/cli/help.js` — loads `package.json`; exports `HELP`, `pkg`
- `src/cli/args.js` — `detectCommand`, `parseSkillArgs`, `parseSkillRefArgs` (+ private helpers)
- `src/cli/commands/scaffold.js` — `runScaffold` + private `listOutputFiles`
- `src/cli/commands/skill-add.js` — `runSkillAdd`
- `src/cli/commands/skill-list.js` — `runSkillList`
- `src/cli/commands/skill-validate.js` — `runSkillValidate`
- `src/cli/commands/skill-ref.js` — `runSkillRef`
- `src/cli/commands/skill.js` — skill dispatcher
- `src/cli/index.js` — top-level `run()` (imports two command entry points)
- `.agents/plan/cycles/Round_08.md` — this file

### Files modified

- `bin/a2scaffold` — import path updated to `../src/cli/index.js`

### Files deleted

- `src/cli/main.js` — superseded by the split layout

### LOC profile (after split)

| File                                   | LOC |
| -------------------------------------- | --- |
| `src/cli/index.js`                     | ~24 |
| `src/cli/help.js`                      | ~62 |
| `src/cli/args.js`                      | ~114|
| `src/cli/commands/scaffold.js`         | ~127|
| `src/cli/commands/skill.js`            | ~40 |
| `src/cli/commands/skill-add.js`        | ~18 |
| `src/cli/commands/skill-list.js`       | ~17 |
| `src/cli/commands/skill-validate.js`   | ~44 |
| `src/cli/commands/skill-ref.js`        | ~11 |

(Previously `main.js` was ~450 LOC single-file.)

### Choices

- **`scaffold.js` still owns `listOutputFiles` as private**. It's only
  called for `--dry-run`; not worth a shared util module until another
  caller appears.
- **`skill-ref.js` calls `parseSkillRefArgs` directly**, not through
  `commands/skill.js`. Mirrors the pre-split behavior where `ref` had
  its own argv parser bypassing `parseSkillArgs`.
- **`help.js` owns the `pkg` loader.** Both `HELP` and `--version`
  need the version — centralizing the JSON read keeps loading to once.

## Check

- [x] `node bin/a2scaffold --version` → `0.0.2`
- [x] `node bin/a2scaffold --list` → prints templates
- [x] `pnpm test` — 66/66 pass (all CLI spawn-tests go through new index.js)
- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm lint` — 0 errors
- [x] `pnpm format:check` — clean
- [x] `pnpm check` — exit 0

## Act

### Learnings

- **Per-command file pattern lands cleanly** — each subcommand's deps
  are now literally a few imports. Adding a new subcommand =
  `commands/<name>.js` + one case in `commands/skill.js` (or a new
  top-level dispatch branch in `index.js`).
- **Circular import risk dodged** by keeping `skill.js` dispatcher only
  dependent on leaf commands, and the leaves depending on utility
  modules, never upward. Import graph is a DAG.
- **`pkg` export shape** (with `@type` annotation `{ version: string }`)
  works around TS's `JSON.parse` returning `any` while staying JSDoc-only.

### Follow-ups for next phases

- **Phase 4 (Round 09)**: split `src/skills.js` (~500 LOC) along
  boundaries listed in master plan §3. Move `parseFrontmatter` into
  `src/utils/frontmatter.js` so `Frontmatter` / `ParsedSkill` typedefs
  can be reused by the validator ref-chain work in Phase 7.
- **Phase 5 (Round 10)**: move `src/safety.js` → `src/utils/safety.js`,
  factor out `src/utils/download.js` (git sparse-checkout).
- If Phase 7's ref-chain validator needs new helpers, the natural home
  is `src/skills/validate.js` (after Phase 4) — don't pre-stage here.

### Promotions

- None this round
