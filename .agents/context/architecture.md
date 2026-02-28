# Architecture — a2scaffold

> Project structure, module responsibilities, and key design decisions.

---

## Overview

`a2scaffold` is a CLI tool that generates AI agent configuration
files in any repository. It uses `@nci-gis/js-tmpl` (Handlebars-based
template engine) to transform templates + values into output files.

## Module Map

```text
bin/
  cli.js              # CLI entry point — arg parsing, user-facing output

src/
  index.js            # Public programmatic API re-exports
  scaffold.js         # Core orchestrator — load values, merge, render
  templates.js        # Template discovery — list, validate, resolve paths
  safety.js           # Pre-flight — detect existing files, warn/skip/force

templates/
  <template-name>/
    values.yaml       # Default variable values for this template
    template/         # .hbs files mirroring desired output structure
    partials/         # Handlebars partials (can be empty, dir must exist)

tests/
  *.test.js           # Tests using node:test
```

## Key Design Decisions

1. **ESM throughout** — `"type": "module"` in package.json
2. **Minimal dependencies** — only `@nci-gis/js-tmpl` + `js-yaml`
3. **Bypass `resolveConfig`** — construct config object directly for
   `renderDirectory` to avoid temp files when merging values
4. **Template paths via `import.meta.url`** — resolve relative to the
   installed package, not the user's cwd
5. **Empty `.gitkeep.hbs`** — js-tmpl only walks `.hbs` files, so empty
   placeholder files use `.gitkeep.hbs` which renders to empty `.gitkeep`

## Data Flow

```text
CLI args (--template, --name, --output)
  → resolveTemplatePath(templateName)
  → load values.yaml + merge CLI overrides
  → checkExistingFiles (safety)
  → renderDirectory(config)
  → output files written to target dir
```
