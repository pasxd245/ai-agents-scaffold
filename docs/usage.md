# CLI Usage Guide

## Installation

```bash
# Use directly with npx (no install needed)
npx a2scaffold

# Or install globally
npm install -g a2scaffold

# Or add to a project as a dev dependency
pnpm add -D a2scaffold
```

Requires Node.js >= 20.

## Quick start

Run with no arguments to scaffold the base AI agent setup into the current directory:

```bash
npx a2scaffold
```

## Commands

a2scaffold has two command groups:

| Command                     | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `a2scaffold [options]`      | Scaffold AI agent config files (default)            |
| `a2scaffold init [options]` | Same as the default scaffold command                |
| `a2scaffold skill <action>` | Manage agent skills — [see Skills Guide](skills.md) |

Running `a2scaffold` with no subcommand (or `a2scaffold init`) runs scaffolding.

## Scaffold options

| Flag             | Short | Default        | Description                                     |
| ---------------- | ----- | -------------- | ----------------------------------------------- |
| `--use <name>`   | `-u`  | `base`         | Template to use                                 |
| `--output <dir>` | `-o`  | `.`            | Output directory                                |
| `--name <name>`  | `-n`  | directory name | Project name used in generated files            |
| `--list`         | `-l`  |                | List available templates and exit               |
| `--force`        | `-f`  |                | Overwrite existing files without prompting      |
| `--dry-run`      |       |                | Preview what would be generated without writing |
| `--help`         | `-h`  |                | Show help text                                  |
| `--version`      | `-v`  |                | Show version number                             |

## Common workflows

### Scaffold into the current directory

```bash
a2scaffold
```

Uses the `base` template and infers the project name from the current directory name.

### Scaffold into a new directory with a project name

```bash
a2scaffold --output ./my-repo --name my-repo
```

Creates `./my-repo/` if it doesn't exist and generates all files inside it.

### Preview before writing

```bash
a2scaffold --dry-run
```

Shows the list of files that would be generated, without writing anything:

```text
Dry run — template "base" would generate:

  Output directory: /home/user/my-project
  Project name: my-project

  Files:
    - $if{agents.codex}/AGENTS.md
    - $if{agents.gemini}/GEMINI.md
    - .agents/.gitignore
    - .agents/AGENTS.md
    - $if{agents.claude}/.claude/CLAUDE.md
    - $if{agents.codex}/.codex/.gitkeep
    - $if{agents.copilot}/.github/copilot-instructions.md
    - $if{agents.gemini}/.gemini/.gitkeep
    - .agents/context/.gitkeep
    - .agents/memory/.gitkeep
    - .agents/plan/PDCA.md
    - .agents/plan/promotions.md
    - .agents/prompts/.gitkeep
    - .agents/prompts/reflect-agents.prompt.md
    - .agents/skills/.gitkeep
    - .agents/plan/cycles/.gitkeep
```

Dry-run output is based on raw template paths, so conditional template
directories such as `$if{agents.claude}` may appear in the preview even
though they are evaluated during rendering.

### List available templates

```bash
a2scaffold --list
```

Output:

```text
Available templates:

  - base
```

### Overwrite existing files

If the output directory already contains files that would be generated, the CLI exits with an error by default:

```text
The following files already exist and would be overwritten:

  - .agents/AGENTS.md
  - .claude/CLAUDE.md

Use --force to overwrite existing files.
```

Use `--force` to overwrite:

```bash
a2scaffold --force
```

### Use a specific template

```bash
a2scaffold --use base
```

When more templates are added (e.g. `python-crew`, `langchain-rag`), use this flag to select one.

## Customizing template values

Each template ships with default values (`templates/scaffold/<name>/values.yaml` plus optional `values/` partials). To override them per-project without forking the template, drop a values file in your project root:

```text
<project>/.a2scaffold/values.yaml   # or values.yml, or values.json — pick one
```

Example `.a2scaffold/values.yaml`:

```yaml
project:
  name: acme-api
agents:
  claude: true
  codex: false
  gemini: false
  copilot: false
```

**Precedence (lowest to highest):**

1. Template defaults (`values.yaml` + `values/`)
2. Project values (`<project>/.a2scaffold/values.{yaml,yml,json}`)
3. CLI flags (currently `--name` only)

The project values file is deep-merged over the template defaults — keys you don't set keep their template values. The shape mirrors the template's own `values.yaml`; check it for the available keys (e.g. `project.name`, `agents.*`).

If the file is malformed or both `values.yaml` and `values.json` exist in `.a2scaffold/`, the CLI exits with an error.

## Configuration (`.a2scaffoldrc`)

Registry definitions for `skill add --from <registry>` are read from `.a2scaffoldrc` at two levels:

| Level   | Location                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------- |
| User    | `~/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` (only)                                               |
| Project | `<project>/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` or `<project>/.a2scaffoldrc.{json,yaml,yml}` |

Project entries override user entries. At each level, only one form is allowed — if both the directory and flat forms exist, the CLI exits with a conflict error. See the [Skills Guide](skills.md#from-a-named-registry-a2scaffoldrcjson) for registry schema and examples.

## Generated output structure

The `base` template generates:

```text
.agents/
  .gitignore             # Keeps placeholder files trackable
  AGENTS.md              # Pair programming guide for AI agents
  context/               # Canonical knowledge (human-curated)
    .gitkeep
  memory/                # Agent-generated learnings
    .gitkeep
  plan/
    PDCA.md              # PDCA methodology guide
    promotions.md        # Promotion log for validated learnings
    cycles/              # Individual PDCA cycle records
      .gitkeep
  prompts/               # Scanning & generation prompts
    .gitkeep
    reflect-agents.prompt.md
  skills/                # Reusable agent procedures
    .gitkeep
.claude/
  CLAUDE.md              # Claude Code project instructions
.github/
  copilot-instructions.md  # GitHub Copilot project instructions
```

## File conflict handling

Before writing, the CLI checks whether any output files already exist in the target directory.

- **No conflicts**: files are written normally.
- **Conflicts found, no `--force`**: the CLI prints the conflicting file list and exits with code 1.
- **Conflicts found, `--force`**: the CLI prints a warning and overwrites the files.

## Skills management

a2scaffold includes a `skill` subcommand for installing, listing,
validating, and referencing [Agent Skills](https://agentskills.io/specification).
See the [Skills Guide](skills.md) for full documentation.

## Exit codes

| Code | Meaning                                                                          |
| ---- | -------------------------------------------------------------------------------- |
| `0`  | Success                                                                          |
| `1`  | Error (file conflicts, invalid template, invalid skill, missing arguments, etc.) |
