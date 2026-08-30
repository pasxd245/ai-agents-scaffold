import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  scaffold,
  ScaffoldRefusal,
  listOutputPaths,
  resolveScaffoldConfig,
} from '../../scaffold/index.js';
import { listTemplates, resolveTemplatePath } from '../../templates/index.js';
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
  const templatePaths = resolveTemplatePath(templateName);

  /** @type {Record<string, any>} */
  const overrides = structuredClone(projectValues);
  if (!overrides.project || typeof overrides.project !== 'object') {
    overrides.project = {};
  }
  overrides.project.name = projectName;

  // Resolving the view up front lets dry-run and conflict detection evaluate
  // `$if{...}` path segments exactly as the renderer will.
  const { view } = resolveScaffoldConfig({
    templateName,
    outputDir,
    overrides,
  });

  // Dry-run mode
  if (values['dry-run']) {
    const files = listOutputPaths(templatePaths.templateDir, view);
    console.log(`Dry run — template "${useName}" would generate:\n`);
    console.log(`  Output directory: ${outputDir}`);
    console.log(`  Project name: ${projectName}\n`);
    console.log('  Files:');
    for (const { outputRel } of files) {
      console.log(`    - ${outputRel}`);
    }
    return;
  }

  // No preflight of our own. `scaffold()` builds its whole plan before writing
  // a byte and refuses with the exact files it would have touched, so asking
  // the same question twice could only produce two different answers — and the
  // preflight's would be the wrong one. It compares the *unrendered* template
  // against the target, so it called every already-correct file a conflict:
  // 23 names under "edits lost" when one had changed, which is how a --force
  // prompt gets typed past without being read.
  //
  // `--force` has always adopted stubs as well as replacing canon, and the
  // adopting half is the safe one — narrowing it now would turn an existing
  // `--force` into a *more* destructive command.
  const mayAdopt = Boolean(values.adopt) || Boolean(values.force);
  const mayOverwrite = Boolean(values.force);

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
  console.log('\nNext steps:');
  console.log('  1. Review the generated .agents/AGENTS.md');
  console.log('  2. Add project-specific context to .agents/context/');
  console.log('  3. Start pairing with your AI agent!');
}
