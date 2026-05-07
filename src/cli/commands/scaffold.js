import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { scaffold, checkExistingFiles } from '../../scaffold/index.js';
import { listTemplates, resolveTemplatePath } from '../../templates/index.js';
import { loadProjectValues } from '../../config/values.js';
import {
  DEFAULT_TEMPLATE,
  SCAFFOLD_TYPE,
  TEMPLATE_EXT,
} from '../../constants.js';
import { HELP, pkg } from '../help.js';

/**
 * Walk template directory and list output file paths.
 *
 * @param {string} templateDir
 * @param {string} [extname]
 * @returns {string[]}
 */
function listOutputFiles(templateDir, extname = TEMPLATE_EXT) {
  /** @type {string[]} */
  const results = [];
  /** @type {string[]} */
  const queue = [''];

  while (queue.length) {
    const rel = /** @type {string} */ (queue.shift());
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

/** @param {string[]} argv */
export async function runScaffold(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      use: { type: 'string', short: 'u', default: DEFAULT_TEMPLATE },
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

  const useName = /** @type {string} */ (values.use);
  const templateName = `${SCAFFOLD_TYPE}/${useName}`;
  const outputDir = path.resolve(/** @type {string} */ (values.output));

  // Project-local values (.a2scaffold/values.{json,yaml,yml}) layer over
  // template defaults; explicit CLI flags layer over project values.
  const projectValues = loadProjectValues(process.cwd());
  const fileProjectName = /** @type {{ project?: { name?: string } }} */ (
    projectValues
  ).project?.name;
  const projectName =
    values.name || fileProjectName || path.basename(outputDir);

  // Validate template exists
  const templatePaths = resolveTemplatePath(templateName);

  // Dry-run mode
  if (values['dry-run']) {
    const files = listOutputFiles(templatePaths.templateDir);
    console.log(`Dry run — template "${useName}" would generate:\n`);
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

  /** @type {Record<string, any>} */
  const overrides = structuredClone(projectValues);
  if (!overrides.project || typeof overrides.project !== 'object') {
    overrides.project = {};
  }
  overrides.project.name = projectName;

  await scaffold({
    templateName,
    outputDir,
    overrides,
  });

  console.log(`\nScaffolded "${useName}" template successfully!\n`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Project name: ${projectName}`);
  console.log('\nNext steps:');
  console.log('  1. Review the generated .agents/AGENTS.md');
  console.log('  2. Add project-specific context to .agents/context/');
  console.log('  3. Start pairing with your AI agent!');
}
