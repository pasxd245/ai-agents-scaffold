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
    - .agents/.gitignore
    - .agents/AGENTS.md
    - .agents/context/.gitkeep
    - .agents/context/harness-behaviour.md
    - .agents/context/memory-placement.md
    - .agents/context/philosophy.md
    - .agents/memory/_TEMPLATE.md
    - .agents/memory/.gitkeep
    - .agents/plan/cycles/_TEMPLATE.md
    - .agents/plan/cycles/.gitkeep
    - .agents/plan/DoD.md
    - .agents/plan/PDCA.md
    - .agents/plan/promotions.md
    - .agents/prompts/.gitkeep
    - .agents/prompts/compact-content.prompt.md
    - .agents/prompts/reflect-agents.prompt.md
    - .agents/reference/mechanisms.md
    - .agents/reference/memory-and-promotion.md
    - .agents/reference/root-files.md
    - .agents/reference/skills.md
    - .agents/skills/.gitkeep
    - .claude/settings.json
    - .github/copilot-instructions.md
    - AGENTS.md
    - CLAUDE.md
```

Dry-run evaluates conditional paths against the resolved values, so the list
is what you will actually get. Files gated on a disabled harness — `GEMINI.md`
and `.codex/` above, with `agents.gemini` and `agents.codex` off — are omitted
rather than shown with their `$if{...}` marker.

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
  - CLAUDE.md

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
  AGENTS.md              # The heart — every stub points here
  reference/             # Topic docs, each with its own trigger
    mechanisms.md
    memory-and-promotion.md
    root-files.md
    skills.md
  context/               # Canonical knowledge (human-curated)
    .gitkeep
    harness-behaviour.md # How harnesses load and enforce (dated)
    memory-placement.md  # Which memory system a finding belongs in
    philosophy.md        # Principles that decide close calls
  memory/                # Agent-generated learnings
    .gitkeep
    _TEMPLATE.md         # Copy this for a new memory entry
  plan/
    DoD.md               # Standing bar every round clears
    PDCA.md              # PDCA methodology guide
    promotions.md        # Promotion log for validated learnings
    cycles/              # Individual PDCA cycle records
      .gitkeep
      _TEMPLATE.md       # Copy this for a new round
  prompts/               # Scanning & generation prompts
    .gitkeep
    compact-content.prompt.md
    reflect-agents.prompt.md
  skills/                # Reusable agent procedures
    .gitkeep
.claude/
  settings.json          # Permission rules backing the authority table
AGENTS.md                # Stub for Codex & the AGENTS.md convention
CLAUDE.md                # Stub for Claude Code (@.agents/AGENTS.md)
.github/
  copilot-instructions.md  # Stub for Copilot — restates it (cannot import)
```

### Opt-in: `.agents/decisions/`

Off by default. Set `plan.decisions: true` to also generate:

```text
.agents/
  decisions/             # Cross-round commitments
    README.md            # What belongs here, and what does not
    _TEMPLATE.md         # Copy this for a new decision
```

A decision file holds a promise that outlives the round that made it — _"we
agreed not to build X until Y"_. Round docs are round-scoped and `context/` is
canon an agent must follow; neither holds this. Enabling the flag also adds
`decisions/` to the knowledge base's authority table and to the permission
rules in `.claude/settings.json`, so it is protected like the rest of canon.

It stays off by default because it is real surface, and a repo that has not
yet felt cross-round drift does not need it.

### Opt-in: `.agents/plan/programs/`

Off by default. Set `plan.programs: true` to also generate:

```text
.agents/
  plan/
    programs/            # Multi-round work
      README.md          # When a program is warranted
      _TEMPLATE.md       # Copy this for a new program
```

A round in `cycles/` is one unit of execution; a program is the goal above it —
the phase order and the gate each phase clears. Open one when the work will not
fit in a single round **and** the phases depend on each other. Independent work
does not need a program, it needs several rounds.

Each round names its program in its `**Part of**` header; that header is the
only link between the two. `programs/` sits under `plan/`, so the existing
authority rule and permission entry already cover it.

### A convention we suggest, but do not generate: `docs/agents/`

The scaffold stops at `.agents/`, on a deliberate line:

> `.agents/` is what an **agent** must read to do the next task.
> `docs/agents/` is what a **human** reads to understand the project.

An agent may draft either; the audience decides where it lands. Because the
second is human-facing, the tool has no opinion it can enforce there — so it
generates nothing and charges you nothing for it.

If you want the convention, it looks like this:

```text
docs/agents/
  workflows/                  # End-to-end flows this repo supports
    <name>.workflow.md
  plan/                       # Co-planning docs — human and agent, together
    <yyyyMMdd>-<name>.plan.md
```

Read on demand, never auto-loaded, and `.agents/context/` wins any conflict.
A plan doc that kicks off real work hands off to `.agents/plan/` — either a
single round in `cycles/`, or a program (see below) when it spans several.

## Re-running the scaffold

Generated stubs — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and
`.github/copilot-instructions.md` — fence their generated content between
markers:

```markdown
# CLAUDE.md — my-project

<!-- a2scaffold:start -->

...generated...

<!-- a2scaffold:end -->

## Anything you write here is yours
```

Re-running `a2scaffold` replaces **only** the fenced block. Edits outside it
survive, and those files are therefore not reported as conflicts — updating
them needs no `--force`.

Two parts of every stub are deliberately outside the block:

| Outside the block          | Why                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The title**              | `# CLAUDE.md — my-project` names the file, which is the least useful thing it can tell a model reading it at launch. Rename it to name the _project_: `# AI-Cowork — the owner's daily work & life base`. It will survive every re-scaffold. |
| **The philosophy summary** | It ships as five placeholders, and `.agents/context/philosophy.md` tells you to replace them. Inside the block, doing so would be silently reverted on the next run. Keep it in step with the canonical list.                                |

Everything under `.agents/` has no managed region on purpose. It is canonical
knowledge you are expected to edit freely, so overwriting it is destructive
and still requires `--force`.

The markers are HTML comments: invisible in rendered markdown, and stripped by
harnesses that strip comments before loading the file, so they cost nothing at
read time.

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
