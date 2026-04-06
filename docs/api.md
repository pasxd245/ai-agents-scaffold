# API Reference

`a2scaffold` exports a programmatic API for use in custom tooling, scripts, or build pipelines.

```javascript
import {
  scaffold,
  listTemplates,
  resolveTemplatePath,
  checkExistingFiles,
  validateSkill,
  listSkills,
  installSkill,
  parseSkillSource,
} from 'a2scaffold';
```

## Scaffold API

### `scaffold(options)`

Render a template to the output directory.

**Parameters:**

| Name                   | Type     | Required | Description                                 |
| ---------------------- | -------- | -------- | ------------------------------------------- |
| `options.templateName` | `string` | Yes      | Template name (e.g. `"base"`)               |
| `options.outputDir`    | `string` | Yes      | Target directory to write files             |
| `options.overrides`    | `object` | No       | Values to deep-merge over template defaults |

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

#### How overrides work

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

### `listTemplates()`

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

### `resolveTemplatePath(name)`

Resolve filesystem paths for a given template. Useful for inspecting template contents or passing paths to `checkExistingFiles`.

**Parameters:**

| Name   | Type     | Required | Description                   |
| ------ | -------- | -------- | ----------------------------- |
| `name` | `string` | Yes      | Template name (e.g. `"base"`) |

**Returns:** `{ templateDir: string, valuesFile: string, partialsDir?: string }`

| Property      | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `templateDir` | Path to the `template/` directory containing `.hbs` files               |
| `valuesFile`  | Path to the `values.yaml` defaults file                                 |
| `partialsDir` | Path to the `partials/` directory for Handlebars partials, when present |

**Throws:**

- `Error` if the template name is not found (message includes available templates)
- `Error` if `template/` or `values.yaml` is missing

**Example:**

```javascript
import { resolveTemplatePath } from 'a2scaffold';

const paths = resolveTemplatePath('base');
console.log(paths.templateDir);  // ".../templates/base/template"
console.log(paths.valuesFile);   // ".../templates/base/values.yaml"
console.log(paths.partialsDir);  // ".../templates/base/partials" or undefined
```

---

### `checkExistingFiles(templateDir, outDir, extname?)`

Check which output files already exist in the target directory. Use this to detect conflicts before calling `scaffold()`.

**Parameters:**

| Name          | Type     | Required | Default  | Description                                  |
| ------------- | -------- | -------- | -------- | -------------------------------------------- |
| `templateDir` | `string` | Yes      |          | Path to the template's `template/` directory |
| `outDir`      | `string` | Yes      |          | Target output directory to check             |
| `extname`     | `string` | No       | `".hbs"` | Template file extension                      |

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

---

## Skills API

### `validateSkill(skillDir)`

Validate a skill directory against the [agentskills.io specification](https://agentskills.io/specification). Checks for a valid `SKILL.md` with required YAML frontmatter fields and name format constraints.

**Parameters:**

| Name       | Type     | Required | Description                 |
| ---------- | -------- | -------- | --------------------------- |
| `skillDir` | `string` | Yes      | Path to the skill directory |

**Returns:** `{ valid: boolean, errors: string[], skill: object|null }`

| Property | Description                                              |
| -------- | -------------------------------------------------------- |
| `valid`  | `true` if the skill passes all validation checks         |
| `errors` | Array of validation error messages (empty if valid)      |
| `skill`  | Parsed SKILL.md frontmatter object, or `null` if invalid |

**Validation rules:**

- `SKILL.md` must exist in the directory
- YAML frontmatter must be present (`---` delimiters)
- `name` (required): 1-64 chars, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens, must match directory name
- `description` (required): 1-1024 chars, non-empty
- `compatibility` (optional): max 500 chars

**Example:**

```javascript
import { validateSkill } from 'a2scaffold';

const result = validateSkill('./my-skills/code-review');

if (!result.valid) {
  console.error('Validation errors:', result.errors);
} else {
  console.log(result.skill.name);        // "code-review"
  console.log(result.skill.description);  // "Reviews code..."
}
```

---

### `listSkills(agentsDir)`

List all installed skills in an `.agents/` directory.

**Parameters:**

| Name        | Type     | Required | Description                      |
| ----------- | -------- | -------- | -------------------------------- |
| `agentsDir` | `string` | Yes      | Path to the `.agents/` directory |

**Returns:** `Array<{ name: string, description: string, path: string }>` — sorted by name. Empty array if no skills are installed.

**Example:**

```javascript
import { listSkills } from 'a2scaffold';

const skills = listSkills('./.agents');
for (const skill of skills) {
  console.log(`${skill.name}: ${skill.description}`);
}
```

---

### `parseSkillSource(source)`

Parse a skill source string into a structured object. Use this to inspect a source before passing it to `installSkill`.

**Parameters:**

| Name     | Type     | Required | Description                                         |
| -------- | -------- | -------- | --------------------------------------------------- |
| `source` | `string` | Yes      | Skill source (local path, GitHub shorthand, or URL) |

**Returns:** `{ type: string, localPath?: string, owner?: string, repo?: string, skillPath?: string, ref?: string }`

**Supported formats:**

| Format           | Example                                         | `type`     |
| ---------------- | ----------------------------------------------- | ---------- |
| Local path       | `./my-skill`, `/absolute/path`                  | `"local"`  |
| GitHub shorthand | `owner/repo/path/to/skill`                      | `"github"` |
| GitHub URL       | `https://github.com/owner/repo/tree/main/skill` | `"github"` |

**Throws:** `Error` if the source string cannot be parsed.

**Example:**

```javascript
import { parseSkillSource } from 'a2scaffold';

parseSkillSource('./my-skill');
// { type: 'local', localPath: '/absolute/path/to/my-skill' }

parseSkillSource('anthropics/skills/code-review');
// { type: 'github', owner: 'anthropics', repo: 'skills', skillPath: 'code-review', ref: '' }
```

---

### `installSkill(source, targetDir, options?)`

Install a skill from a source into a target directory.

**Parameters:**

| Name            | Type      | Required | Default | Description                                         |
| --------------- | --------- | -------- | ------- | --------------------------------------------------- |
| `source`        | `string`  | Yes      |         | Skill source (local path, GitHub shorthand, or URL) |
| `targetDir`     | `string`  | Yes      |         | Target directory (e.g. `.agents/skills/`)           |
| `options.force` | `boolean` | No       | `false` | Overwrite existing skill                            |

**Returns:** `{ name: string, path: string }`

| Property | Description                                    |
| -------- | ---------------------------------------------- |
| `name`   | The installed skill's directory name           |
| `path`   | Absolute path to the installed skill directory |

**Throws:**

- `Error` if the source does not exist or is not a valid skill
- `Error` if the skill already exists and `force` is not `true`
- `Error` for GitHub sources: if `git` is not available or the path is not found

**Example:**

```javascript
import { installSkill } from 'a2scaffold';

// Install from local path
const result = installSkill('./my-skill', './.agents/skills');
console.log(result.name);  // "my-skill"
console.log(result.path);  // "/absolute/path/.agents/skills/my-skill"

// Install from GitHub
installSkill('anthropics/skills/code-review', './.agents/skills');

// Overwrite existing
installSkill('./updated-skill', './.agents/skills', { force: true });
```
