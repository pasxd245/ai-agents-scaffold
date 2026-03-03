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

## Options

| Flag | Short | Default | Description |
| --- | --- | --- | --- |
| `--use <name>` | `-u` | `base` | Template to use |
| `--output <dir>` | `-o` | `.` | Output directory |
| `--name <name>` | `-n` | directory name | Project name used in generated files |
| `--list` | `-l` | | List available templates and exit |
| `--force` | `-f` | | Overwrite existing files without prompting |
| `--dry-run` | | | Preview what would be generated without writing |
| `--help` | `-h` | | Show help text |
| `--version` | `-v` | | Show version number |

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
    - .agents/AGENTS.md
    - .agents/context/.gitkeep
    - .agents/memory/.gitkeep
    - .agents/plan/PDCA.md
    - .agents/plan/cycles/.gitkeep
    - .agents/plan/promotions.md
    - .agents/prompts/.gitkeep
    - .agents/skills/.gitkeep
    - .claude/CLAUDE.md
    - .github/copilot-instructions.md
```

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

## Generated output structure

The `base` template generates:

```text
.agents/
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

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Error (file conflicts, invalid template, missing arguments, etc.) |
