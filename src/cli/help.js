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
  a2scaffold init [options]         Same as default scaffold command
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
  skill add <source> [options]              Install a skill into .agents/skills
  skill list [options]                      List installed skills
  skill validate [name] [options]           Validate one skill, or all skills
  skill ref --skill <name|all> --to <dir>   Create lightweight skill references

skill add — install a skill
  Source forms:
    <name>                  Built-in skill name
    group/<name>            Nested name (mirrors install path)
    ./path/to/skill         Local directory
    https://github.com/...  GitHub tree URL to one skill directory
  Options:
    -d, --agents-dir <dir>  Target agents directory (default: ".agents")
        --from <registry>   Fetch from a named registry in .a2scaffoldrc.json
    -f, --force             Overwrite an existing skill of the same name

skill list — show installed skills
  Options:
    -d, --agents-dir <dir>  Agents directory to read (default: ".agents")

skill validate [name] — validate skill frontmatter
  Args:
    name                    Optional skill directory name; omit to validate all
  Options:
    -d, --agents-dir <dir>  Agents directory to read (default: ".agents")

skill ref — create lightweight pointers to skills in another agents dir
  Options:
        --skill <name|all>  Skill name, or "all" to ref every skill (required)
        --from <dir>        Source agents directory (default: ".agents")
        --to <dir>          Destination agents directory (required)
    -f, --force             Overwrite existing skill refs at the destination

Examples:
  npx a2scaffold
  npx a2scaffold init
  npx a2scaffold --use base --name my-project
  npx a2scaffold --use shared/research-setup
  npx a2scaffold skill add my-skill
  npx a2scaffold skill add planning/master-plan
  npx a2scaffold skill add ./my-skill
  npx a2scaffold skill add code-review --from main
  npx a2scaffold skill list
  npx a2scaffold skill validate
  npx a2scaffold skill ref --skill all --from .agents --to .github
`.trim();
