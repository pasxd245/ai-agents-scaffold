# API Reference

`a2scaffold` exports a programmatic API for use in custom tooling, scripts, or build pipelines.

```javascript
import {
  scaffold,
  ScaffoldRefusal,
  sync,
  listTemplates,
  resolveTemplatePath,
  resolveScaffoldConfig,
  checkExistingFiles,
  classifyConflicts,
  listOutputPaths,
  hasManagedRegion,
  classifyRegion,
  validateSkill,
  scoreConformance,
  auditSkill,
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

| Name                   | Type      | Required | Description                                                                                      |
| ---------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------ |
| `options.templateName` | `string`  | Yes      | Template path (e.g. `"scaffold/base"`)                                                           |
| `options.outputDir`    | `string`  | Yes      | Target directory to write files                                                                  |
| `options.overrides`    | `object`  | No       | Values to deep-merge over resolved template view                                                 |
| `options.adopt`        | `boolean` | No       | Insert the generated block into an existing file that has no managed region, keeping its content |
| `options.force`        | `boolean` | No       | Replace an existing file wholesale when neither merge nor adoption applies                       |

**Returns:** `Promise<{ outputDir: string, template: string, created: string[], preserved: string[], adopted: string[], replaced: string[], unchanged: string[], needsAdopt: string[], needsForce: string[] }>`

Pass `dryRun: true` to get the same report without writing a byte; a real run throws `ScaffoldRefusal` when `needsAdopt` or `needsForce` is non-empty, a dry run returns them.

`created` lists new files; `replaced` lists files `force` overwrote wholesale; `preserved` lists files whose managed region was refreshed in place; `adopted`
lists files that gained a region for the first time. Both are output-relative.

**Existing files are never replaced silently.** Three cases, three outcomes:

| The existing file                              | Needs   | What happens                          |
| ---------------------------------------------- | ------- | ------------------------------------- |
| Carries a managed region, as the template does | nothing | Only the fenced block is replaced     |
| Has no region, but the template gives it one   | `adopt` | The block is inserted below its title |
| Anything else, `.agents/` canon included       | `force` | Replaced wholesale                    |

Rewriting a file with byte-identical content needs no permission. Without the
permission it needs, `scaffold()` **throws before writing anything**, so the
target is left exactly as it was.

A file whose markers are broken — a duplicated pair, an end before a start, a
start with no end — is not adoptable: adding a block beside a broken pair would
leave it just as unmergeable. It lands under `force`, because replacement is
the only thing a run could do to it. See [`classifyRegion()`](#classifyregiontext).

**Throws:** `ScaffoldRefusal` when a permission is missing. It is exported, so
`instanceof` works, and it carries the two lists apart because they are two
different questions to put to a human:

| Field        | Type       | Meaning                                              |
| ------------ | ---------- | ---------------------------------------------------- |
| `needsAdopt` | `string[]` | Marker-less stubs; adoption would keep their content |
| `needsForce` | `string[]` | Files a render would replace wholesale, edits lost   |

**Example:**

```javascript
import { scaffold, ScaffoldRefusal } from 'a2scaffold';

try {
  const result = await scaffold({
    templateName: 'scaffold/base',
    outputDir: './my-project',
    overrides: { project: { name: 'my-project' } },
  });
  console.log(result.outputDir); // "/absolute/path/to/my-project"
  console.log(result.template); // "scaffold/base"
} catch (err) {
  if (!(err instanceof ScaffoldRefusal)) throw err;
  console.error('would adopt:', err.needsAdopt);
  console.error('would replace:', err.needsForce);
}
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

All merged values are available in Handlebars templates as `{{ project.name }}`, etc. The process environment is **not** exposed to templates: a `{{ env.X }}` in a template renders empty. Pass what a template needs through `values.yaml` or `overrides`, where it is visible.

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

### `checkExistingFiles(templateDir, outDir, view?, extname?)`

Check which output files already exist in the target directory and would lose content. Use this to detect conflicts before calling `scaffold()`.

Files that carry a managed region on both sides are **not** conflicts: the
render replaces only the fenced block.

**Parameters:**

| Name          | Type     | Required | Default  | Description                                                                                                  |
| ------------- | -------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `templateDir` | `string` | Yes      |          | Path to the template's `template/` directory                                                                 |
| `outDir`      | `string` | Yes      |          | Target output directory to check                                                                             |
| `view`        | `object` | No       |          | Resolved values. Without it, `$if{…}` path segments cannot be evaluated and every conditional file is missed |
| `extname`     | `string` | No       | `".hbs"` | Template file extension                                                                                      |

Pass a **fully resolved** view — the one `resolveScaffoldConfig()` returns, not
a hand-built partial. Path formulas are evaluated exactly as the renderer
evaluates them, and a formula naming a variable the view does not define is an
error there and here.

**Returns:** `string[]` — list of conflicting file paths, relative to `outDir`. Empty array if no conflicts.

This is a prediction, not the verdict. It compares the **unrendered** template
against the target, so a file the render would rewrite byte-identically still
shows up here. `scaffold()` knows the difference and throws a `ScaffoldRefusal`
carrying the true lists — prefer that for deciding what a run would destroy,
and use this only to warn ahead of time.

**Example:**

```javascript
import {
  resolveTemplatePath,
  resolveScaffoldConfig,
  checkExistingFiles,
  scaffold,
} from 'a2scaffold';

const { templateDir } = resolveTemplatePath('scaffold/base');
const { view } = resolveScaffoldConfig({
  templateName: 'scaffold/base',
  outputDir: './my-project',
});
const conflicts = checkExistingFiles(templateDir, './my-project', view);

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

### `classifyConflicts(templateDir, outDir, view?, extname?)`

Split what `checkExistingFiles()` found into the two permissions `scaffold()`
distinguishes. Same parameters.

**Returns:** `{ adopt: string[], overwrite: string[] }`

| Property    | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| `adopt`     | Marker-less stubs — `scaffold({ adopt: true })` keeps their content                  |
| `overwrite` | Everything else, `.agents/` canon included — `scaffold({ force: true })` replaces it |

---

### `sync(options)`

Bring a repository's generated surface up to date without destroying anything.

Where `scaffold()` has one behaviour for every file, `sync()` separates the two
kinds of generated file: **managed** files, whose fenced region the template
owns, and **seeded** files, written once and then the human's. It writes only
inside one unambiguous managed region and never overwrites a seeded file that
already exists, so it has no `force`. A file whose markers are missing,
duplicated, fenced inside an example or out of order is reported, not merged.

**Parameters:**

| Name                   | Type      | Required | Description                                      |
| ---------------------- | --------- | -------- | ------------------------------------------------ |
| `options.templateName` | `string`  | Yes      | Template path (e.g. `"scaffold/base"`)           |
| `options.outputDir`    | `string`  | Yes      | Repository to update                             |
| `options.overrides`    | `object`  | No       | Values to deep-merge over resolved template view |
| `options.adopt`        | `boolean` | No       | Insert markers into a stub that has none         |
| `options.dryRun`       | `boolean` | No       | Report without writing                           |

**Returns:** `Promise<{ created, updated, unchanged, adopted, unmanaged, ambiguous, drifted }>`

| Property    | Type                                         | Meaning                                                              |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `created`   | `string[]`                                   | Absent from the repo, written fresh                                  |
| `updated`   | `string[]`                                   | Managed region refreshed                                             |
| `unchanged` | `string[]`                                   | Managed region already current                                       |
| `adopted`   | `string[]`                                   | Brought under management this run                                    |
| `unmanaged` | `string[]`                                   | The template owns a region here, this file has none                  |
| `ambiguous` | `Array<{ file: string, reason: string }>`    | Markers present but not forming one region; left untouched to repair |
| `drifted`   | `Array<{ file: string, missing: string[] }>` | Enforcement files where a required rule is not present verbatim      |

`ambiguous` is never adopted, even with `adopt` on: inserting a block beside a
duplicated or inverted pair would leave the file just as unmergeable and harder
to repair. The `reason` says which shape was found.

`drifted` names the rules, not every textual difference: reformatting the file
and adding rules of your own are not drift. The comparison is **verbatim** —
the same string in the same permission list. It does not evaluate what a
pattern matches, so a broader rule of your own that covers a required one still
reports the required one; that is a limit stated on purpose, not a claim that
your rule is insufficient.

**Example:**

```javascript
import { sync } from 'a2scaffold';

const plan = await sync({
  templateName: 'scaffold/base',
  outputDir: '.',
  dryRun: true,
});

console.log(plan.created); // [".agents/context/new-doc.md"]
for (const { file, missing } of plan.drifted) {
  console.warn(`${file} is missing: ${missing.join(', ')}`);
}
```

---

### `hasManagedRegion(text)`

Whether a file carries exactly one complete, correctly ordered managed region
outside any code block. A thin wrapper over [`classifyRegion()`](#classifyregiontext);
`true` only for the `valid` state.

---

### `classifyRegion(text)`

Classify a file's `<!-- a2scaffold:start -->` / `<!-- a2scaffold:end -->`
markers. This is what `scaffold()` and `sync()` consult before touching a file.

**Returns:** one of

| Shape                           | When                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `{ kind: 'none' }`              | No marker outside a code block                             |
| `{ kind: 'valid', start, end }` | Exactly one start followed by one end; offsets into `text` |
| `{ kind: 'ambiguous', reason }` | Markers present but not forming one region                 |

A marker counts only on its own line, indented at most three spaces, and
outside a fenced (` ``` ` or `~~~`) or indented code block — so a document that
shows the markers as an example is `none`, not a region.

The three states are kept apart because callers act differently on each:
merge needs `valid` on both sides, adoption accepts only `none`, and
`ambiguous` is reported for a human to repair. Collapsing `none` and
`ambiguous` was how `--adopt` once added a third marker pair to a file that
already had two.

---

## Skills API

### `validateSkill(skillDir)`

Validate a skill directory against the [agentskills.io specification](https://agentskills.io/specification). Checks for a valid `SKILL.md` with required YAML frontmatter fields and name format constraints.

**Parameters:**

| Name       | Type     | Required | Description                 |
| ---------- | -------- | -------- | --------------------------- |
| `skillDir` | `string` | Yes      | Path to the skill directory |

**Returns:** `{ valid: boolean, errors: string[], warnings: ConformanceWarning[], score: number, skill: object|null }`

| Property   | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `valid`    | `true` if the skill passes all validation checks                             |
| `errors`   | Array of validation error messages (empty if valid)                          |
| `warnings` | Conformance warnings — quality problems that never make a skill invalid      |
| `score`    | 0–100 local guidance score derived from `warnings`; see `scoreConformance()` |
| `skill`    | Parsed SKILL.md frontmatter object, or `null` if invalid                     |

Errors and warnings answer different questions. An error means the skill is
malformed and cannot be installed; a warning means it is well-formed but will
work badly — a description too vague to match a task against, say. A skill with
warnings is still valid.

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

### `auditSkill(skillDir)`

Screen a skill directory for supply-chain risks. A skill runs with the full
permissions of the agent that loads it, so an unreviewed one from a registry
reaches API keys, SSH credentials and the shell.

**Parameters:**

| Name       | Type     | Required | Description                 |
| ---------- | -------- | -------- | --------------------------- |
| `skillDir` | `string` | Yes      | Path to the skill directory |

**Returns:** `{ findings: AuditFinding[], scanned: number, clean: boolean }`

Each finding is `{ category, severity, file, line?, message }`, where
`category` is one of `network`, `credentials`, `execution`, `injection` or
`opaque`, and `severity` is `high` or `medium`. `installSkill()` refuses a
**downloaded** skill with any high-severity finding unless `force` is set;
local installs are not screened.

These are heuristics, not proof. A crawler skill legitimately reaches the
network. The audit's job is to say where to look.

```javascript
import { auditSkill } from 'a2scaffold';

const { findings, clean } = auditSkill('./.agents/skills/research');
for (const f of findings) {
  console.warn(`[${f.severity}] ${f.file}:${f.line ?? '-'} — ${f.message}`);
}
```

---

### `scoreConformance(frontmatter, body, options?)`

Score a parsed `SKILL.md` for quality problems that do not make it invalid.
`validateSkill()` calls this for you; call it directly only when you already
have the parsed pieces.

**Returns:** `{ score: number, warnings: ConformanceWarning[] }`, each warning
`{ code, message, weight? }`.

`score` is a **local guidance score**, not a rating against any published
specification. It is 100 minus weighted penalties for the warnings below, and
its checks draw on the Agent Skills spec, Claude Code's listing behaviour and
local judgement in roughly equal measure. Read the warnings; treat the number
as a rough ordering, not a measurement.

| Code                      | What it means                                         |
| ------------------------- | ----------------------------------------------------- |
| `description-too-short`   | Too little signal to match a task against             |
| `description-no-trigger`  | Says what the skill does, never when to use it        |
| `listing-cap-exceeded`    | Truncated in the skill listing                        |
| `body-over-budget`        | Body far past the recommended token budget            |
| `body-empty`              | No instructions below the frontmatter                 |
| `unknown-frontmatter-key` | Likely a typo — the key is silently ignored otherwise |

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
