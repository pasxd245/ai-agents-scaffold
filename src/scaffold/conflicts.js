import fs from 'node:fs';
import path from 'node:path';

import { TEMPLATE_EXT } from '../constants.js';
import { listOutputPaths } from './output-paths.js';
import { classifyRegion, hasManagedRegion } from './managed-region.js';

/**
 * Check which output files already exist and would lose content.
 *
 * A file whose render and existing copy both carry a managed region is not
 * a conflict: only the fenced block is replaced.
 *
 * Still a warning ahead of time, not the verdict: a file the render would
 * rewrite byte-identically is reported here too. `scaffold()` refuses with
 * the true lists, so prefer its `dryRun` for deciding what a run would
 * destroy.
 *
 * @param {string} templateDir - Path to template/ directory
 * @param {string} outDir - Target output directory
 * @param {Record<string, any>} view - The resolved view; the plan renders
 *   content, so a path-only partial is an error, not a smaller answer
 * @param {string} [extname] - Template file extension (default `.hbs`)
 * @returns {Promise<string[]>} Output-relative paths that would be overwritten
 */
export async function checkExistingFiles(
  templateDir,
  outDir,
  view,
  extname = TEMPLATE_EXT
) {
  return (await listOutputPaths(templateDir, view, extname))
    .filter(({ outputRel, content }) => {
      const dest = path.join(outDir, outputRel);
      if (!fs.existsSync(dest)) return false;
      const existing = fs.readFileSync(dest, 'utf8');
      return !(hasManagedRegion(content) && hasManagedRegion(existing));
    })
    .map(({ outputRel }) => outputRel);
}

/**
 * Split the conflicts into the two things `--force` would do: adopt a
 * marker-less stub, keeping its content, or replace a file wholesale.
 *
 * @param {string} templateDir - Path to template/ directory
 * @param {string} outDir - Target output directory
 * @param {Record<string, any>} view - The resolved view
 * @param {string} [extname] - Template file extension (default `.hbs`)
 * @returns {Promise<{ adopt: string[], overwrite: string[] }>} output-relative paths
 */
export async function classifyConflicts(templateDir, outDir, view, extname) {
  /** @type {string[]} */
  const adopt = [];
  /** @type {string[]} */
  const overwrite = [];

  const planned = await listOutputPaths(templateDir, view, extname);
  const rendered = new Map(planned.map((p) => [p.outputRel, p.content]));

  for (const outputRel of await checkExistingFiles(
    templateDir,
    outDir,
    view,
    extname
  )) {
    const content = rendered.get(outputRel);
    if (content === undefined) {
      overwrite.push(outputRel);
      continue;
    }
    // Valid regions were already excluded; what is left is marker-less
    // (adoptable if the render owns a region) or broken (replace only).
    const existing = fs.readFileSync(path.join(outDir, outputRel), 'utf8');
    const adoptable =
      hasManagedRegion(content) && classifyRegion(existing).kind === 'none';
    (adoptable ? adopt : overwrite).push(outputRel);
  }

  return { adopt, overwrite };
}
