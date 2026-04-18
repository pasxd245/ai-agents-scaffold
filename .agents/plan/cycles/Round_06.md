# Round 06: Phase 1.5 — Type-check Baseline (JSDoc + checkJs)

**Status**: Review
**Date started**: 2026-04-18
**Date completed**: 2026-04-18
**Master plan**: [docs/agents/plan/20260418-repo-refactor.plan.md](../../../docs/agents/plan/20260418-repo-refactor.plan.md) — Phase 1.5

## Goal

Adopt TypeScript's `--checkJs` as a linter layer over our JS codebase
without introducing a build step. Green `pnpm typecheck` in CI. Type
safety from JSDoc annotations, surfaced by editor tooling, caught by
`tsc --noEmit`. No `.ts` files, no emit.

## Plan

- [x] Install `typescript` + `@types/node` + `@types/js-yaml` as dev deps
- [x] Add `tsconfig.json` — `allowJs`, `checkJs`, `noEmit`, `strict`,
      `module/moduleResolution: nodenext`, `target: es2022`
- [x] Add ambient declaration for `@nci-gis/js-tmpl` in `types/ambient.d.ts`
- [x] Add `pnpm typecheck` script; wire into `pnpm check`
- [x] Narrow typecheck scope to `src/**` (exclude `bin/` — deleted in Phase 2;
      exclude `tests/` — to be gradually typed in later phases)
- [x] Fix all `tsc` errors minimally — add JSDoc only where it blocks green
- [x] Verify `pnpm check` passes end-to-end

## Do

### Files added

- `tsconfig.json` — strict, JS-only, `noEmit`, includes `src/**/*.js` + `types/**/*.d.ts`
- `types/ambient.d.ts` — `RenderDirectoryConfig` interface + `renderDirectory` signature for `@nci-gis/js-tmpl`
- `.agents/plan/cycles/Round_06.md` — this file

### Files modified

- `package.json` — added `typescript`, `@types/node`, `@types/js-yaml` dev deps; new `typecheck` script; added to `check` chain
- `src/safety.js` — JSDoc on `predictOutputPaths`; non-null cast on `queue.shift()`
- `src/scaffold.js` — JSDoc on `deepMerge`; imported `RenderDirectoryConfig` typedef; typed `config` with it so optional `partialsDir` assignment works
- `src/skills.js`:
  - Added `Frontmatter`/`ParsedSkill` typedefs
  - JSDoc on `parseFrontmatter`, `installFromLocal`, `installFromGitHub`, `resolveSkillsToRef`, `checkDestConflict`
  - Narrowed `parseSkillSource` return to discriminated union — TS now infers `localPath` / `owner`/`repo` at call sites
  - Narrowed `isSkillRef` return to discriminated union — `content` is `string` when `isRef: true`, else `null`
  - Refactored `isSkillRef` terminal return to produce the union literally (ternary-on-object broke inference)
  - Cast-narrowed the "unreachable" throw in `installSkill` (post exhaustive type-narrowing, `parsed` is `never`)

### Choices

- **Narrowed `tsconfig` include to `src/**` only.**
  - `bin/cli.js` is slated for deletion in Phase 2 — annotating it is waste. Excluded outright.
  - `tests/**` has dozens of implicit-any in `beforeEach` scopes; typing them under `strict` would be a sprawling task that doesn't match "minimum fixes to be green". Deferred to later phases.
- **Discriminated unions over non-null assertions.** For `parseSkillSource` and `isSkillRef`, switching the return JSDoc to a union narrowed downstream usage automatically and eliminated 5 errors without adding `@ts-ignore`.

## Check

- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm lint:js` — 0 errors
- [x] `pnpm lint:md` — 0 errors
- [x] `pnpm format:check` — clean
- [x] `pnpm test` — 66/66 pass
- [x] `pnpm check` — exit 0

## Act

### Learnings

- **TypeScript 6.0.3 (current npm latest tag) rejects `node:` prefix
  imports under `module: nodenext`** with `TS2591 Cannot find name 'node:fs'`.
  Downgraded to `typescript@5.9.3`. Re-evaluate with TS 6.x minor releases.
- **`yaml.load()` returns `unknown`** — casting the result via
  `/** @type {Frontmatter} */ (yaml.load(...) || {})` is cleaner than
  liberal optional chaining at every call site.
- **Discriminated union return types carry real narrowing through
  callers.** `{ type: 'local', ... } | { type: 'github', ... }`
  eliminates the need for non-null assertions in downstream code and
  makes exhaustive checks surface when a new variant is added.
- **`partialsDir` conditional-property assignment requires an
  explicitly-typed config object.** Inferred object literals freeze
  their shape; typing via `/** @type {RenderDirectoryConfig} */`
  unblocks later optional additions.
- **Ambient `.d.ts` files need explicit inclusion.** TS picks up
  `types/**/*.d.ts` only if the tsconfig `include` globs reach them.

### Follow-ups for next phases

- **Phase 2 (Round 07)**: delete `bin/cli.js`; `bin/a2scaffold` already
  exists as a placeholder (committed in Round 05) but currently points
  to `src/cli/main.js` which doesn't exist yet. Phase 2 must create
  `src/cli/main.js` or retarget `bin/a2scaffold` to a real entry.
- **Phase 4 (Round 09)**: when splitting `src/skills.js`, migrate the
  `Frontmatter` / `ParsedSkill` typedefs into `src/utils/frontmatter.js`.
- **Tests typing**: when adding a subsequent "tests under checkJs" phase,
  start by giving `let tmpX` declarations JSDoc `@type {string}` — that
  alone eliminates ~80% of the current errors.

### Promotions

- None this round (tooling continuation)
