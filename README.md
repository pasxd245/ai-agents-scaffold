# a2scaffold

> Scaffolds a governed knowledge base for AI coding agents — one source of
> truth, an authority model that says who may write what, and a promotion path
> from agent findings to project canon.
> `a2` = **a**i **a**gents.

Several tools already emit `CLAUDE.md`, `AGENTS.md` and `.cursorrules` from a
single source. `a2scaffold` does that too, but it is not the point. The point
is what surrounds the files:

- **Authority separation** — `.agents/context/` is human-owned canon;
  `.agents/memory/` is where agents write. The split is backed by permission
  rules, not just prose, because instruction files are context an agent can
  ignore rather than configuration it cannot.
- **A promotion path** — findings start as drafts, get reviewed, and are
  promoted into canon with a logged rationale. Knowledge earns its place.
- **Verification cycles** — each shipped phase records what was checked, so
  the guidance stays tied to evidence.

## Quick Start

```bash
npx a2scaffold
```

This generates the base AI agent setup in your current directory:

```text
.agents/                       # Shared knowledge base — written once
  .gitignore                   # Keeps placeholder files trackable
  AGENTS.md                    # The heart — every stub points here
  governance.md                # Memory format, promotion, authorised changes
  reference/                   # Topic docs, each with its own trigger
  context/                     # Canonical knowledge (human-curated)
    philosophy.md              # Principles that decide close calls
  memory/                      # Agent-generated learnings
  prompts/                     # Scanning & generation prompts
    reflect-agents.prompt.md   # Agent reflection prompt
  skills/                      # Reusable procedures
  plan/
    PDCA.md                    # PDCA methodology
    promotions.md              # Promotion log
    cycles/                    # Individual PDCA rounds
.claude/settings.json          # Ask before edits to canon — enforces the rules
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

# Preview what would be generated
a2scaffold --dry-run

# List available templates
a2scaffold --list

# Overwrite existing files
a2scaffold --force
```

### Options

| Flag        | Short | Default  | Description              |
| ----------- | ----- | -------- | ------------------------ |
| `--use`     | `-u`  | `base`   | Template to use          |
| `--output`  | `-o`  | `.`      | Output directory         |
| `--name`    | `-n`  | dir name | Project name             |
| `--list`    | `-l`  |          | List available templates |
| `--force`   | `-f`  |          | Overwrite existing files |
| `--dry-run` |       |          | Preview without writing  |
| `--help`    | `-h`  |          | Show help                |
| `--version` | `-v`  |          | Show version             |

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
