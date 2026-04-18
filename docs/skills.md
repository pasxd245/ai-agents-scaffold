# Skills Guide

a2scaffold can install, list, and validate [Agent Skills](https://agentskills.io/specification) in your project's `.agents/skills/` directory.

Skills are modular folders of instructions, scripts, and resources that AI agents discover and load on demand. a2scaffold provides lightweight skill management — install from local paths or GitHub, validate against the spec, and list what's installed. For registry search and auto-updates, see [Using with ecosystem tools](#using-with-ecosystem-tools).

## Quick start

```bash
# Install a skill from GitHub
a2scaffold skill add anthropics/skills/skills/pdf

# List installed skills
a2scaffold skill list

# Validate all installed skills
a2scaffold skill validate
```

## Commands

### `a2scaffold skill add <source>`

Install a skill into `.agents/skills/`.

**Source formats:**

| Format           | Example                                                 |
| ---------------- | ------------------------------------------------------- |
| Local path       | `./my-skill`, `../shared/code-review`, `/absolute/path` |
| GitHub shorthand | `owner/repo/path/to/skill`                              |
| GitHub URL       | `https://github.com/owner/repo/tree/main/path/to/skill` |

**From a local directory:**

```bash
a2scaffold skill add ./path/to/my-skill
```

The source must contain a valid `SKILL.md` with YAML frontmatter. The skill is copied into `.agents/skills/<name>/`.

**From GitHub:**

```bash
# Shorthand — owner/repo/path
a2scaffold skill add anthropics/skills/skills/pdf

# Full URL with branch
a2scaffold skill add https://github.com/anthropics/skills/tree/main/skills/pdf
```

Requires `git` to be installed. Uses sparse checkout to download only the specified skill directory, not the entire repository.

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

Exits with code 1 if any skill is invalid.

## Options

These flags apply to all `skill` subcommands:

| Flag                 | Short | Default   | Description                                                                |
| -------------------- | ----- | --------- | -------------------------------------------------------------------------- |
| `--agents-dir <dir>` | `-d`  | `.agents` | Path to the `AGENT` directory (ex: .agents, or .claude, or .github, e.t.c) |
| `--force`            | `-f`  |           | Overwrite existing skill (for `skill add`)                                 |

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

a2scaffold's skill management is intentionally minimal — it handles install, list, and validate. For advanced features, use ecosystem tools alongside a2scaffold:

- **[skills.sh](https://skills.sh/)** (Vercel) — `npx skills add owner/repo/skill` — registry search, auto-updates, supports 40+ agents
- **[gh-upskill](https://github.com/trieloff/gh-upskill)** — `gh upskill owner/repo` — install from GitHub with path filtering

After installing skills with external tools, run `a2scaffold skill validate` to verify they conform to the spec.
