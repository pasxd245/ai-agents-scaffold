# a2scaffold

> CLI tool to scaffold AI agent configuration files in any repository.
> `a2` = **a**i **a**gents.

## Quick Start

```bash
npx a2scaffold
```

This generates the base AI agent setup in your current directory:

```text
.agents/
  AGENTS.md       # Pair programming guide for AI agents
  context/        # Canonical knowledge (human-curated)
  memory/         # Agent-generated learnings
  prompts/        # Scanning & generation prompts
  skills/         # Reusable procedures
  plan/
    PDCA.md       # PDCA methodology
    promotions.md # Promotion log
    cycles/       # Individual PDCA rounds
.claude/CLAUDE.md # Claude Code project instructions
.github/copilot-instructions.md  # Copilot project instructions
```

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
  templateName: 'base',
  outputDir: './my-project',
  overrides: { project: { name: 'my-project' } },
});
```

## Documentation

- [CLI Usage Guide](docs/usage.md) — scaffolding options, workflows, and examples
- [Skills Guide](docs/skills.md) — install, list, and validate agent skills
- [API Reference](docs/api.md) — programmatic API for custom tooling

## Contributing Templates

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add new templates.

## License

See [LICENSE](LICENSE).

## Transparency

AI-assisted development (e.g., Claude Code, Copilot) was used for scaffolding and iteration.
