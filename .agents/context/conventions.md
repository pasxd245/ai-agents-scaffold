# Conventions — a2scaffold

> Coding standards and project conventions.

---

## Runtime & Tooling

- **Node.js** >= 20 (required by js-tmpl)
- **pnpm** as package manager
- **ESM modules** — `import`/`export`, no `require()`

## Dependencies Policy

- Production: only `@nci-gis/js-tmpl` and `js-yaml`
- CLI arg parsing: `node:util parseArgs` (built-in, no commander/yargs)
- Testing: `node:test` + `node:assert/strict` (built-in, no jest/vitest)
- No unnecessary abstractions — prefer Node.js built-ins

## Template Conventions

- Template names: **kebab-case** directories under `templates/`
- Every template must contain:
  - `values.yaml` — default values (required)
  - `template/` — .hbs files (required)
  - `partials/` — Handlebars partials dir (required, can be empty with `.gitkeep`)
- `.hbs` extension is stripped in output
- Dynamic paths use `${var}` syntax in file/directory names
- Template content uses Handlebars `{{var}}` syntax

## Skills Convention ([Agent Skills spec](https://agentskills.io/specification))

- Each skill is a directory under `.agents/skills/<skill-name>/`
- Must contain `SKILL.md` with YAML frontmatter (`name`, `description`)
- `name` field must match directory name (kebab-case, lowercase)
- Optional subdirs: `scripts/`, `references/`, `assets/`

## Prompt Conventions

- Prompt files use `.prompt.md` extension for auto-loading by agent tooling
- Must include YAML frontmatter: `name`, `description`, `argument-hint`, `agent`
- Stored in `.agents/prompts/`

## File Naming

- Source modules: `camelCase.js` in `src/`
- Tests: `<module>.test.js` in `tests/`
- CLI: `cli.js` in `bin/`

## Error Handling

- User-facing errors: print clean message, exit with code 1
- Unexpected errors: print stack trace to stderr
- Never silently overwrite files — require `--force` flag
