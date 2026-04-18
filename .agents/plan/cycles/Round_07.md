# Round 07: Phase 2 — `bin/a2scaffold` rename

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 2

## Goal

Rename the CLI binary to `bin/a2scaffold` (matching the npm package name)
and move CLI logic to `src/cli/main.js`. Delete `bin/cli.js` with no
alias. `npx a2scaffold` must continue to work unchanged for end users.

## Plan

- [x] Create `src/cli/main.js` — move the content of `bin/cli.js` with
      adjusted import paths; export `run()` instead of invoking at module scope
- [x] Rewrite `bin/a2scaffold` as Node shebang script that imports and
      invokes `src/cli/main.js::run()` (previously a bash wrapper)
- [x] `chmod +x bin/a2scaffold`
- [x] Delete `bin/cli.js`
- [x] Update `package.json#bin` — `a2scaffold: bin/a2scaffold`
- [x] Update `tests/cli.test.js` — `CLI_PATH` now points at `bin/a2scaffold`
- [x] Update user-facing docs ([docs/ToC.md](../../../docs/ToC.md), [CONTRIBUTING.md](../../../CONTRIBUTING.md))
- [x] Add JSDoc to moved CLI helpers (typecheck scope now covers `src/cli/`)
- [x] Verify `node bin/a2scaffold --help/--version` works
- [x] `pnpm check` end-to-end green

## Do

### Files added

- `src/cli/main.js` — CLI implementation (arg parse, dispatch, subcommands).
  Adjusted relative imports (`../scaffold.js` etc. instead of `../src/...`)
  and `pkg.json` path (two levels up instead of one). Exports `run()`
  instead of self-invoking — keeps it test-friendly.
- `.agents/plan/cycles/Round_07.md` — this file

### Files modified

- `bin/a2scaffold` — was a bash wrapper (`node $(dirname)/../src/cli/main.js`),
  replaced with a Node shebang script that imports `run()` and wraps the
  top-level `.catch()` the old `bin/cli.js` had. Made executable.
- `package.json` — `bin.a2scaffold` → `bin/a2scaffold`
- `tests/cli.test.js` — `CLI_PATH` updated
- `docs/ToC.md` — Source entry table: replaced `bin/cli.js` row with
  `bin/a2scaffold` + `src/cli/main.js` entries
- `CONTRIBUTING.md` — `node bin/cli.js ...` → `node bin/a2scaffold ...`

### Files deleted

- `bin/cli.js` — no alias, no grace period (per Q1 decision in master plan)

### Choices

- **Bash wrapper → Node shebang.** The pre-staged `bin/a2scaffold` was a
  bash script delegating to Node. Bash is not portable to Windows
  without WSL/git-bash, and npm's bin shim handles Node shebangs
  natively on all platforms. Replaced with `#!/usr/bin/env node`.
- **Keep `main.js` as a single file for now.** Phase 3 will split
  subcommands into `src/cli/commands/*.js`. Phase 2's scope is just the
  rename + relocation — no refactoring.
- **Typecheck scope stays `src/**`.** `src/cli/main.js` falls in scope,
  so I annotated CLI helpers (`isValueFlag`, `findFirstPositional`,
  `detectCommand`, `runScaffold`, all `runSkill*`) with minimal JSDoc.
  Discriminated union on `detectCommand` return narrowed dispatch.

### What I did NOT touch

- Historical PDCA cycles (`Round_01.md`, `Round_04.md`, `Round_05.md`,
  `Round_06.md`) reference `bin/cli.js` — left as-is, they're
  point-in-time records.
- `.agents/skills/create-template/SKILL.md` and
  `.agents/prompts/create-template.prompt.md` reference `bin/cli.js` —
  authoritative READ-ONLY, skipped.

## Check

- [x] `node bin/a2scaffold --help` → prints help
- [x] `node bin/a2scaffold --version` → prints `0.0.2`
- [x] `pnpm test` — 66/66 pass (including `cli.test.js` which spawns `bin/a2scaffold`)
- [x] `pnpm typecheck` — 0 errors (`src/cli/main.js` annotated)
- [x] `pnpm lint:js` — 0 errors
- [x] `pnpm lint:md` — 0 errors (after Prettier realigned the ToC table)
- [x] `pnpm format:check` — clean
- [x] `pnpm check` — exit 0

## Act

### Learnings

- **ShellCheck treats extensionless `#!/usr/bin/env node` files as
  shell scripts** and fires parse errors on JS braces. IDE-only, no
  CI/test impact. Real fix options: (a) rename to `bin/a2scaffold.mjs`,
  (b) add `.shellcheckrc` ignoring that path, or (c) ignore the warnings.
  Chose (c) for now — the extensionless name matches the npm command,
  is standard (eslint, prettier do the same), and Node resolves the
  shebang fine.
- **`parseArgs` option types in TS 5.9 strict mode are loose** — they
  return `string | boolean | undefined` for each value regardless of
  defaults. A few `/** @type {string} */` casts at consumption sites
  was the pragmatic fix.
- **Export `run()` and wrap in `bin/`** — the `bin/` script is only the
  process-level shell (`catch + exit`); all real logic is importable.
  This makes future programmatic CLI invocation possible without
  re-spawning Node.

### Follow-ups for next phases

- **Phase 3 (Round 08)**: split `src/cli/main.js` into
  `src/cli/commands/{scaffold,skill-add,skill-list,skill-validate,skill-ref}.js`
  and a lean dispatcher. Keep the `run()` export stable.
- **Windows portability**: nothing was tested on Windows. Node shebang
  handling there goes through npm's shim (fine), but if contributors
  clone and run `node bin/a2scaffold` directly on Windows, it works
  since Node reads the shebang itself in `fork` but direct shell
  invocation needs `.cmd`/`.ps1` wrappers. npm handles that on install.
- **ShellCheck noise**: if IDE false positives get annoying, add
  `.shellcheckrc` at repo root with `disable=SC1008` or path-scope.

### Promotions

- None this round (structural move, no new knowledge worth promoting)
