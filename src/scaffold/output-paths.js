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
 * directory silently misses every conditional file, and predicting *fewer*
 * files than the render writes is not a cosmetic bug: a file absent from the
 * conflict list is one `mergeRenderedTree` will overwrite without `--force`.
 *
 * So this is a deliberate mirror of js-tmpl's `pathSegment` / `pathFormula` /
 * `pathRenderer` trio, not an approximation of it. It would be better to call
 * those directly, but js-tmpl's `exports` map publishes only `resolveConfig`
 * and `renderDirectory`, so a deep import is not available. Until it exports
 * them, `tests/output-paths.test.js` pins every rule below against what the
 * installed renderer actually does; that test is what keeps the mirror honest.
 *
 * The rules, all of them js-tmpl's:
 * - `$if{var}` / `$ifn{var}` must be a *whole* directory segment.
 * - A formula in filename position is an error.
 * - A segment merely *containing* `$if{` / `$ifn{` is malformed — an error.
 * - A formula naming a variable absent from the view is an error.
 * - Present-but-falsy prunes the subtree; `$ifn` inverts.
 * - `${var}` interpolates anywhere, and a missing value renders empty.
 */

const FORMULA_WHOLE = /^\$(if|ifn)\{([^}]+)\}$/;
const FORMULA_SUBSTR = /\$ifn?\{/;
const INTERPOLATION = /\$\{([^}]+)\}/g;

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
      (acc, key) => (acc === null || acc === undefined ? undefined : acc[key]),
      /** @type {any} */ (view)
    );
}

/**
 * Whether a dotted path is present in the view as an own property.
 *
 * Distinct from {@link lookup}, which cannot tell "absent" from "present and
 * undefined". js-tmpl throws on the first and prunes on the second, so the
 * distinction decides whether a render fails or silently drops a file.
 *
 * @param {Record<string, any>} view
 * @param {string} dotted
 * @returns {boolean}
 */
function has(view, dotted) {
  const parts = dotted.split('.');
  /** @type {any} */
  let cur = view;
  for (const part of parts.slice(0, -1)) {
    if (cur === null || cur === undefined || typeof cur !== 'object') {
      return false;
    }
    cur = cur[part];
  }
  if (cur === null || cur === undefined || typeof cur !== 'object') {
    return false;
  }
  return Object.hasOwn(cur, parts[parts.length - 1]);
}

/**
 * Resolve one template-relative path to its output-relative path.
 *
 * `rel` is the path as it sits on disk, extension included — the same string
 * js-tmpl's walker hands to its renderer. Strip the extension from the
 * *result*, not the input: `$if{x}.hbs` is a malformed filename segment, and
 * stripping first would hide that.
 *
 * @param {string} rel - Path relative to `template/`, still carrying markers
 * @param {Record<string, any>} view
 * @returns {string | null} output-relative path, or null if a condition excludes it
 * @throws {Error} on a malformed segment, a formula in filename position, or a
 *   formula naming a variable the view does not define — each one an error the
 *   renderer would raise too
 */
export function resolveOutputPath(rel, view) {
  const segments = rel.split(path.sep);
  const last = segments.length - 1;
  /** @type {string[]} */
  const out = [];

  for (const [index, segment] of segments.entries()) {
    const formula = FORMULA_WHOLE.exec(segment);
    if (formula) {
      if (index === last) {
        throw new Error(
          `Path formula '${segment}' is not allowed in a filename ` +
            `(directories only) — in '${rel}'`
        );
      }
      const expr = formula[2].trim();
      if (!has(view, expr)) {
        throw new Error(
          `Path formula '${segment}' in '${rel}' references undefined view ` +
            `variable '${expr}'`
        );
      }
      const truthy = Boolean(lookup(view, expr));
      // A pruned subtree contributes no output file at all.
      if (formula[1] === 'if' ? !truthy : truthy) return null;
      // Satisfied: the segment itself contributes nothing to the output path.
      continue;
    }

    if (FORMULA_SUBSTR.test(segment)) {
      throw new Error(
        `formulas must be whole segments in directory positions, one per ` +
          `segment: got '${segment}' (in '${rel}')`
      );
    }

    out.push(
      segment.replace(INTERPOLATION, (_, expr) => {
        const value = lookup(view, String(expr).trim());
        return value === undefined || value === null ? '' : String(value);
      })
    );
  }

  return path.join(...out);
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

    if (!view) {
      results.push({
        templateRel: rel,
        outputRel: rel.slice(0, -extname.length),
      });
      continue;
    }

    const rendered = resolveOutputPath(rel, view);
    if (rendered !== null) {
      results.push({
        templateRel: rel,
        outputRel: rendered.slice(0, -extname.length),
      });
    }
  }

  results.sort((a, b) => a.outputRel.localeCompare(b.outputRel));
  return results;
}
