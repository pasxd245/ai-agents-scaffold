import fs from 'node:fs';
import path from 'node:path';

import { TEMPLATE_EXT } from '../constants.js';
import { listOutputPaths } from './output-paths.js';
import { classifyRegion, hasManagedRegion } from './managed-region.js';

/**
 * Check which output files already exist and would lose content.
 *
 * A file whose template and existing copy both carry a managed region is not
 * a conflict: only the fenced block is replaced.
 *
 * This is a prediction, not the verdict. It compares the *unrendered*
 * template against the target, so it also reports files the render would
 * rewrite byte-identically. `scaffold()` refuses with the true list; use this
 * to warn ahead of time.
 *
 * @param {string} templateDir - Path to template/ directory
 * @param {string} outDir - Target output directory
 * @param {Record<string, any>} [view] - Resolved values. Without it, `$if{...}`
 *   segments cannot be evaluated and conditional files are missed entirely.
 * @param {string} [extname] - Template file extension (default `.hbs`)
 * @returns {string[]} Output-relative paths that would be overwritten
 */
export function checkExistingFiles(
  templateDir,
  outDir,
  view,
  extname = TEMPLATE_EXT
) {
  return listOutputPaths(templateDir, view, extname)
    .filter(({ templateRel, outputRel }) => {
      const dest = path.join(outDir, outputRel);
      if (!fs.existsSync(dest)) return false;

      const template = fs.readFileSync(
        path.join(templateDir, templateRel),
        'utf8'
      );
      const existing = fs.readFileSync(dest, 'utf8');
      return !(hasManagedRegion(template) && hasManagedRegion(existing));
    })
    .map(({ outputRel }) => outputRel);
}

/**
 * Split the conflicts into the two things `--force` would do: adopt a
 * marker-less stub, keeping its content, or replace a file wholesale.
 *
 * @param {string} templateDir - Path to template/ directory
 * @param {string} outDir - Target output directory
 * @param {Record<string, any>} [view] - Resolved values
 * @param {string} [extname] - Template file extension (default `.hbs`)
 * @returns {{ adopt: string[], overwrite: string[] }} output-relative paths
 */
export function classifyConflicts(templateDir, outDir, view, extname) {
  /** @type {string[]} */
  const adopt = [];
  /** @type {string[]} */
  const overwrite = [];

  for (const outputRel of checkExistingFiles(
    templateDir,
    outDir,
    view,
    extname
  )) {
    const templateRel = listOutputPaths(templateDir, view, extname).find(
      (p) => p.outputRel === outputRel
    )?.templateRel;
    if (!templateRel) {
      overwrite.push(outputRel);
      continue;
    }
    const template = fs.readFileSync(
      path.join(templateDir, templateRel),
      'utf8'
    );
    // Valid regions were already excluded; what is left is marker-less
    // (adoptable if the template owns a region) or broken (replace only).
    const existing = fs.readFileSync(path.join(outDir, outputRel), 'utf8');
    const adoptable =
      hasManagedRegion(template) && classifyRegion(existing).kind === 'none';
    (adoptable ? adopt : overwrite).push(outputRel);
  }

  return { adopt, overwrite };
}
