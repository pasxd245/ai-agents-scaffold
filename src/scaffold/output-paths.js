import fs from 'node:fs';
import path from 'node:path';
import { planRender } from '@nci-gis/js-tmpl';

import { PARTIALS_DIRNAME, TEMPLATE_EXT } from '../constants.js';

/**
 * What a render will write, straight from js-tmpl's `planRender`.
 *
 * This file used to mirror js-tmpl's path rules — `$if{}` guards, `${}`
 * interpolation, the malformed-segment cases — because 0.1.x exported only
 * `resolveConfig` and `renderDirectory`. A pinned test kept the mirror
 * honest, and on 0.2.0 the mirror was wrong for the engine it mirrored. Now
 * the engine answers the question itself, and nothing here needs keeping
 * honest.
 *
 * The plan carries rendered content, so the view has to be the full resolved
 * one — a path-only partial cannot render a body. Targets come back
 * `/`-separated on every OS and are converted to native paths here, once.
 *
 * @param {string} templateDir - Path to the template's `template/` directory
 * @param {Record<string, any>} view - The resolved view, as
 *   `resolveScaffoldConfig()` returns it
 * @param {string} [extname]
 * @returns {Promise<Array<{ templateRel: string, outputRel: string, content: string }>>}
 *   sorted by `outputRel`
 * @throws {import('@nci-gis/js-tmpl').JsTmplError} what the render would
 *   throw: a guard or path variable the view does not define, a malformed
 *   segment, a collision, a missing template value — all of them collected
 *   into one error when there are several
 */
export async function listOutputPaths(
  templateDir,
  view,
  extname = TEMPLATE_EXT
) {
  if (!view || typeof view !== 'object') {
    throw new TypeError(
      'listOutputPaths needs the resolved view — pass what ' +
        'resolveScaffoldConfig() returns; a plan renders content, so a ' +
        'path-only partial cannot work'
    );
  }
  // Templates keep their partials beside `template/`, not inside it.
  const partialsDir = path.join(path.dirname(templateDir), PARTIALS_DIRNAME);
  const plan = await planRender({
    templateDir,
    partialsDir: fs.existsSync(partialsDir) ? partialsDir : '',
    outDir: '.',
    extname,
    view,
  });
  return plan.map((entry) => ({
    templateRel: toNative(entry.relPath),
    outputRel: toNative(entry.target),
    content: entry.content,
  }));
}

/**
 * js-tmpl reports paths with `/` on every OS; callers here compare against
 * `path.join` results.
 *
 * @param {string} posix
 * @returns {string}
 */
export function toNative(posix) {
  return posix.split('/').join(path.sep);
}
