# a2scaffold

> Scaffolds a governed knowledge base for AI coding agents — one source of
> truth, an authority model that says who may write what, and a promotion path
> from agent findings to project canon.
> `a2` = **a**i **a**gents.

Several tools already emit `CLAUDE.md`, `AGENTS.md` and `.cursorrules` from a
single source. `a2scaffold` does that too, but it is not the point. The point
is what surrounds the files:

- **Authority separation** — `.agents/context/` is human-owned canon;
  `.agents/memory/` is where agents write. Claude Code is configured to ask
  before it edits canon. That rule covers the `Edit` tool in interactive
  sessions — a speed bump in the loop, not a wall; the docs say where it stops.
- **A promotion path** — findings start as drafts, get reviewed, and are
  promoted into canon with a logged rationale. Knowledge earns its place.
- **Verification cycles** — each shipped phase records what was checked, so
  the guidance stays tied to evidence.

## The working model

The layout above is not a filing system. It is the shape of a way of working
with an agent that the author calls **CoSF, the Co-spiral Framework**: human
and AI take turns lifting each other's thinking, one revolution at a time.
Three claims, each labelled with how tested it is, because a claim without
that label is marketing:

| Claim                                                                                                                                                                              | Status                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **The human is the loop.** The agent is instrumentation inside a person's cycle of understanding, not the other way round. Canon is human-promoted; agents draft, verify, propose. | Stance, one recorded instance |
| **HI × AI, not HI + AI.** Each side scales the other, and the product can be smaller than either factor. A scaffold can make an agent worse; an agent can make a human worse.      | Untested, falsifiable         |
| **A scaffold is a specialization layer.** A frontier model arrives generally capable and specifically ignorant; `.agents/` is what closes that gap fast.                           | Sourced, by analogy           |

The full statement, with what would falsify each claim, is in
[philosophy.md](.agents/context/philosophy.md). The repository runs the model
on itself: [Round 13](.agents/plan/cycles/Round_13.md) records the review loop
this branch went through before its own PR, including what each pass missed.

## Quick Start

```bash
npx a2scaffold
```

This generates the base AI agent setup in your current directory:

```text
.agents/                       # Shared knowledge base — written once
  .gitignore                   # Keeps placeholder files trackable
  AGENTS.md                    # The heart — every stub points here
  reference/                   # Topic docs, each with its own trigger
  context/                     # Canonical knowledge (human-curated)
    harness-behaviour.md       # How harnesses load and enforce (dated)
    memory-placement.md        # Which memory system a finding belongs in
    philosophy.md              # Principles that decide close calls
  memory/                      # Agent-generated learnings
  prompts/                     # Scanning & generation prompts
    reflect-agents.prompt.md   # Agent reflection prompt
  skills/                      # Reusable procedures
  plan/
    PDCA.md                    # PDCA methodology
    promotions.md              # Promotion log
    cycles/                    # Individual PDCA rounds
.claude/settings.json          # Ask before Edit() on canon — interactive only
AGENTS.md                      # Stub for Codex & the AGENTS.md convention
CLAUDE.md                      # Stub for Claude Code — @.agents/AGENTS.md
.github/copilot-instructions.md  # Stub for Copilot — restates it (cannot import)
```

`.agents/AGENTS.md` is the **heart** — project knowledge lives there once.
Each harness reads a different filename, so the root files are peer stubs that
all point at it:

| Stub                              | Harness                                                | Points at the KB by                   |
| --------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `CLAUDE.md`                       | Claude Code                                            | `@.agents/AGENTS.md`, expanded inline |
| `GEMINI.md`                       | Gemini CLI                                             | `@.agents/AGENTS.md`, expanded inline |
| `AGENTS.md`                       | Codex, Cursor, Jules, Devin, Amp, Zed, Windsurf, Aider | the same line, read as a path         |
| `.github/copilot-instructions.md` | GitHub Copilot                                         | restated — it cannot import           |

No stub imports another, so every one reaches the knowledge base in a single
hop and no harness depends on a file meant for a different one.

Toggle each stub in the template's `values.yaml` under `agents:`. `AGENTS.md`,
Claude Code and Copilot are on by default.

## Installation

```bash
# Use directly with npx (no install needed)
npx a2scaffold

# Or install globally
npm install -g a2scaffold

# Or add to a project
pnpm add -D a2scaffold
```

Requires Node.js >= 20.

## Usage

```bash
# Scaffold with defaults (template: base, output: current dir)
a2scaffold

# Same as the default scaffold command
a2scaffold init

# Specify project name
a2scaffold --name my-project

# Output to a different directory
a2scaffold --output ./my-repo

# Use a specific template
a2scaffold --use base

# Preview what would be generated, including files that need --adopt or --force
a2scaffold --dry-run

# Bring an existing repo up to date without touching anything you wrote
a2scaffold sync
a2scaffold sync --dry-run

# List available templates
a2scaffold --list

# Adopt existing agent files: keep what they say, add the generated block
a2scaffold --adopt

# Replace existing files wholesale, losing edits (implies --adopt for stubs)
a2scaffold --force
```

### Options

| Flag        | Short | Default  | Description                                                           |
| ----------- | ----- | -------- | --------------------------------------------------------------------- |
| `--use`     | `-u`  | `base`   | Template to use                                                       |
| `--output`  | `-o`  | `.`      | Output directory                                                      |
| `--name`    | `-n`  | dir name | Project name                                                          |
| `--list`    | `-l`  |          | List available templates                                              |
| `--adopt`   |       |          | Insert the generated block into an existing stub, keeping its content |
| `--force`   | `-f`  |          | Replace existing files wholesale, edits lost (implies `--adopt`)      |
| `--dry-run` |       |          | Preview without writing                                               |
| `--help`    | `-h`  |          | Show help                                                             |
| `--version` | `-v`  |          | Show version                                                          |

## Programmatic API

```javascript
import { scaffold, listTemplates } from 'a2scaffold';

// List available templates
const templates = listTemplates();

// Scaffold to a directory
await scaffold({
  templateName: 'scaffold/base',
  outputDir: './my-project',
  overrides: { project: { name: 'my-project' } },
});
```

## Documentation

- [CLI Usage Guide](docs/usage.md) — scaffolding options, workflows, and examples
- [Upgrading from 0.1.x](docs/usage.md#upgrading-from-01x) — the two file moves v0.2.0 asks of an existing repo
- [Skills Guide](docs/skills.md) — install, list, validate, audit, and reference agent skills
- [API Reference](docs/api.md) — programmatic API for custom tooling

## Philosophy

- **A personal tool that might generalise — in that order.** No vision
  statement, no 1.0 promise. An idea earns a plan doc when daily use proves
  the pain, not before.
- **Explicit over implicit.** `skill add` resolves locally; reaching the
  network needs an explicit `--from`. No hidden fallbacks, no magic defaults.
- **Built-ins over dependencies.** Two production deps. Arg parsing is
  `node:util parseArgs`, tests are `node:test`, types are JSDoc plus
  `tsc --noEmit`. No build step.
- **Paths are the grouping.** The directory path is the namespace — no
  manifest to keep in sync with the filesystem.
- **Humans own canon, agents own drafts.** Agents write to `.agents/memory/`;
  promotion into `.agents/context/` is a human decision, logged.
- **Stability over speed.** A pattern seen once is an observation. Only
  repeated patterns get promoted.

Full version, with rationale:
[.agents/context/philosophy.md](.agents/context/philosophy.md).

## Contributing Templates

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add new templates.

## License

See [LICENSE](LICENSE).

## Transparency

AI-assisted development (e.g., Claude Code, Copilot) was used for scaffolding and iteration.
