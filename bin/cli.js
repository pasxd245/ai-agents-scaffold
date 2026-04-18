#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { scaffold } from '../src/scaffold.js';
import { listTemplates, resolveTemplatePath } from '../src/templates.js';
import { checkExistingFiles } from '../src/safety.js';
import {
  validateSkill,
  listSkills,
  installSkill,
  installSkillRef,
} from '../src/skills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const HELP = `
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

/**
 * Walk template directory and list output file paths.
 */
function listOutputFiles(templateDir, extname = '.hbs') {
  const results = [];
  const queue = [''];

  while (queue.length) {
    const rel = queue.shift();
    const abs = path.join(templateDir, rel);
    const stat = fs.statSync(abs);

    if (stat.isDirectory()) {
      const items = fs.readdirSync(abs);
      for (const name of items) {
        queue.push(rel ? path.join(rel, name) : name);
      }
    } else if (abs.endsWith(extname)) {
      results.push(rel.replace(new RegExp(`${extname}$`), ''));
    }
  }

  return results;
}

const VALUE_FLAGS = new Set([
  'u',
  'use',
  'o',
  'output',
  'n',
  'name',
  'd',
  'agents-dir',
]);

/**
 * Check if an argv token is a flag whose value should be skipped.
 */
function isValueFlag(token) {
  if (!token.startsWith('-')) return false;
  if (token.startsWith('--') && token.includes('=')) return false;
  const flag = token.replace(/^-+/, '');
  return VALUE_FLAGS.has(flag);
}

/**
 * Find the index of the first positional (non-flag) argument.
 * Returns -1 if no positional is found.
 */
function findFirstPositional(argv) {
  let skip = false;
  for (let i = 0; i < argv.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (argv[i] === '--') return -1;
    if (argv[i].startsWith('-')) {
      skip = isValueFlag(argv[i]);
      continue;
    }
    return i;
  }
  return -1;
}

/**
 * Detect command from argv. Returns { command, args } where command is
 * 'scaffold' (default) or 'skill', and args is the remaining argv slice.
 */
function detectCommand(argv) {
  const idx = findFirstPositional(argv);
  if (idx === -1) return { command: 'scaffold', args: argv };

  if (argv[idx] === 'skill') {
    return { command: 'skill', args: argv.slice(idx + 1) };
  }
  if (argv[idx] === 'init') {
    return {
      command: 'scaffold',
      args: [...argv.slice(0, idx), ...argv.slice(idx + 1)],
    };
  }
  return { command: 'scaffold', args: argv };
}

async function runScaffold(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      use: { type: 'string', short: 'u', default: 'base' },
      output: { type: 'string', short: 'o', default: '.' },
      name: { type: 'string', short: 'n' },
      list: { type: 'boolean', short: 'l', default: false },
      force: { type: 'boolean', short: 'f', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
    strict: true,
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

  if (values.version) {
    console.log(pkg.version);
    return;
  }

  if (values.list) {
    const templates = listTemplates();
    console.log('Available templates:\n');
    for (const t of templates) {
      console.log(`  - ${t}`);
    }
    return;
  }

  const templateName = values.use;
  const outputDir = path.resolve(values.output);
  const projectName = values.name || path.basename(outputDir);

  // Validate template exists
  const templatePaths = resolveTemplatePath(templateName);

  // Dry-run mode
  if (values['dry-run']) {
    const files = listOutputFiles(templatePaths.templateDir);
    console.log(`Dry run — template "${templateName}" would generate:\n`);
    console.log(`  Output directory: ${outputDir}`);
    console.log(`  Project name: ${projectName}\n`);
    console.log('  Files:');
    for (const file of files) {
      console.log(`    - ${file}`);
    }
    return;
  }

  // Safety check for existing files
  const conflicts = checkExistingFiles(templatePaths.templateDir, outputDir);

  if (conflicts.length > 0 && !values.force) {
    console.error(
      'The following files already exist and would be overwritten:\n'
    );
    for (const file of conflicts) {
      console.error(`  - ${file}`);
    }
    console.error('\nUse --force to overwrite existing files.');
    process.exit(1);
  }

  if (conflicts.length > 0 && values.force) {
    console.warn(
      `Warning: overwriting ${conflicts.length} existing file(s).\n`
    );
  }

  // Run scaffold
  await scaffold({
    templateName,
    outputDir,
    overrides: { project: { name: projectName } },
  });

  console.log(`\nScaffolded "${templateName}" template successfully!\n`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Project name: ${projectName}`);
  console.log('\nNext steps:');
  console.log('  1. Review the generated .agents/AGENTS.md');
  console.log('  2. Add project-specific context to .agents/context/');
  console.log('  3. Start pairing with your AI agent!');
}

function parseSkillArgs(args) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'agents-dir': { type: 'string', short: 'd', default: '.agents' },
      force: { type: 'boolean', short: 'f', default: false },
    },
    allowPositionals: true,
    strict: true,
  });
  return {
    agentsDir: path.resolve(values['agents-dir']),
    force: values.force,
    positionals,
  };
}

function parseSkillRefArgs(args) {
  const { values } = parseArgs({
    args,
    options: {
      skill: { type: 'string' },
      from: { type: 'string', default: '.agents' },
      to: { type: 'string' },
      force: { type: 'boolean', short: 'f', default: false },
    },
    strict: true,
  });

  if (!values.skill) {
    console.error('Error: --skill is required.\n');
    console.error('Usage: a2scaffold skill ref --skill <name|all> --to <dir>');
    process.exit(1);
  }

  if (!values.to) {
    console.error('Error: --to is required.\n');
    console.error('Usage: a2scaffold skill ref --skill <name|all> --to <dir>');
    process.exit(1);
  }

  return {
    skill: values.skill,
    from: values.from,
    to: values.to,
    force: values.force,
  };
}

async function runSkillRef(args) {
  const { skill, from, to, force } = parseSkillRefArgs(args);
  const results = await installSkillRef({ from, to, skill, force });
  for (const result of results) {
    console.log(`Created skill ref "${result.name}" at ${result.path}`);
  }
}

function runSkillAdd(source, agentsDir, force) {
  if (!source) {
    console.error('Error: skill add requires a source argument.\n');
    console.error('Usage: a2scaffold skill add <source>');
    console.error('  source: local path, GitHub shorthand, or GitHub URL');
    process.exit(1);
  }
  const skillsDir = path.join(agentsDir, 'skills');
  const result = installSkill(source, skillsDir, { force });
  console.log(`Installed skill "${result.name}" to ${result.path}`);
}

function runSkillList(agentsDir) {
  const skills = listSkills(agentsDir);
  if (skills.length === 0) {
    console.log('No skills installed.\n');
    console.log('Install one with: a2scaffold skill add <source>');
    return;
  }
  console.log('Installed skills:\n');
  for (const s of skills) {
    console.log(`  ${s.name}`);
    if (s.description) {
      console.log(`    ${s.description}`);
    }
  }
}

function runSkillValidate(targetName, agentsDir) {
  const skillsDir = path.join(agentsDir, 'skills');

  if (!fs.existsSync(skillsDir)) {
    console.log('No skills directory found.');
    return;
  }

  const dirs = targetName
    ? [path.join(skillsDir, targetName)]
    : fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(skillsDir, e.name));

  if (dirs.length === 0) {
    console.log('No skills to validate.');
    return;
  }

  let allValid = true;
  for (const dir of dirs) {
    const name = path.basename(dir);
    const result = validateSkill(dir);
    if (result.valid) {
      console.log(`  ${name} — valid`);
    } else {
      allValid = false;
      console.error(`  ${name} — invalid`);
      for (const err of result.errors) {
        console.error(`    - ${err}`);
      }
    }
  }

  if (!allValid) {
    process.exit(1);
  }
}

async function runSkill(args) {
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    console.log(HELP);
    return;
  }

  // ref has its own arg parser; other subcommands share parseSkillArgs
  if (subcommand === 'ref') {
    await runSkillRef(args.slice(1));
    return;
  }

  const { agentsDir, force, positionals } = parseSkillArgs(args.slice(1));

  switch (subcommand) {
    case 'add':
      runSkillAdd(positionals[0], agentsDir, force);
      return;
    case 'list':
      runSkillList(agentsDir);
      return;
    case 'validate':
      runSkillValidate(positionals[0], agentsDir);
      return;
    default:
      console.error(`Unknown skill command: ${subcommand}`);
      console.error('Available: add, list, ref, validate');
      process.exit(1);
  }
}

async function run() {
  const argv = process.argv.slice(2);

  // Handle top-level --help and --version before command detection
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    return;
  }
  if (argv.includes('--version') || argv.includes('-v')) {
    console.log(pkg.version);
    return;
  }

  const { command, args } = detectCommand(argv);

  if (command === 'skill') {
    await runSkill(args);
  } else {
    await runScaffold(args);
  }
}

run().catch((err) => {
  // NOSONAR
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
