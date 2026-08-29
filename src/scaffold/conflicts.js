import fs from 'node:fs';
import path from 'node:path';

import { TEMPLATE_EXT } from '../constants.js';
import { listOutputPaths } from './output-paths.js';
import { hasManagedRegion } from './managed-region.js';

/**
 * Check which output files already exist and would lose content.
 *
 * A file whose template and existing copy both carry a managed region is not
 * a conflict: the render replaces only the fenced block and leaves the
 * author's surrounding edits alone.
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
