# Round 01: Build CLI Scaffolding Tool

**Status**: Complete
**Date started**: 2026-02-28
**Date completed**: 2026-02-28

## Goal

Transform the static template repository into a publishable pnpm CLI tool
using `@nci-gis/js-tmpl`. Users will run `npx a2scaffold` in any repo to
generate `.agents/`, `AGENTS.md`, and related AI agent config files. The
architecture must support multiple templates (base + future contributor
templates).

## Plan

- [x] Flesh out PDCA.md methodology
- [x] Populate `.agents/context/` with project architecture and conventions
- [x] Initialize pnpm project with package.json, dependencies
- [x] Convert existing files to `.hbs` templates under `templates/base/`
- [x] Build core modules: `src/templates.js`, `src/safety.js`, `src/scaffold.js`
- [x] Build CLI entry point: `bin/cli.js`
- [x] Write tests using `node:test`
- [x] Update README.md and create CONTRIBUTING.md
- [x] Verify: tests pass, CLI works, `pnpm pack` produces correct tarball

## Do

### 2026-02-28

- Completed PDCA.md with full methodology, cycle template, and governance rules
- Created Round_01 cycle to track the initiative
- Created `.agents/context/architecture.md` and `.agents/context/conventions.md`
- Initialized pnpm project: `package.json`, installed `@nci-gis/js-tmpl` + `js-yaml`
- Created 10 `.hbs` template files under `templates/base/template/`
- Built core modules:
  - `src/templates.js` — template discovery (`listTemplates`, `resolveTemplatePath`)
  - `src/safety.js` — pre-flight conflict detection (`checkExistingFiles`)
  - `src/scaffold.js` — core orchestrator (loads values, merges, calls `renderDirectory`)
  - `src/index.js` — public API re-exports
- Built CLI at `bin/cli.js` with flags: `--template`, `--output`, `--name`, `--list`, `--force`, `--dry-run`, `--help`, `--version`
- Wrote 19 tests across 3 test files (all passing)
- Updated README.md with full usage docs, created CONTRIBUTING.md
- Renamed package from `ai-agents-scaffold` to `a2scaffold` (`a2` = ai agents)
- Verified: `pnpm test` (19/19), `pnpm pack` (21 files), `npx` end-to-end

## Check

- [x] `pnpm test` — 19 tests pass, 0 failures
- [x] `node bin/cli.js --list` prints available templates
- [x] `node bin/cli.js -t base -o /tmp/test -n "My Project"` generates correct output
- [x] Generated `.gitkeep` files are empty (0 bytes)
- [x] Generated `AGENTS.md` contains expected content
- [x] `README.md` is NOT generated (users keep their own)
- [x] Re-running without `--force` warns about existing files (exit code 1)
- [x] `pnpm pack` includes `templates/`, `bin/`, `src/` (21 files in tarball)

## Act

**Learnings**:

- js-tmpl's `registerPartials` throws if `partialsDir` doesn't exist — every template needs an empty `partials/` dir
- `.gitkeep.hbs` with empty content works correctly — js-tmpl walks `.hbs` files, Handlebars compiles empty string to empty output
- Bypassing `resolveConfig` and constructing the config object directly for `renderDirectory` avoids temp file writes for merged values
- `import.meta.url` is the right way to resolve template paths relative to the installed package (not user's cwd)

**Promotions**:

- [x] → context/js-tmpl.md : js-tmpl integration patterns (promoted in Round_02)
- [x] → skills/create-template.md : template creation checklist (promoted in Round_02)
