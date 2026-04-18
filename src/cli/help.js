import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {{ version: string }} */
export const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
);

export const HELP = `
a2scaffold v${pkg.version}

  Scaffold AI agent configuration files in any repository.

Usage:
  a2scaffold [options]              Scaffold files (default command)
  a2scaffold skill <action>         Manage agent skills

Scaffold Options:
  -u, --use <name>        Template to use (default: "base")
  -o, --output <dir>      Output directory (default: ".")
  -n, --name <name>       Project name (default: directory name)
  -l, --list              List available templates
  -f, --force             Overwrite existing files
      --dry-run           Preview without writing files
  -h, --help              Show this help
  -v, --version           Show version

Skill Commands:
  skill add <source>      Install a skill from local path or GitHub
  skill list              List installed skills
  skill validate [name]   Validate installed skills
  skill ref [options]     Create skill references (lightweight pointers)

Skill Sources:
  ./path/to/skill         Local directory
  owner/repo/path         GitHub shorthand
  https://github.com/...  Full GitHub URL

Skill Options:
  -d, --agents-dir <dir>  Path to .agents/ directory (default: ".agents")
  -f, --force             Overwrite existing skill

Skill Ref Options:
      --skill <name|all>  Skill name or "all" to ref every skill (required)
      --from <dir>        Source agents dir (default: ".agents")
      --to <dir>          Destination agents dir (required)
  -f, --force             Overwrite existing skill refs

Examples:
  npx a2scaffold
  npx a2scaffold --use base --name my-project
  npx a2scaffold skill add ./my-skill
  npx a2scaffold skill add anthropics/skills/code-review
  npx a2scaffold skill list
  npx a2scaffold skill validate
  npx a2scaffold skill ref --skill clean-code --to .claude
  npx a2scaffold skill ref --skill all --from ../shared/.agents --to .agents
`.trim();
