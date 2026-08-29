import fs from 'node:fs';
import path from 'node:path';

import { TEMPLATE_EXT } from '../constants.js';

/**
 * Template path resolution.
 *
 * A template directory encodes conditionals and interpolations in its path
 * segments: `$if{agents.claude}/CLAUDE.md.hbs` renders to `CLAUDE.md` when
 * `agents.claude` is truthy, and to nothing when it is not.
 *
 * Anything that needs to know what a render *will* produce — conflict
 * detection, dry-run, the managed-region merge — has to evaluate those the
 * same way the renderer does. Comparing raw template paths against the output
 * directory silently misses every conditional file.
 */

const IF_SEGMENT = /^\$if\{([^}]*)\}$/;
const INTERPOLATION = /\$\{([^}]*)\}/g;

/**
 * Read a dotted path out of the view.
 *
 * @param {Record<string, any>} view
 * @param {string} dotted - e.g. `agents.claude`
 * @returns {unknown}
 */
function lookup(view, dotted) {
  return dotted
    .split('.')
    .reduce(
      (acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined),
      /** @type {any} */ (view)
    );
}

/**
 * Resolve one template-relative path to its output-relative path.
 *
 * @param {string} rel - Path relative to `template/`, still carrying markers
 * @param {Record<string, any>} view
 * @returns {string | null} output-relative path, or null if a condition excludes it
 */
export function resolveOutputPath(rel, view) {
  /** @type {string[]} */
  const out = [];

  for (const segment of rel.split(path.sep)) {
    const conditional = segment.match(IF_SEGMENT);
    if (conditional) {
      // Falsy condition: the whole subtree is skipped, matching the renderer.
      if (!lookup(view, conditional[1].trim())) return null;
      // Truthy: the segment itself contributes nothing to the output path.
      continue;
    }
    out.push(
      segment.replace(INTERPOLATION, (_, expr) => {
        const value = lookup(view, String(expr).trim());
        return value === undefined || value === null ? '' : String(value);
      })
    );
  }

  return out.join(path.sep);
}

/**
 * List every file a render of this template would produce.
 *
 * @param {string} templateDir - Path to the template's `template/` directory
 * @param {Record<string, any>} [view] - Resolved values; conditionals are kept
 *   unevaluated when omitted, which preserves the raw-path behaviour
 * @param {string} [extname]
 * @returns {Array<{ templateRel: string, outputRel: string }>}
 */
export function listOutputPaths(templateDir, view, extname = TEMPLATE_EXT) {
  /** @type {Array<{ templateRel: string, outputRel: string }>} */
  const results = [];
  /** @type {string[]} */
  const queue = [''];

  while (queue.length) {
    const rel = /** @type {string} */ (queue.shift());
    const abs = path.join(templateDir, rel);

    if (fs.statSync(abs).isDirectory()) {
      for (const name of fs.readdirSync(abs)) {
        queue.push(rel ? path.join(rel, name) : name);
      }
      continue;
    }

    if (!abs.endsWith(extname)) continue;

    const stripped = rel.slice(0, -extname.length);
    const outputRel = view ? resolveOutputPath(stripped, view) : stripped;
    if (outputRel !== null) {
      results.push({ templateRel: rel, outputRel });
    }
  }

  results.sort((a, b) => a.outputRel.localeCompare(b.outputRel));
  return results;
}
