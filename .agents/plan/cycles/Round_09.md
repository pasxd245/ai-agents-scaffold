# Round 09: Phase 4 — Split `src/skills/`

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 4

## Goal

Break the single-file `src/skills.js` (~500 LOC) into cohesive
sub-modules under `src/skills/`, and extract shared `parseFrontmatter`
into `src/utils/frontmatter.js`. Keep the public API surface identical.

## Plan

- [x] Extract `parseFrontmatter` + typedefs → `src/utils/frontmatter.js`
- [x] Split `src/skills.js` along:
  - `parse-source.js` — `parseSkillSource`
  - `validate.js` — `validateSkill` + name/desc/compat constants
  - `list.js` — `listSkills`, `discoverSkills`, `isSkillRef`
  - `install.js` — `installSkill`, `installFromLocal`, `installFromGitHub`
  - `ref.js` — `installSkillRef`, `resolveSkillsToRef`, `checkDestConflict`
  - `index.js` — public API barrel
- [x] Update `src/index.js` to re-export from `./skills/index.js`
- [x] Update CLI subcommand imports (`src/cli/commands/skill-*.js`)
- [x] Update `tests/skills.test.js` import path
- [x] Delete `src/skills.js`
- [x] Verify `pnpm check` green

## Do

### Files added

- `src/utils/frontmatter.js` — shared `parseFrontmatter` + `Frontmatter`/`ParsedFrontmatter` typedefs
- `src/skills/parse-source.js`
- `src/skills/validate.js`
- `src/skills/list.js` (includes `isSkillRef`)
- `src/skills/install.js`
- `src/skills/ref.js`
- `src/skills/index.js` — public API barrel
- `.agents/plan/cycles/Round_09.md` — this file

### Files modified

- `src/index.js` — imports now point at `./skills/index.js`
- `src/cli/commands/{skill-add,skill-list,skill-validate,skill-ref}.js` — import paths updated to `../../skills/index.js`
- `tests/skills.test.js` — import path updated

### Files deleted

- `src/skills.js` — superseded by the split

### LOC profile (after split)

| File                          | LOC |
| ----------------------------- | --- |
| `src/utils/frontmatter.js`    | ~22 |
| `src/skills/index.js`         | ~5  |
| `src/skills/parse-source.js`  | ~54 |
| `src/skills/validate.js`      | ~84 |
| `src/skills/list.js`          | ~120|
| `src/skills/install.js`       | ~140|
| `src/skills/ref.js`           | ~130|

All files ≤ 140 LOC (plan called for ≤150). Previously `skills.js` was ~520 LOC single-file.

### Choices

- **`isSkillRef` lives in `list.js`** — it reads SKILL.md and is
  thematically close to `listSkills`/`discoverSkills` (all three
  enumerate or inspect skill directories). Both `install.js` (future
  use) and `ref.js` (current use in `checkDestConflict` + passthrough)
  import it from `list.js`.
- **`Frontmatter` / `ParsedFrontmatter` typedefs** moved from
  `src/skills.js` into `src/utils/frontmatter.js`. Renamed from
  `ParsedSkill` → `ParsedFrontmatter` since the helper is
  markdown-agnostic (any file with YAML frontmatter).
- **Dependency graph is strictly DAG**:
  `utils/frontmatter ← validate, list`
  `parse-source ← install`
  `validate ← install`
  `list ← ref`
  `scaffold ← ref`
  No cycles.

## Check

- [x] `pnpm test` — 66/66 pass (all import paths working)
- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm lint` — 0 errors
- [x] `pnpm format:check` — clean
- [x] `pnpm check` — exit 0

## Act

### Learnings

- **Barrel `index.js` pattern for the public API** — kept
  `src/index.js` as-is (re-exports from `./skills/index.js`). External
  consumers see no change; internal files are free to move within
  `skills/` without rippling.
- **Typedef locations matter for JSDoc `@type` references** — moving
  `Frontmatter` into `utils/frontmatter.js` works because
  `list.js`/`validate.js` import `parseFrontmatter` and get the typedef
  "virtually" through TS's module resolution. No need to re-declare
  the typedef in consuming files.
- **CLI commands import through barrel** — `import { installSkill }
  from '../../skills/index.js'`. This costs one extra directory hop
  but keeps the contract at the `skills/` boundary.

### Follow-ups for next phases

- **Phase 5 (Round 10)**: move `src/safety.js` → `src/utils/safety.js`
  and extract git-sparse-checkout → `src/utils/download.js`. Also
  consider moving `scaffold/deepMerge` into `utils/` if it grows
  consumers.
- **Phase 7 (Round 12)**: ref-chain validator will live in
  `src/skills/validate.js`. It needs `isSkillRef` (from
  `./list.js`) — add that import when implementing. Watch for cycles:
  if `list.js` ever needs something from `validate.js`, split
  differently.

### Promotions

- None this round
