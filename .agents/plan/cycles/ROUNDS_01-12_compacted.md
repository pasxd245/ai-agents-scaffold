# PDCA Cycles — Compacted History (Rounds 01–12)

> Compacted summary of Rounds 01–12. The 12 original `Round_NN.md` files
> were removed in this pass after their load-bearing content was folded
> in. Recover any individual round from `git log -- .agents/plan/cycles/`.
> Generated 2026-05-07.

Per round: status, dates, goal in one line, what shipped, choices worth
remembering, learnings, promotions. Plan/Check checklists, file-by-file
ledgers, LOC tables, and "tests pass" restatements were dropped.

---

## Round 01 — Build CLI scaffolding tool · 2026-02-28 · Complete

**Goal**: Convert the static template repo into a publishable pnpm CLI
(`a2scaffold`) on `@nci-gis/js-tmpl`, multi-template architecture.

**Shipped**: pnpm project; `templates/base/template/` with 10 `.hbs`;
core modules `src/{templates,safety,scaffold,index}.js`; CLI `bin/cli.js`
with `--template/--output/--name/--list/--force/--dry-run`; 19 tests;
21-file `pnpm pack`. Renamed `ai-agents-scaffold` → `a2scaffold`.

**Learnings**:

- `js-tmpl`'s `registerPartials` throws if `partialsDir` doesn't exist —
  every template needed an empty `partials/` (later relaxed in Round 04).
- Bypass `resolveConfig`; build the `renderDirectory` config object
  directly to avoid temp-file writes for merged values.
- Resolve template paths from `import.meta.url`, not user `cwd`.

**Promotions** (landed Round 02): `context/js-tmpl.md`,
`skills/create-template.md`.

---

## Round 02 — Promote learnings + add prompts · 2026-02-28 · Complete

**Goal**: Graduate Round 01 learnings into `context/` + `skills/`; seed
`.agents/prompts/`.

**Shipped**: `context/js-tmpl.md`, `skills/create-template.md`,
`prompts/{validate,create}-template.md`; `promotions.md` updated.

**Learnings**:

- Promotions as their own PDCA round forces explicit verification.
- Separate authority for `context/` (knowledge) and `skills/` (procedure)
  prevents agents from self-promoting unvalidated learnings.
- Prompts complement skills: prompts are open-ended, skills are rigid.

---

## Round 03 — Release readiness: CI/CD + docs · 2026-03-03 · Complete

**Goal**: Prep v0.0.1 — release infra (Actions + git-cliff) and user docs.

**Shipped**: `.github/workflows/{ci,release}.yml`; `cliff.toml` (skips
`chore(release)` and `chore(deps)`); `docs/usage.md`, `docs/api.md`;
`architecture.md` updated.

**Correction (2026-03-05)** — release workflow refactored before tagging:

| Aspect             | Original                  | Final                                     |
| ------------------ | ------------------------- | ----------------------------------------- |
| git-cliff install  | `orhun/git-cliff-action@v4` | `taiki-e/install-action@v2` (2.6.1)     |
| npm auth           | `NPM_TOKEN`               | OIDC (`id-token: write` + `--provenance`) |
| CHANGELOG commit   | bot commits to main       | `peter-evans/create-pull-request@v6` PR  |
| Tag pattern        | `v*.*.*`                  | `v*`                                     |
| `pnpm test`        | `pnpm test`               | `pnpm test --if-present`                 |
| Build step         | absent                    | `pnpm run build --if-present`            |
| Version safety     | absent                    | tag-vs-package.json guard                |
| Dist-tag           | absent                    | `latest`/`next` based on hyphen          |

`context/architecture.md` (Release Pipeline section) reflects the actual
pipeline.

**Learnings**:

- Release workflow needs `fetch-depth: 0` for git-cliff tag history.
- Bot commits need `permissions: contents: write`.
- Keep CI test-only and Release test+publish — fast PR feedback.

---

## Round 04 — `skill ref` subcommand · 2026-03-26 → 2026-04-06 · Review

**Goal**: `a2scaffold skill ref` creates lightweight `SKILL.md` pointer
files (not full copies), shared across `.agents/.claude/.codex/.gemini/.github`.
Local-only v1; GitHub deferred.

**Shipped**: `templates/skill-ref/`; `src/skills.js` gained `isSkillRef`,
`discoverSkills`, `installSkillRef`. CLI `skill ref` flags
`--skill/--from/--to/--force`; `--from` default `.agents`; `--skill all`
mass-creates. Skill-ref passthrough: source already a ref → copy verbatim
(multi-hop without recomputing paths). Extracted
`general_instructions.hbs` partial.

**Learnings**:

- `@nci-gis/js-tmpl@0.0.1` skips partial registration when `partialsDir`
  is omitted — `partials/` no longer mandatory.
- Handlebars partials reduce duplication across agent instruction files.

**Promotions**: `context/skill-refs.md`.

---

## Master plan: 2026-04-18 repo refactor (Rounds 05–12)

Rounds 05–12 execute [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — phases 1, 1.5, 2, 3, 4, 5, 6, 7. All started/completed 2026-04-18, status Review.

---

## Round 05 — Phase 1: tooling baseline

**Goal**: Repo-wide quality gate — Prettier + ESLint + markdownlint +
Husky + lint-staged, unified `pnpm check` wired into CI.

**Shipped**: `.prettierrc.json`, `.prettierignore`, `eslint.config.js`
(flat), `.markdownlint-cli2.jsonc`, `.husky/pre-commit`. `package.json`
scripts: `format`, `format:check`, `lint{,:js,:md}`, `check`, `prepare`;
`lint-staged` block. CI `Test` job → `Check` runs `pnpm check`.

**Learnings**:

- `eslint-plugin-n/no-unsupported-features/node-builtins` was too strict
  for `engines.node >=20` — flagged `fs.cpSync`, `node:test describe/it`.
  Disabled outright; revisit if engines bump to `>=22`.
- `.agents/prompts/**` and `tests/fixtures/**` belong in markdownlint
  ignores — prompts are READ-ONLY authoritative; fixtures are
  intentionally weird.
- Prettier `proseWrap: preserve` + MD `printWidth: 100` keeps hand-rolled
  wraps while still formatting tables.

**Open question flagged**: pure formatting fixes (no content change) in
`.agents/context/` are arguably low-risk. If common, propose an
`AGENTS.md` carve-out for trivial lint-only edits.

---

## Round 06 — Phase 1.5: `--checkJs` baseline

**Goal**: TypeScript as a JSDoc-driven linter — no `.ts`, no emit, green
`pnpm typecheck` in CI.

**Shipped**: `typescript`, `@types/node`, `@types/js-yaml` dev deps.
`tsconfig.json` strict + `allowJs/checkJs/noEmit`, `module:nodenext`,
`target: es2022`; `include` narrowed to `src/**` (+ `types/**/*.d.ts`).
`types/ambient.d.ts` declares `RenderDirectoryConfig` and
`renderDirectory` for `@nci-gis/js-tmpl`. `parseSkillSource` and
`isSkillRef` returns narrowed to discriminated unions.

**Learnings**:

- TypeScript 6.0.3 (`latest`) rejects `node:` prefix imports under
  `module:nodenext` (`TS2591`). **Pinned `typescript@5.9.3`.**
- Cast `yaml.load()` (`unknown`):
  `/** @type {Frontmatter} */ (yaml.load(...) || {})`.
- Discriminated-union return types narrow callers automatically; expose
  missing variants on extension. Used heavily in Rounds 08, 12 too.
- `partialsDir` conditional-property assignment requires an
  explicitly-typed config object — inferred literals freeze shape.
- Ambient `.d.ts` files need explicit `include` globs.

---

## Round 07 — Phase 2: rename `bin/a2scaffold`

**Goal**: Rename CLI binary to `bin/a2scaffold`; move logic to
`src/cli/main.js`; delete `bin/cli.js`.

**Shipped**: `src/cli/main.js` exports `run()` (was self-invoking).
`bin/a2scaffold` rewritten as Node shebang script (was bash wrapper) —
Node shebangs are portable; npm's bin shim handles them. `package.json#bin`
and `tests/cli.test.js` updated. Historical PDCA cycles + authoritative
READ-ONLY files referencing `bin/cli.js` left as-is.

**Learnings**:

- ShellCheck treats extensionless `#!/usr/bin/env node` as shell;
  IDE-only false positives — chose to ignore (matches eslint, prettier).
- `parseArgs` types in TS 5.9 strict are loose
  (`string|boolean|undefined`); pragmatic fix is
  `/** @type {string} */` casts at consumption.
- Pattern: `bin/` is just `catch + exit`; logic stays importable via
  `run()` for future programmatic invocation.

---

## Round 08 — Phase 3: split `src/cli/`

**Goal**: Break `src/cli/main.js` (~450 LOC) into a thin dispatcher,
help/version, args, and one file per subcommand.

**Shipped** (all ≤ ~127 LOC): `src/cli/{index,help,args}.js` +
`src/cli/commands/{scaffold,skill,skill-add,skill-list,skill-validate,skill-ref}.js`.
`bin/a2scaffold` retargeted to `src/cli/index.js`.

**Learnings**:

- Per-command file pattern lands cleanly: new subcommand =
  `commands/<name>.js` + one case in `commands/skill.js`.
- Import graph kept as a DAG: dispatcher → leaves → utils, never upward.

---

## Round 09 — Phase 4: split `src/skills/`

**Goal**: Break `src/skills.js` (~520 LOC) into `src/skills/*` with a
barrel; extract `parseFrontmatter` to `src/utils/frontmatter.js`. Public
API surface unchanged.

**Shipped** (all ≤ 140 LOC):
`src/utils/frontmatter.js` (typedefs renamed `ParsedSkill` →
`ParsedFrontmatter` since helper is markdown-agnostic);
`src/skills/{index,parse-source,validate,list,install,ref}.js`.
`isSkillRef` lives in `list.js` (inspects skill dirs).
`src/index.js` re-exports through `./skills/index.js`.

**Learnings**:

- Barrel `index.js` keeps the external contract stable while internals
  move freely within the folder.
- Typedef location matters for JSDoc `@type` — moving `Frontmatter` into
  `utils/frontmatter.js` lets consumers inherit it via TS module
  resolution; no need to re-declare.

---

## Round 10 — Phase 5: split scaffold/templates/utils

**Goal**: Final folder-barrel layout; extract a reusable GitHub clone
helper.

**Shipped**:

- `src/scaffold/{index,conflicts}.js` — `scaffold()`, private
  `deepMerge`, `checkExistingFiles` re-exported.
- `src/templates/index.js` — `TEMPLATES_DIR` now `../../templates`
  (two levels up; first run failed, tests caught it).
- `src/utils/download.js` — `sparseCloneGitHub({owner,repo,ref,subPath}, cb)`.
  Generic; not skill-specific. `installFromGitHub` rewritten to delegate.
- `src/{scaffold,safety,templates}.js` deleted.

**Final layout**:

```text
src/
  index.js, cli/{index,help,args}.js, cli/commands/*
  scaffold/{index,conflicts}.js
  skills/{index,parse-source,validate,list,install,ref}.js
  templates/index.js
  utils/{frontmatter,download}.js
```

**Choices vs. master plan**:

- **No `utils/safety.js`.** Original `src/safety.js` was scaffold-conflict
  detection (a scaffold concern), so it became
  `src/scaffold/conflicts.js`. Reserve `utils/safety.js` for true
  path-safety helpers (e.g. `assertNoPathEscape`) when needed.
- `sparseCloneGitHub` takes a callback (not returned tmp path) so cleanup
  stays in the helper's `finally`.

**Learnings**:

- Callback-style resource lifecycle is much cleaner than
  `(tmpDir, cleanup)` + `try/finally`. Reach for this pattern earlier.
- `import.meta.url`-relative paths are fragile across file moves.

**Future refactors flagged**: promote `deepMerge` to `utils/merge.js` if
a 2nd consumer appears; replace `process.exit` in `parseSkillRefArgs`
with throw + top-level `.catch` (touches 3 error paths).

---

## Round 11 — Phase 6: docs uplift

**Goal**: Bring user-facing + shared docs in line with post-refactor
layout.

**Shipped**:

- `docs/ToC.md`: "Source entry points" table now points at folder barrels
  (`src/{scaffold,skills,templates,cli,utils}/`) plus `src/index.js` and
  `bin/a2scaffold`; per-file rows dropped. Inline-ref example updated to
  `src/skills/validate.js#L14`.
- `docs/agents/workflows/skill.workflow.md`: validation pointer →
  `src/skills/validate.js`.
- `.agents/context/skill-refs.md`: implementation pointer →
  `src/skills/ref.js`.

**Not touched (by design)**: historical PDCA cycles (point-in-time
records); master plan's "Current State" section (frozen on purpose);
authoritative READ-ONLY (`.agents/skills/create-template/SKILL.md`,
`.agents/prompts/create-template.prompt.md`).

**Learnings**:

- Historical docs stay historical — rewriting cycles destroys signal.
- Folder rows in ToC > per-file rows: each concern has 3–7 files;
  per-file listing bloats ToC and churns with every split.

---

## Round 12 — Phase 7: skill-ref chain validator

**Goal**: `a2scaffold skill validate` should detect dead pointers,
cycles, chains over max depth, and terminals that fail their own
validation. Preserve raw-skill behavior for non-refs.

**Shipped**: `src/skills/ref-chain.js` (~100 LOC) — `walkRefChain`,
`extractSourceDir`, `readRefPointer`, `MAX_REF_DEPTH = 5`.
`validateSkill` extracted `validateFrontmatterFields`; if the skill is a
ref, walks chain and recursively validates the terminal. Tests 66 → 70.

**Reported errors**:

| Condition                              | Reported as                                    |
| -------------------------------------- | ---------------------------------------------- |
| ref target path missing                | `broken ref: target does not exist at "<p>"`   |
| chain revisits a directory             | `ref cycle detected: A → B → A`                |
| chain longer than `MAX_REF_DEPTH`      | `ref chain exceeds max depth (5)`              |
| terminal raw skill fails own checks    | `terminal skill invalid: <bubbled error>`      |
| valid 1-hop ref                        | no error (ref frontmatter still validated)     |
| non-ref skill                          | existing name/desc/compat validation           |

**Choices**:

- Errors as `{ ok: true } | { ok: false, error }` — caller folds into
  existing `errors[]`; matches validator style.
- Visited-set uses absolute paths (`path.resolve`) — handles `../../..`
  rootPaths and same-level symlinks.
- Terminal recursion (not iteration) avoids duplicating field checks;
  terminal is non-ref so recursion stops on next call.
- Max depth = 5: well above practical chains, low enough to fail fast.

**Learnings**:

- Visited-set vs depth counter: **both needed.** Depth alone misses
  `A → B → A`; visited alone misses an unbounded chain of unique refs.
- Skill-ref body is `@rootPath/<sourceDir>` on a single line — prefix
  scan suffices. Revisit if template gets richer.

**Open follow-ups**:

- End of the 2026-04-18 master plan; Round 13+ are new initiatives.
- CLI could distinguish ref-chain errors from frontmatter-field errors
  (sections/colors); currently concatenated.
- No explicit depth-cap test (5-hop chain, no cycle); visited-set covers
  it in practice. Add if a real chain >1 hop appears.

**Promotions**: candidate for `.agents/context/` — ref-chain semantics
(visited-set + max depth 5 + terminal-must-be-raw). Flagged for next
promotion pass.

---

## Cross-round threads

- **Authoritative READ-ONLY discipline** (`.agents/{prompts,skills,context}/`):
  skipped by automated refactors; minor staleness preferred over agent
  rewrites. Open question: carve out trivial lint-only edits? (Rounds 05,
  07, 11.)
- **PDCA cycles are point-in-time**: never retroactively rewritten.
  Even when paths change, old rounds keep original references. (Rounds 07, 11.)
- **Discriminated unions over assertions**: narrow returns through callers
  without `@ts-ignore`. Reach for first. (Rounds 06, 08, 12.)
- **Folder-barrel layout** (`src/<concern>/index.js`) is the project's
  preferred shape after Rounds 08–10. New modules adopt from the start.
- **`pnpm check` is the gate** (Round 05, expanded Round 06). CI calls
  it; pre-commit runs lint-staged subset.
- **TypeScript pinned `5.9.3`** (Round 06) — not `latest` until TS 6.x
  fixes `node:` imports under `module:nodenext`.
- **Skill-ref chain rules** (Round 12): max depth 5, visited-set,
  terminal must be raw. Honor in future ref work.
