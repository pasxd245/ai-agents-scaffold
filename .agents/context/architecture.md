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

docs/
  usage.md            # Detailed CLI usage guide
  api.md              # Programmatic API reference

.github/workflows/
  ci.yml              # CI — tests on push/PR to main and dev
  release.yml         # Release — tag push → tests → changelog → GitHub Release → npm publish

cliff.toml            # git-cliff configuration for conventional commit changelogs
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
CLI args (--use, --name, --output)
  → resolveTemplatePath(templateName)
  → load values.yaml + merge CLI overrides
  → checkExistingFiles (safety)
  → renderDirectory(config)
  → output files written to target dir
```

## Release Pipeline

```text
git tag v0.0.1 → push tag (v* pattern)
  → version safety check (tag == package.json version)
  → pnpm install --frozen-lockfile
  → pnpm test --if-present
  → pnpm run build --if-present
  → git-cliff generates release notes (current tag only) → RELEASE_NOTES.md
  → GitHub Release created (prerelease if tag contains hyphen)
  → git-cliff generates full CHANGELOG.md
  → peter-evans/create-pull-request opens PR to main with CHANGELOG.md
  → npm publish --provenance (OIDC via id-token: write — no NPM_TOKEN needed)
    dist-tag: "latest" for stable (e.g. v1.0.0), "next" for pre-release (e.g. v1.0.0-beta.1)
```

Configuration: `cliff.toml` (conventional commits, groups by type, skips `chore(release)` and `chore(deps)`)
