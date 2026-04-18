# Round 10: Phase 5 — Split scaffold/templates/utils

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 5

## Goal

Complete the migration to the final folder-barrel layout. Convert the
remaining single-file modules (`src/scaffold.js`, `src/safety.js`,
`src/templates.js`) into `src/<concern>/` directories with an
`index.js` barrel. Extract the GitHub clone helper into a reusable
`src/utils/download.js`.

## Plan

- [x] Create `src/scaffold/index.js` (from `src/scaffold.js`), adjust `templates` import
- [x] Create `src/scaffold/conflicts.js` (from `src/safety.js`, renamed)
- [x] Create `src/templates/index.js` (from `src/templates.js`, adjusted `TEMPLATES_DIR`)
- [x] Create `src/utils/download.js` — `sparseCloneGitHub(opts, callback)`
- [x] Rewrite `installFromGitHub` in `src/skills/install.js` to delegate
  all cloning to `sparseCloneGitHub`; keep skill-specific "multi-skill
  dir" error messaging inside the callback
- [x] Re-export `checkExistingFiles` from `src/scaffold/index.js` barrel
  (convenience — consumers can still import from `./conflicts.js`)
- [x] Update `src/index.js` to re-export from new locations
- [x] Update `src/skills/ref.js`, `src/cli/commands/scaffold.js` imports
- [x] Update `tests/scaffold.test.js`, `tests/templates.test.js` imports
- [x] Delete old `src/{scaffold,safety,templates}.js`
- [x] Verify `pnpm check` green

## Do

### Files added

- `src/scaffold/index.js` — `scaffold()` + private `deepMerge`, re-exports `checkExistingFiles`
- `src/scaffold/conflicts.js` — `checkExistingFiles` (moved from `src/safety.js`, including private `predictOutputPaths`)
- `src/templates/index.js` — `listTemplates` + `resolveTemplatePath` (`TEMPLATES_DIR` now resolves via `'../../templates'` relative to `src/templates/index.js`)
- `src/utils/download.js` — `sparseCloneGitHub({ owner, repo, ref, subPath }, callback)`. Generic, parameterized over any GitHub repo + callback pattern; not skill-specific.
- `.agents/plan/cycles/Round_10.md` — this file

### Files modified

- `src/index.js` — barrel imports now point at `./scaffold/index.js` and `./templates/index.js`; `checkExistingFiles` re-exported through `scaffold/`
- `src/skills/install.js` — `installFromGitHub` rewritten: dropped inline `fs.mkdtempSync`/`execFileSync` boilerplate; now wraps `sparseCloneGitHub(...)` callback with skill-specific error detection
- `src/skills/ref.js` — import updated (`../scaffold/index.js`)
- `src/cli/commands/scaffold.js` — imports consolidated into two lines (scaffold + templates barrels)
- `tests/scaffold.test.js`, `tests/templates.test.js` — import paths updated

### Files deleted

- `src/scaffold.js`
- `src/safety.js`
- `src/templates.js`

### Target layout achieved

```text
src/
  index.js                 # public API barrel
  cli/
    index.js
    help.js
    args.js
    commands/
      scaffold.js
      skill.js
      skill-add.js
      skill-list.js
      skill-validate.js
      skill-ref.js
  scaffold/
    index.js               # scaffold(), deepMerge, re-exports conflicts
    conflicts.js           # checkExistingFiles
  skills/
    index.js               # barrel
    parse-source.js
    validate.js
    list.js                # listSkills / discoverSkills / isSkillRef
    install.js
    ref.js
  templates/
    index.js               # listTemplates, resolveTemplatePath
  utils/
    frontmatter.js         # parseFrontmatter + typedefs
    download.js            # sparseCloneGitHub
```

Matches [master plan §3](../../../docs/agents/plan/20260418-repo-refactor.plan.md) exactly, except `utils/safety.js` was not created — see Choices.

### Choices

- **No `utils/safety.js` created.** The plan listed it as "path safety
  (moved)" but the only content in the original `src/safety.js` was
  scaffold-conflict detection (`checkExistingFiles` + private
  `predictOutputPaths`). That's a scaffold concern, not a generic path
  utility — moved to `src/scaffold/conflicts.js`. If we later add true
  path-safety helpers (e.g., `assertNoPathEscape`), `src/utils/safety.js`
  can be created then.
- **`sparseCloneGitHub` takes a callback, not a return path.** The
  original `installFromGitHub` had the temp-dir cleanup in a `finally`
  block — the callback pattern keeps that invariant in the helper
  without forcing callers to remember to delete the temp dir.
- **`scaffold/index.js` re-exports `checkExistingFiles`.** Consumers
  have two paths: `import { checkExistingFiles } from 'a2scaffold'`
  (via root barrel) or `import { checkExistingFiles } from
  'a2scaffold/scaffold/index.js'` (internal). Both resolve through
  `scaffold/conflicts.js`.
- **`TEMPLATES_DIR` path depth** — `src/templates/index.js` resolves
  `../../templates` (two levels up to repo root) instead of `../templates`
  (one level). Caught by test failures on first run.

## Check

- [x] `pnpm test` — 66/66 pass (includes scaffold, templates, skills, cli)
- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm lint` — 0 errors
- [x] `pnpm format:check` — clean
- [x] `pnpm check` — exit 0

## Act

### Learnings

- **Callback-style resource lifecycle** — `sparseCloneGitHub(opts,
  cb)` is ~50 LOC cleaner than exposing (tmpDir, cleanup()) and forcing
  the caller to wrap in `try/finally`. Regret: not using this pattern
  earlier.
- **TEMPLATES_DIR relative path** — moving `templates.js` → `templates/index.js`
  changed the filesystem depth from 1 to 2. Tests caught it immediately,
  but good reminder that `import.meta.url`-relative paths are fragile
  across file moves.
- **Barrels vs direct imports** — kept both paths working. Internal
  modules can still import `./conflicts.js` directly for tree-shaking
  in the future.

### Follow-ups for next phases

- **Phase 6 (Round 11)**: docs uplift — `docs/agents/workflows/` needs
  new entries for template & ref flows, and existing workflow diagrams
  should reference new file paths. Refresh `docs/api.md` for any
  programmatic-import-path changes.
- **Phase 7 (Round 12)**: ref-chain validator in `src/skills/validate.js`.
  Imports `isSkillRef` from `src/skills/list.js`. Watch for cycles.
- **Possible future refactor**: if `deepMerge` gets a second consumer,
  promote to `src/utils/merge.js`. Not yet.
- **Possible future refactor**: `src/cli/args.js` contains a
  `process.exit` in `parseSkillRefArgs`. Cleaner would be to throw and
  let the top-level `.catch` in `bin/a2scaffold` handle exit codes.
  Defer to its own round — affects error paths in 3 places.

### Promotions

- None this round. (Target layout achievement belongs in the master
  plan's changelog, not in `.agents/context/`.)
