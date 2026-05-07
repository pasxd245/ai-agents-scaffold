import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { RC_FILENAME } from '../constants.js';

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
 * Read and parse a JSON config file. Returns null if absent.
 *
 * @param {string} file
 * @returns {A2ScaffoldRc | null}
 */
function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${file}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
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
 * Load `.a2scaffoldrc.json` from the user home and the project (cwd),
 * shallow-merged. Project entries override user entries.
 *
 * @param {string} [cwd]
 * @returns {A2ScaffoldRc}
 */
export function loadRc(cwd = process.cwd()) {
  const userRc = readJsonIfExists(path.join(os.homedir(), RC_FILENAME));
  const projectRc = readJsonIfExists(path.join(cwd, RC_FILENAME));
  return mergeRc(userRc, projectRc);
}
