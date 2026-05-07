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
  isSkillRef,
  discoverSkills,
  installSkillRef,
} from 'a2scaffold';
```

## Scaffold API

### `scaffold(options)`

Render a template to the output directory.

**Parameters:**

| Name                   | Type     | Required | Description                                      |
| ---------------------- | -------- | -------- | ------------------------------------------------ |
| `options.templateName` | `string` | Yes      | Template path (e.g. `"scaffold/base"`)           |
| `options.outputDir`    | `string` | Yes      | Target directory to write files                  |
| `options.overrides`    | `object` | No       | Values to deep-merge over resolved template view |

**Returns:** `Promise<{ outputDir: string, template: string }>`

**Example:**

```javascript
import { scaffold } from 'a2scaffold';

const result = await scaffold({
  templateName: 'scaffold/base',
  outputDir: './my-project',
  overrides: { project: { name: 'my-project' } },
});

console.log(result.outputDir); // "/absolute/path/to/my-project"
console.log(result.template); // "scaffold/base"
```

#### How overrides work

Templates may include a `values.yaml` file and/or a `values/` directory
with default values. For the `base` scaffold template:

```yaml
project:
  name: 'my-project'
```

The `overrides` object is deep-merged over these defaults. Objects are merged recursively; arrays and primitives are replaced entirely.

```javascript
// Default: { project: { name: "my-project" } }
// Override: { project: { name: "acme-api" } }
// Result:   { project: { name: "acme-api" } }

await scaffold({
  templateName: 'scaffold/base',
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

| Name   | Type     | Required | Description                            |
| ------ | -------- | -------- | -------------------------------------- |
| `name` | `string` | Yes      | Template path (e.g. `"scaffold/base"`) |

**Returns:** `{ templateRoot: string, templateDir: string, valuesFile?: string, valuesDir?: string, partialsDir?: string }`

| Property       | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `templateRoot` | Path to the template root directory                                     |
| `templateDir`  | Path to the `template/` directory containing `.hbs` files               |
| `valuesFile`   | Path to the `values.yaml` defaults file, when present                   |
| `valuesDir`    | Path to the `values/` directory, when present                           |
| `partialsDir`  | Path to the `partials/` directory for Handlebars partials, when present |

**Throws:**

- `Error` if the template name is not found (message includes available templates)
- `Error` if `template/` is missing

**Example:**

```javascript
import { resolveTemplatePath } from 'a2scaffold';

const paths = resolveTemplatePath('scaffold/base');
console.log(paths.templateRoot); // ".../templates/scaffold/base"
console.log(paths.templateDir); // ".../templates/scaffold/base/template"
console.log(paths.valuesFile); // ".../templates/scaffold/base/values.yaml" or undefined
console.log(paths.partialsDir); // ".../templates/scaffold/base/partials" or undefined
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

const { templateDir } = resolveTemplatePath('scaffold/base');
const conflicts = checkExistingFiles(templateDir, './my-project');

if (conflicts.length > 0) {
  console.warn('These files already exist:', conflicts);
  // decide whether to proceed or abort
}

await scaffold({
  templateName: 'scaffold/base',
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
  console.log(result.skill.name); // "code-review"
  console.log(result.skill.description); // "Reviews code..."
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

Parse a skill source string into a structured object. This is a low-level parser; `installSkill()` adds higher-level built-in-pool and registry resolution on top.

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

`parseSkillSource()` can parse bare GitHub shorthand such as
`owner/repo/path`, but `installSkill()` does not treat bare sources as
GitHub shorthands directly. Use a full GitHub tree URL or a registry for
`installSkill()`.

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

| Name            | Type      | Required | Default | Description                                 |
| --------------- | --------- | -------- | ------- | ------------------------------------------- |
| `source`        | `string`  | Yes      |         | Skill source                                |
| `targetDir`     | `string`  | Yes      |         | Target directory (e.g. `.agents/skills/`)   |
| `options.force` | `boolean` | No       | `false` | Overwrite existing skill                    |
| `options.from`  | `string`  | No       |         | Registry name from `options.rc.registries`  |
| `options.rc`    | `object`  | No       | `{}`    | Parsed `.a2scaffoldrc.json` registry config |

**Supported install sources:**

| Source form            | Example                                                 | Behavior                                      |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Explicit local path    | `./my-skill`, `/absolute/path`                          | Copies that directory                         |
| Full GitHub tree URL   | `https://github.com/owner/repo/tree/main/path/to/skill` | Sparse-checks out that skill directory        |
| Built-in name          | `my-skill`, `planning/master-plan`                      | Resolves under `templates/skills/`            |
| Registry name + `from` | `pdf` with `{ from: 'anthropics' }`                     | Resolves through `options.rc.registries.from` |

**Returns:** `{ name: string, path: string }`

| Property | Description                                    |
| -------- | ---------------------------------------------- |
| `name`   | The installed skill's directory name           |
| `path`   | Absolute path to the installed skill directory |

**Throws:**

- `Error` if the source does not exist or is not a valid skill
- `Error` if the skill already exists and `force` is not `true`
- `Error` for GitHub sources: if `git` is not available or the path is not found
- `Error` if `options.from` names an unknown registry

**Example:**

```javascript
import { installSkill } from 'a2scaffold';

// Install from local path
const result = installSkill('./my-skill', './.agents/skills');
console.log(result.name); // "my-skill"
console.log(result.path); // "/absolute/path/.agents/skills/my-skill"

// Install from a full GitHub URL
installSkill('https://github.com/anthropics/skills/tree/main/skills/pdf', './.agents/skills');

// Install from a registry-backed name
installSkill('pdf', './.agents/skills', {
  from: 'anthropics',
  rc: {
    registries: {
      anthropics: {
        url: 'github:anthropics/skills',
        path: 'skills',
        ref: 'main',
      },
    },
  },
});

// Overwrite existing
installSkill('./updated-skill', './.agents/skills', { force: true });
```

---

### `isSkillRef(skillDir)`

Check whether a skill directory contains a skill-ref (lightweight pointer) rather than a full skill definition.

**Parameters:**

| Name       | Type     | Required | Description                                     |
| ---------- | -------- | -------- | ----------------------------------------------- |
| `skillDir` | `string` | Yes      | Path to a skill directory containing `SKILL.md` |

**Returns:** `{ isRef: boolean, content: string|null }`

| Property  | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `isRef`   | `true` if `SKILL.md` has `metadata.type: skill-ref` in frontmatter |
| `content` | Raw file content when it is a skill-ref, otherwise `null`          |

**Example:**

```javascript
import { isSkillRef } from 'a2scaffold';

const result = isSkillRef('./.claude/skills/create-template');
if (result.isRef) {
  console.log('This is a skill reference');
} else {
  console.log('This is a full skill definition');
}
```

---

### `discoverSkills(agentsDir)`

Discover all skills in an agents directory. Unlike `listSkills`, this returns the skill directory path (`skillDir`) instead of `description` and `path`, and is used internally by `installSkillRef` to resolve `--skill all`.

**Parameters:**

| Name        | Type     | Required | Description                                   |
| ----------- | -------- | -------- | --------------------------------------------- |
| `agentsDir` | `string` | Yes      | Path to an agents directory (e.g. `.agents/`) |

**Returns:** `Array<{ name: string, skillDir: string }>` — sorted by name. Empty array if no skills directory exists.

**Example:**

```javascript
import { discoverSkills } from 'a2scaffold';

const skills = discoverSkills('./.agents');
for (const { name, skillDir } of skills) {
  console.log(`${name} → ${skillDir}`);
}
```

---

### `installSkillRef(options)`

Create skill references (lightweight pointer files) in a destination agents directory, pointing back to skills in a source agents directory. Each generated `SKILL.md` contains `metadata.type: skill-ref` and a `rootPath` for locating the source skill.

**Parameters:**

| Name            | Type      | Required | Default | Description                                               |
| --------------- | --------- | -------- | ------- | --------------------------------------------------------- |
| `options.from`  | `string`  | Yes      |         | Source agents dir (e.g. `".agents"`)                      |
| `options.to`    | `string`  | Yes      |         | Destination agents dir (e.g. `".claude"`)                 |
| `options.skill` | `string`  | Yes      |         | Skill name or `"all"` to reference every discovered skill |
| `options.force` | `boolean` | No       | `false` | Overwrite existing skill-refs                             |

**Returns:** `Promise<Array<{ name: string, path: string }>>`

| Property | Description                                      |
| -------- | ------------------------------------------------ |
| `name`   | The skill name                                   |
| `path`   | Absolute path to the created skill-ref directory |

**Behavior:**

- If the source skill is itself a skill-ref, its content is copied verbatim (passthrough)
- `rootPath` is computed as a relative path from the destination skill directory to the source project root

**Throws:**

- `Error` if source and destination dirs are the same (self-reference)
- `Error` if destination has a real skill (non-ref) — cannot be overwritten even with `force`
- `Error` if destination has an existing skill-ref and `force` is not `true`
- `Error` if the named skill does not exist in the source directory
- `Error` if `--skill all` finds no skills in the source directory

**Example:**

```javascript
import { installSkillRef } from 'a2scaffold';

// Create a ref for one skill
const results = await installSkillRef({
  from: '.agents',
  to: '.claude',
  skill: 'create-template',
});
console.log(results[0].path); // "/abs/path/.claude/skills/create-template"

// Create refs for all skills, overwriting existing refs
await installSkillRef({
  from: '.agents',
  to: '.claude',
  skill: 'all',
  force: true,
});
```
