# API Reference

`a2scaffold` exports a programmatic API for use in custom tooling, scripts, or build pipelines.

```javascript
import {
  scaffold,
  listTemplates,
  resolveTemplatePath,
  checkExistingFiles,
} from 'a2scaffold';
```

## `scaffold(options)`

Render a template to the output directory.

**Parameters:**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `options.templateName` | `string` | Yes | Template name (e.g. `"base"`) |
| `options.outputDir` | `string` | Yes | Target directory to write files |
| `options.overrides` | `object` | No | Values to deep-merge over template defaults |

**Returns:** `Promise<{ outputDir: string, template: string }>`

**Example:**

```javascript
import { scaffold } from 'a2scaffold';

const result = await scaffold({
  templateName: 'base',
  outputDir: './my-project',
  overrides: { project: { name: 'my-project' } },
});

console.log(result.outputDir);  // "/absolute/path/to/my-project"
console.log(result.template);   // "base"
```

### How overrides work

Each template includes a `values.yaml` with default values. For the `base` template:

```yaml
project:
  name: "my-project"
```

The `overrides` object is deep-merged over these defaults. Objects are merged recursively; arrays and primitives are replaced entirely.

```javascript
// Default: { project: { name: "my-project" } }
// Override: { project: { name: "acme-api" } }
// Result:   { project: { name: "acme-api" } }

await scaffold({
  templateName: 'base',
  outputDir: './acme-api',
  overrides: { project: { name: 'acme-api' } },
});
```

All merged values (plus `process.env` as `env`) are available in Handlebars templates as `{{ project.name }}`, `{{ env.HOME }}`, etc.

---

## `listTemplates()`

List all available template names.

**Parameters:** none

**Returns:** `string[]` — sorted array of template names.

**Example:**

```javascript
import { listTemplates } from 'a2scaffold';

const templates = listTemplates();
console.log(templates); // ["base"]
```

---

## `resolveTemplatePath(name)`

Resolve filesystem paths for a given template. Useful for inspecting template contents or passing paths to `checkExistingFiles`.

**Parameters:**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Template name (e.g. `"base"`) |

**Returns:** `{ templateDir: string, valuesFile: string, partialsDir: string }`

| Property | Description |
| --- | --- |
| `templateDir` | Path to the `template/` directory containing `.hbs` files |
| `valuesFile` | Path to the `values.yaml` defaults file |
| `partialsDir` | Path to the `partials/` directory for Handlebars partials |

**Throws:**

- `Error` if the template name is not found (message includes available templates)
- `Error` if `template/`, `values.yaml`, or `partials/` is missing

**Example:**

```javascript
import { resolveTemplatePath } from 'a2scaffold';

const paths = resolveTemplatePath('base');
console.log(paths.templateDir);  // ".../templates/base/template"
console.log(paths.valuesFile);   // ".../templates/base/values.yaml"
console.log(paths.partialsDir);  // ".../templates/base/partials"
```

---

## `checkExistingFiles(templateDir, outDir, extname?)`

Check which output files already exist in the target directory. Use this to detect conflicts before calling `scaffold()`.

**Parameters:**

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `templateDir` | `string` | Yes | | Path to the template's `template/` directory |
| `outDir` | `string` | Yes | | Target output directory to check |
| `extname` | `string` | No | `".hbs"` | Template file extension |

**Returns:** `string[]` — list of conflicting file paths, relative to `outDir`. Empty array if no conflicts.

**Example:**

```javascript
import { resolveTemplatePath, checkExistingFiles, scaffold } from 'a2scaffold';

const { templateDir } = resolveTemplatePath('base');
const conflicts = checkExistingFiles(templateDir, './my-project');

if (conflicts.length > 0) {
  console.warn('These files already exist:', conflicts);
  // decide whether to proceed or abort
}

await scaffold({
  templateName: 'base',
  outputDir: './my-project',
});
```
