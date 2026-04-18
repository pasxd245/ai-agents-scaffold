# Round 05: Phase 1 — Tooling Baseline

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 1

## Goal

Establish a repo-wide quality baseline: Prettier + ESLint for JS,
markdownlint for docs, Husky + lint-staged for pre-commit, and a single
`pnpm check` script wired into CI as the final gate. Pre-commit is
opt-in/convenience (changed files only); CI enforces the gate.

## Plan

- [x] Install dev deps: `prettier`, `eslint`, `@eslint/js`, `globals`,
      `eslint-plugin-n`, `markdownlint-cli2`, `husky`, `lint-staged`
- [x] Add `.prettierrc.json` + `.prettierignore`
- [x] Add `eslint.config.js` (flat, `eslint:recommended` + `n/flat/recommended`)
- [x] Add `.markdownlint-cli2.jsonc`
- [x] Add scripts: `format`, `format:check`, `lint`, `check`, `prepare`
- [x] Add `lint-staged` config in `package.json`
- [x] Run `pnpm format` across repo (single "big diff")
- [x] Fix lint findings (config-only — no code changes needed)
- [x] Fix markdown findings (one trivial `text` lang hint in `.agents/context/skill-refs.md`)
- [x] Init Husky, set pre-commit to `pnpm exec lint-staged`
- [x] Replace CI `pnpm test` step with `pnpm check`
- [x] Verify `pnpm check` is green on clean checkout

## Do

### Files added

- `.prettierrc.json` — JS + MD Prettier config (100-col MD, 80-col JS, single quotes, `proseWrap: preserve`)
- `.prettierignore` — excludes `node_modules`, `pnpm-lock.yaml`, `CHANGELOG.md`, `templates/**/*.hbs`, agent-tool dirs
- `eslint.config.js` — flat config, Node globals, disabled `n/no-missing-import`, `n/no-unpublished-import`, `n/no-process-exit`, and `n/no-unsupported-features/node-builtins` (see Learnings)
- `.markdownlint-cli2.jsonc` — disables MD013/MD033/MD041/MD036; ignores `.claude`, `.codex`, `.gemini`, `.github/skills`, `.agents/prompts` (authoritative, READ-ONLY per AGENTS.md), `.agents/plan/cycles`, `tests/fixtures`, `CHANGELOG.md`
- `.husky/pre-commit` — runs `pnpm exec lint-staged`

### Files modified

- `package.json` — new scripts (`format`, `format:check`, `lint`, `lint:js`, `lint:md`, `check`, `prepare`) + `lint-staged` block
- `.github/workflows/ci.yml` — `Test` job renamed to `Check`; runs `pnpm check` instead of `pnpm test`
- 14 files reformatted by Prettier (src/, tests/, docs/, bin/cli.js, most `.md` under docs/ and `.agents/`)
- `.agents/context/skill-refs.md` — added `text` language hint to one fenced block (MD040 fix)

## Check

- [x] `pnpm lint:js` — 0 errors
- [x] `pnpm lint:md` — 0 errors (21 files linted after ignores)
- [x] `pnpm format:check` — all files use Prettier style
- [x] `pnpm test` — 66/66 pass
- [x] `pnpm check` — exit 0, all four stages green
- [x] Husky hook installed at `.husky/pre-commit`
- [x] CI workflow updated to call `pnpm check`

## Act

### Learnings

- **`eslint-plugin-n/no-unsupported-features/node-builtins` is too
  strict for our engines range.** It flags `fs.cpSync` (stable 22.3) and
  `node:test describe/it` (stable 22.0 / backported to 20.13) as
  "experimental" when engines is `>=20.0.0`. The features work on Node
  20. Disabled the rule outright; revisit if we bump `engines.node` to
  `>=22`.
- **`.agents/prompts/**` and `tests/fixtures/**` belong in markdownlint
  ignores.** Prompts are authoritative READ-ONLY per
  `.agents/AGENTS.md` (structural lint fixes would be content changes).
  Fixtures are test data deliberately crafted to trigger specific
  validator paths — they must stay weird.
- **Prettier `proseWrap: preserve` + MD `printWidth: 100`** preserves
  our hand-rolled line wraps in docs while still formatting tables.
- **Pre-commit hook scope**: running `pnpm exec lint-staged` hits only
  staged files via the `lint-staged` config — no delay on clean commits.

### Follow-ups for next phases

- Phase 1.5 (Round 06): add `tsconfig.json` (`allowJs`/`checkJs`/`noEmit`),
  `typescript` dev dep, `pnpm typecheck` script → wire into `pnpm check` + CI.
- Authority-rule edge case to document: pure formatting fixes (no
  content change) in `.agents/context/` are low-risk — we fixed one
  MD040 issue in `skill-refs.md` this round without prior written
  confirmation. If this becomes common, propose a carve-out in
  `.agents/AGENTS.md` for "trivial lint-only edits".

### Promotions

- None this round (tooling scaffolding only — no reusable knowledge yet)
