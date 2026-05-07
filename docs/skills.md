# Skills Guide

a2scaffold can install, list, validate, and reference [Agent Skills](https://agentskills.io/specification) in your project's `.agents/skills/` directory.

Skills are modular folders of instructions, scripts, and resources that AI agents discover and load on demand. a2scaffold provides lightweight skill management — install from local paths or GitHub, validate against the spec, and list what's installed. For registry search and auto-updates, see [Using with ecosystem tools](#using-with-ecosystem-tools).

## Quick start

```bash
# Install a skill from GitHub (full URL)
a2scaffold skill add https://github.com/anthropics/skills/tree/main/skills/pdf

# Install a local skill
a2scaffold skill add ./my-skill

# List installed skills
a2scaffold skill list

# Validate all installed skills
a2scaffold skill validate
```

## Commands

### `a2scaffold skill add <source>`

Install a skill into `.agents/skills/`.

**Source formats:**

| Format        | Example                                                 |
| ------------- | ------------------------------------------------------- |
| Built-in name | `my-skill`, `planning/master-plan`                      |
| Local path    | `./my-skill`, `../shared/code-review`, `/absolute/path` |
| GitHub URL    | `https://github.com/owner/repo/tree/main/path/to/skill` |

Resolution order: explicit local paths and `https://github.com/...` URLs are used directly; otherwise, if `--from <registry>` is set the name is fetched from that registry; otherwise the name is looked up in the built-in pool at `templates/skills/`. Bare `owner/repo/path` shorthand is **not** accepted — use a full URL or a registry.

**From the built-in pool:**

Built-in names resolve under `templates/skills/` when this package ships
skills there.

```bash
# Bare name — installs templates/skills/<name>/
a2scaffold skill add my-skill

# Nested name — preserves the path under skills/
a2scaffold skill add planning/master-plan
```

Bare and nested names preserve the requested path: `skill add planning/master-plan` lands at `.agents/skills/planning/master-plan/`. Explicit paths and URLs use the source's basename instead.

**From a local directory:**

```bash
a2scaffold skill add ./path/to/my-skill
```

The source must contain a valid `SKILL.md` with YAML frontmatter. The skill is copied into `.agents/skills/<basename>/`.

**From GitHub:**

```bash
a2scaffold skill add https://github.com/anthropics/skills/tree/main/skills/pdf
```

Requires `git` to be installed. Uses sparse checkout to download only the specified skill directory, not the entire repository.

**From a named registry (`.a2scaffoldrc.json`):**

Define registries in a `.a2scaffoldrc.json` at the project root, then reference them by name:

```json
{
  "registries": {
    "anthropics": {
      "url": "github:anthropics/skills",
      "path": "skills",
      "ref": "main"
    }
  }
}
```

```bash
a2scaffold skill add pdf --from anthropics
```

The skill name is appended to the registry's `path`, and the resolved tree (`anthropics/skills/skills/pdf` at `main`) is fetched via sparse checkout.

**Overwrite an existing skill:**

```bash
a2scaffold skill add ./updated-skill --force
```

Without `--force`, the command exits with an error if the skill already exists.

### `a2scaffold skill list`

List all installed skills with their names and descriptions.

```bash
a2scaffold skill list
```

Output:

```text
Installed skills:

  pdf
    Use this skill whenever the user wants to do anything with PDF files.
```

### `a2scaffold skill validate [name]`

Validate installed skills against the [agentskills.io specification](https://agentskills.io/specification).

```bash
# Validate all installed skills
a2scaffold skill validate

# Validate a specific skill
a2scaffold skill validate pdf
```

Checks each skill's `SKILL.md` for:

- Valid YAML frontmatter
- Required `name` field (1-64 chars, lowercase alphanumeric + hyphens, matches directory name)
- Required `description` field (1-1024 chars)
- Optional field constraints (`compatibility` max 500 chars)

Exits with code 1 if any skill is invalid. Output for each skill is shown as `✔ <name> [skill|skill-ref] — valid` or `✘ <name> [type] — invalid` followed by error details.

### `a2scaffold skill ref --skill <name|all> --to <dir>`

Create lightweight **skill-ref** pointers in a destination agents directory that resolve back to skills installed in a source agents directory. Skill refs let multiple agent directories (`.claude`, `.github`, `.gemini`, …) share a single canonical skill source without duplicating files.

```bash
# Ref a single skill from .agents into .claude
a2scaffold skill ref --skill clean-code --to .claude

# Ref every skill from .agents into .github
a2scaffold skill ref --skill all --from .agents --to .github
```

**Flags:**

| Flag             | Required | Default   | Description                                             |
| ---------------- | -------- | --------- | ------------------------------------------------------- |
| `--skill <name>` | yes      |           | Skill name, or `all` to ref every skill under `<from>`  |
| `--to <dir>`     | yes      |           | Destination agents directory                            |
| `--from <dir>`   | no       | `.agents` | Source agents directory containing the canonical skills |
| `-f, --force`    | no       |           | Overwrite existing skill-refs at the destination        |

A skill-ref is a `SKILL.md` whose frontmatter `metadata.type` is `skill-ref` and whose body points to the canonical skill path. `skill validate` walks the ref chain and validates the terminal skill.

## Options

`-d, --agents-dir <dir>` (default `.agents`) applies to `skill add`, `skill list`, and `skill validate`. `skill ref` uses `--from` and `--to` instead.

| Flag                 | Short | Default   | Applies to          | Description                                               |
| -------------------- | ----- | --------- | ------------------- | --------------------------------------------------------- |
| `--agents-dir <dir>` | `-d`  | `.agents` | add, list, validate | Target agents directory (e.g. `.agents`, `.claude`, etc.) |
| `--from <name>`      |       |           | add                 | Fetch from a registry defined in `.a2scaffoldrc.json`     |
| `--force`            | `-f`  |           | add, ref            | Overwrite an existing skill or skill-ref                  |

## Skill format reference

Each skill is a directory containing at minimum a `SKILL.md` file:

```text
my-skill/
  SKILL.md          # Required — YAML frontmatter + instructions
  scripts/          # Optional — executable code
  references/       # Optional — additional docs
  assets/           # Optional — templates, data files
```

`SKILL.md` must include YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does and when to use it.
---
```

The `name` field must match the directory name. See the full [Agent Skills specification](https://agentskills.io/specification) for all fields and conventions.

## Using with ecosystem tools

a2scaffold's skill management is intentionally minimal — it handles install, list, validate, and skill-ref creation. For advanced features, use ecosystem tools alongside a2scaffold:

- **[skills.sh](https://skills.sh/)** (Vercel) — `npx skills add owner/repo/skill` — registry search, auto-updates, supports 40+ agents
- **[gh-upskill](https://github.com/trieloff/gh-upskill)** — `gh upskill owner/repo` — install from GitHub with path filtering

After installing skills with external tools, run `a2scaffold skill validate` to verify they conform to the spec.
