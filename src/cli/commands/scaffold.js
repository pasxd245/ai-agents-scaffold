import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  scaffold,
  ScaffoldRefusal,
  resolveScaffoldConfig,
} from '../../scaffold/index.js';
import { listTemplates } from '../../templates/index.js';
import { loadProjectValues } from '../../config/values.js';
import { DEFAULT_TEMPLATE, SCAFFOLD_TYPE } from '../../constants.js';
import { HELP, pkg } from '../help.js';

/** @param {string[]} argv */
export async function runScaffold(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      use: { type: 'string', short: 'u', default: DEFAULT_TEMPLATE },
      output: { type: 'string', short: 'o', default: '.' },
      name: { type: 'string', short: 'n' },
      list: { type: 'boolean', short: 'l', default: false },
      adopt: { type: 'boolean', default: false },
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
  //
  // They are read from the repository being scaffolded, not from the caller's:
  // `--output ../other-repo` is a statement about `../other-repo`, and taking
  // this repo's harness flags and project name there is never what was meant.
  const projectValues = loadProjectValues(outputDir);
  const fileProjectName = /** @type {{ project?: { name?: string } }} */ (
    projectValues
  ).project?.name;
  const projectName =
    values.name || fileProjectName || path.basename(outputDir);

  // Validate template exists

  /** @type {Record<string, any>} */
  const overrides = structuredClone(projectValues);
  if (!overrides.project || typeof overrides.project !== 'object') {
    overrides.project = {};
  }
  overrides.project.name = projectName;

  // Resolving the view up front lets dry-run and conflict detection evaluate
  // `$if{...}` path segments exactly as the renderer will.
  resolveScaffoldConfig({
    templateName,
    outputDir,
    overrides,
  });

  // `--force` has always adopted stubs as well as replacing canon, and the
  // adopting half is the safe one — narrowing it now would turn an existing
  // `--force` into a *more* destructive command.
  const mayAdopt = Boolean(values.adopt) || Boolean(values.force);
  const mayOverwrite = Boolean(values.force);

  // Dry run: the real plan, rendered to a temp dir and compared file by file,
  // then thrown away. Listing output paths was not a preview — it showed a
  // clean list for a repo the real run then refused to touch.
  if (values['dry-run']) {
    const plan = await scaffold({
      templateName,
      outputDir,
      overrides,
      adopt: mayAdopt,
      force: mayOverwrite,
      dryRun: true,
    });
    console.log(`Dry run — template "${useName}" would generate:\n`);
    console.log(`  Output directory: ${outputDir}`);
    console.log(`  Project name: ${projectName}\n`);
    /** @param {string} heading @param {string[]} files */
    const section = (heading, files) => {
      if (files.length === 0) return;
      console.log(`  ${heading}\n`);
      for (const f of files) console.log(`    - ${f}`);
      console.log('');
    };
    section('Created — new files:', plan.created);
    section('Updated in place, keeping your edits:', plan.preserved);
    section(
      'Adopted — your content kept, the generated block inserted below the title:',
      plan.adopted
    );
    section('Replaced wholesale — edits lost (--force given):', plan.replaced);
    section('Needs --adopt — a stub with no markers:', plan.needsAdopt);
    section(
      'Needs --force — would be replaced wholesale, edits lost:',
      plan.needsForce
    );
    console.log(`  ${plan.unchanged.length} already current.`);
    if (plan.needsAdopt.length > 0 || plan.needsForce.length > 0) {
      console.log(
        '\n  Without the flags above a real run exits 1 and writes nothing.'
      );
    }
    return;
  }

  // No preflight of our own. `scaffold()` builds its whole plan before writing
  // a byte and refuses with the exact files it would have touched, so asking
  // the same question twice could only produce two different answers.

  /** @type {Awaited<ReturnType<typeof scaffold>>} */
  let result;
  try {
    result = await scaffold({
      templateName,
      outputDir,
      overrides,
      adopt: mayAdopt,
      force: mayOverwrite,
    });
  } catch (err) {
    if (!(err instanceof ScaffoldRefusal)) throw err;

    console.error('The following files already exist:\n');
    if (err.needsAdopt.length > 0) {
      console.error('  Adopted — your content is kept, the generated block is');
      console.error('  inserted below the title:\n');
      for (const file of err.needsAdopt) console.error(`    - ${file}`);
      console.error('\n  Use --adopt to proceed.\n');
    }
    if (err.needsForce.length > 0) {
      console.error('  Overwritten — replaced wholesale, edits lost:\n');
      for (const file of err.needsForce) console.error(`    - ${file}`);
      console.error('\n  Use --force to proceed.\n');
    }
    process.exit(1);
  }

  console.log(`\nScaffolded "${useName}" template successfully!\n`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Project name: ${projectName}`);
  if (result.preserved.length > 0) {
    console.log(
      `  Updated in place, keeping your edits: ${result.preserved.join(', ')}`
    );
  }
  if (result.adopted.length > 0) {
    console.log(`  Adopted, your content kept: ${result.adopted.join(', ')}`);
  }
  if (result.replaced.length > 0) {
    console.log(
      `  Replaced wholesale, edits lost: ${result.replaced.join(', ')}`
    );
  }
  console.log('\nNext steps:');
  console.log('  1. Review the generated .agents/AGENTS.md');
  console.log('  2. Add project-specific context to .agents/context/');
  console.log('  3. Start pairing with your AI agent!');
}
