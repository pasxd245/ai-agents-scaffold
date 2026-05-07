import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import YAML from 'js-yaml';

import { A2SCAFFOLD_DIRNAME, CONFIG_EXTS, RC_BASENAME } from '../constants.js';

/**
 * @typedef {object} RegistryConfig
 * @property {string} url - GitHub shorthand (`github:owner/repo`) or URL
 * @property {string} [path] - Sub-path within the repo where skills live
 * @property {string} [ref] - Git ref (branch, tag, or SHA)
 */

/**
 * @typedef {object} A2ScaffoldRc
 * @property {Record<string, RegistryConfig>} [registries]
 */

/**
 * Read and parse a JSON or YAML file based on its extension.
 *
 * @param {string} file
 * @returns {A2ScaffoldRc | null}
 */
function readConfigFile(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  try {
    if (/\.ya?ml$/i.test(file)) {
      return /** @type {A2ScaffoldRc} */ (YAML.load(raw) || {});
    }
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid config in ${file}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}

/**
 * Find the user-level rc at `~/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}`.
 * The flat `~/.a2scaffoldrc.*` form is intentionally not supported at the
 * user level to keep the home directory tidy.
 *
 * @param {string} home
 * @returns {string | null}
 */
function findUserRc(home) {
  const candidates = CONFIG_EXTS.map((ext) =>
    path.join(home, A2SCAFFOLD_DIRNAME, `${RC_BASENAME}${ext}`)
  );
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/**
 * Find the project-level rc. Accepts either
 * `<cwd>/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` or the flat form
 * `<cwd>/.a2scaffoldrc.{json,yaml,yml}` — pick one. Errors if both exist.
 *
 * @param {string} cwd
 * @returns {string | null}
 */
function findProjectRc(cwd) {
  const dirForm = CONFIG_EXTS.map((ext) =>
    path.join(cwd, A2SCAFFOLD_DIRNAME, `${RC_BASENAME}${ext}`)
  );
  const flatForm = CONFIG_EXTS.map((ext) =>
    path.join(cwd, `${RC_BASENAME}${ext}`)
  );

  const dirHit = dirForm.find((p) => fs.existsSync(p));
  const flatHit = flatForm.find((p) => fs.existsSync(p));

  if (dirHit && flatHit) {
    throw new Error(
      `Conflicting a2scaffold config files at "${cwd}":\n` +
        `  - ${dirHit}\n` +
        `  - ${flatHit}\n` +
        'Keep only one.'
    );
  }
  return dirHit ?? flatHit ?? null;
}

/**
 * Shallow merge of two rc objects. Project rc wins for top-level keys;
 * `registries` are merged by name with project entries overriding user.
 *
 * @param {A2ScaffoldRc | null} userRc
 * @param {A2ScaffoldRc | null} projectRc
 * @returns {A2ScaffoldRc}
 */
function mergeRc(userRc, projectRc) {
  /** @type {A2ScaffoldRc} */
  const out = {};
  /** @type {Record<string, RegistryConfig> | undefined} */
  let registries;
  if (userRc?.registries) registries = { ...userRc.registries };
  if (projectRc?.registries) {
    if (registries) {
      Object.assign(registries, projectRc.registries);
    } else {
      registries = { ...projectRc.registries };
    }
  }
  if (registries) out.registries = registries;
  return out;
}

/**
 * Load a2scaffold rc from the user home and the project (cwd), shallow-merged.
 * Project entries override user entries.
 *
 * - User level: `~/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` only.
 * - Project level: `<cwd>/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` or the
 *   flat `<cwd>/.a2scaffoldrc.{json,yaml,yml}` — pick one (error if both).
 *
 * @param {string} [cwd]
 * @returns {A2ScaffoldRc}
 */
export function loadRc(cwd = process.cwd()) {
  const userPath = findUserRc(os.homedir());
  const projectPath = findProjectRc(cwd);
  const userRc = userPath ? readConfigFile(userPath) : null;
  const projectRc = projectPath ? readConfigFile(projectPath) : null;
  return mergeRc(userRc, projectRc);
}
