#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { scaffold } from '../src/scaffold.js';
import { listTemplates, resolveTemplatePath } from '../src/templates.js';
import { checkExistingFiles } from '../src/safety.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const HELP = `
a2scaffold v${pkg.version}

  Scaffold AI agent configuration files in any repository.

Usage:
  a2scaffold [options]

Options:
  -t, --template <name>   Template to use (default: "base")
  -o, --output <dir>      Output directory (default: ".")
  -n, --name <name>       Project name (default: directory name)
  -l, --list              List available templates
  -f, --force             Overwrite existing files
      --dry-run           Preview without writing files
  -h, --help              Show this help
  -v, --version           Show version

Examples:
  npx a2scaffold
  npx a2scaffold --template base --name my-project
  npx a2scaffold -t base -o ./my-repo -n my-repo --force
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

async function run() {
  const { values } = parseArgs({
    options: {
      template: { type: 'string', short: 't', default: 'base' },
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

  const templateName = values.template;
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
  console.log('  1. Review the generated AGENTS.md');
  console.log('  2. Add project-specific context to .agents/context/');
  console.log('  3. Start pairing with your AI agent!');
}

run().catch((err) => { // NOSONAR
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
