import path from 'node:path';
import { parseArgs } from 'node:util';

import { sync } from '../../scaffold/index.js';
import { resolveTemplatePath } from '../../templates/index.js';
import { loadProjectValues } from '../../config/values.js';
import { DEFAULT_TEMPLATE, SCAFFOLD_TYPE } from '../../constants.js';

/**
 * @param {string} label
 * @param {string[]} files
 */
function report(label, files) {
  if (files.length === 0) return;
  console.log(`  ${label}`);
  for (const file of files) console.log(`    - ${file}`);
  console.log('');
}

/** @param {string[]} argv */
export async function runSync(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      use: { type: 'string', short: 'u', default: DEFAULT_TEMPLATE },
      output: { type: 'string', short: 'o', default: '.' },
      name: { type: 'string', short: 'n' },
      adopt: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
    },
    strict: true,
  });

  const useName = /** @type {string} */ (values.use);
  const templateName = `${SCAFFOLD_TYPE}/${useName}`;
  const outputDir = path.resolve(/** @type {string} */ (values.output));

  // Read from the repository being synced, not the caller's. `sync --output
  // ../other-repo` exists to update *that* repo, so taking this one's harness
  // flags and project name there would render the wrong stubs into it.
  const projectValues = loadProjectValues(outputDir);
  const fileProjectName = /** @type {{ project?: { name?: string } }} */ (
    projectValues
  ).project?.name;
  const projectName =
    values.name || fileProjectName || path.basename(outputDir);

  resolveTemplatePath(templateName);

  /** @type {Record<string, any>} */
  const overrides = structuredClone(projectValues);
  if (!overrides.project || typeof overrides.project !== 'object') {
    overrides.project = {};
  }
  overrides.project.name = projectName;

  const result = await sync({
    templateName,
    outputDir,
    overrides,
    adopt: Boolean(values.adopt),
    dryRun: Boolean(values['dry-run']),
  });

  const verb = values['dry-run'] ? 'Would sync' : 'Synced';
  console.log(`${verb} "${useName}" into ${outputDir}\n`);

  report('Created — new template files:', result.created);
  report('Updated — managed region refreshed:', result.updated);
  report('Adopted — brought under management:', result.adopted);

  if (result.unmanaged.length > 0) {
    report(
      'Not managed — the template owns a block here, this file has none:',
      result.unmanaged
    );
    console.log(
      '    Place the markers by hand, or use --adopt to insert them.\n' +
        '    A stub generated before markers existed already contains a copy\n' +
        '    of the block; --adopt will duplicate it rather than replace it.\n'
    );
  }

  if (result.drifted.length > 0) {
    console.log('  Missing enforcement rules — add these by hand:');
    for (const { file, missing } of result.drifted) {
      console.log(`    - ${file}`);
      for (const rule of missing) console.log(`        ${rule}`);
    }
    console.log(
      '\n    A rule the template requires is absent here, so it is canon the\n' +
        '    harness is no longer protecting. Never overwritten: rules you\n' +
        '    added yourself, and your formatting, are left exactly as they are.\n'
    );
  }

  const touched =
    result.created.length + result.updated.length + result.adopted.length;
  if (
    touched === 0 &&
    result.unmanaged.length === 0 &&
    result.drifted.length === 0
  ) {
    console.log('  Everything up to date.\n');
  }

  console.log(
    `  ${result.unchanged.length} already current, ` + `canon left untouched.`
  );
}
