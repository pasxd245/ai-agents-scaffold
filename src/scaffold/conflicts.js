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
 * **This is a prediction, not the verdict.** It compares the *unrendered*
 * template against the target, so it cannot tell a file that would change from
 * one the render would rewrite byte-identically, and it reports both. Only
 * `scaffold()` knows the difference, and it refuses with the true list — which
 * is why the CLI reports that refusal rather than calling this first. Use this
 * to warn ahead of time; do not use it to decide what a run will destroy.
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
 * Split the conflicts into the two things `--force` would actually do.
 *
 * "Would be overwritten" stopped being true for every conflict once `--force`
 * learned to adopt a stub: a hand-written `AGENTS.md` keeps its content and
 * gains a managed region, while `.agents/` canon is still replaced wholesale.
 * Those are different enough that a user deciding whether to type `--force`
 * needs them apart.
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
    // The existing file has no region — checkExistingFiles already excluded
    // any file that does — so the template having one is the whole test.
    (hasManagedRegion(template) ? adopt : overwrite).push(outputRel);
  }

  return { adopt, overwrite };
}
