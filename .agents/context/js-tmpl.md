# js-tmpl Integration Patterns

> Verified patterns for using `@nci-gis/js-tmpl` in this project.
> Promoted from Round_01 learnings.

---

## Core API

This project uses js-tmpl's programmatic API, not its CLI.

```javascript
import { renderDirectory } from '@nci-gis/js-tmpl';

await renderDirectory({
  templateDir,   // Absolute path to template/ dir
  partialsDir,   // Absolute path to partials/ dir (must exist)
  outDir,        // Absolute path to output directory
  extname: '.hbs',
  view: { ...values, env: process.env },
});
```

We **bypass `resolveConfig`** and construct the config object directly.
This avoids writing temporary merged values files to disk.

## Template File Rules

- js-tmpl only processes files ending in `.hbs` (via `walkTemplateTree`)
- The `.hbs` extension is stripped in output: `.agents/AGENTS.md.hbs` → `.agents/AGENTS.md`
- Empty files (e.g., `.gitkeep.hbs`) render to empty output — Handlebars
  compiles `""` to `""`
- Dynamic directory/file names use `${var}` syntax (not Handlebars `{{}}`)
- Template content uses Handlebars: `{{var}}`, `{{#if}}`, `{{#each}}`, `{{> partial}}`

## Partials Directory

`registerPartials(partialsDir, extname)` calls `fs.readdir` on the
directory — it **throws if the directory does not exist**. Every template
must include a `partials/` directory, even if empty.

Convention: add a `.gitkeep` (not `.gitkeep.hbs`) inside `partials/` so
git tracks the empty directory.

## Path Resolution

Template paths must be resolved relative to the **installed package**,
not the user's working directory:

```javascript
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
```

## Values Merging

Default values come from each template's `values.yaml`. CLI overrides
are deep-merged on top using a simple recursive merge (arrays replaced,
not concatenated). The merged object becomes the `view` for rendering.
