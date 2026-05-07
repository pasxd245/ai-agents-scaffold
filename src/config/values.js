import fs from 'node:fs';
import path from 'node:path';

import YAML from 'js-yaml';

import {
  A2SCAFFOLD_DIRNAME,
  CONFIG_EXTS,
  VALUES_BASENAME,
} from '../constants.js';

/**
 * Locate a project values file under `<cwd>/.a2scaffold/values.{json,yaml,yml}`.
 * Errors if more than one such file exists — pick one.
 *
 * @param {string} cwd
 * @returns {string | null}
 */
function findProjectValuesFile(cwd) {
  const candidates = CONFIG_EXTS.map((ext) =>
    path.join(cwd, A2SCAFFOLD_DIRNAME, `${VALUES_BASENAME}${ext}`)
  );
  const hits = candidates.filter((p) => fs.existsSync(p));
  if (hits.length > 1) {
    throw new Error(
      `Multiple a2scaffold values files in "${path.join(cwd, A2SCAFFOLD_DIRNAME)}":\n` +
        hits.map((h) => `  - ${h}`).join('\n') +
        '\nKeep only one.'
    );
  }
  return hits[0] ?? null;
}

/**
 * Load project-level scaffold values from
 * `<cwd>/.a2scaffold/values.{json,yaml,yml}`. Returns `{}` if no file exists.
 * The result is intended to be deep-merged over template defaults and under
 * any explicit CLI overrides.
 *
 * @param {string} [cwd]
 * @returns {Record<string, unknown>}
 */
export function loadProjectValues(cwd = process.cwd()) {
  const file = findProjectValuesFile(cwd);
  if (!file) return {};
  const raw = fs.readFileSync(file, 'utf8');
  try {
    if (/\.ya?ml$/i.test(file)) {
      return /** @type {Record<string, unknown>} */ (YAML.load(raw) || {});
    }
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid values in ${file}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}
