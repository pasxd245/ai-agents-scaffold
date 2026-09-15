import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderDirectory } from '@nci-gis/js-tmpl';

import { ENFORCEMENT_FILES } from '../constants.js';
import { missingEnforcement } from './enforcement.js';
import { resolveScaffoldConfig } from './index.js';
import {
  classifyRegion,
  hasManagedRegion,
  mergeManagedRegion,
  adoptManagedRegion,
} from './managed-region.js';

/**
 * Bring the generated surface up to date without destroying anything.
 *
 * Two kinds of generated file:
 *
 * - **Managed** — the template owns a fenced region (the harness stubs). Only
 *   the region is replaced.
 * - **Seeded** — written once, then the human's (all of `.agents/`). Created
 *   when absent, never touched when present.
 *
 * The contract: sync writes only inside one unambiguous managed region and
 * never overwrites a seeded file that exists. Where it cannot establish both,
 * it touches nothing and reports the file. Hence no `--force` and no conflict
 * list.
 *
 * @param {object} options
 * @param {string} options.templateName
 * @param {string} options.outputDir
 * @param {object} [options.overrides]
 * @param {boolean} [options.adopt] - Bring an unmanaged stub under management
 *   by inserting the region. Off by default: a stub generated before markers
 *   existed already contains the block, and adoption would duplicate it.
 * @param {boolean} [options.dryRun] - Report without writing.
 * @returns {Promise<{ created: string[], updated: string[], unchanged: string[],
 *   adopted: string[], unmanaged: string[],
 *   ambiguous: Array<{ file: string, reason: string }>,
 *   drifted: Array<{ file: string, missing: string[] }> }>}
 */
export async function sync({
  templateName,
  outputDir,
  overrides = {},
  adopt = false,
  dryRun = false,
}) {
  const { config } = resolveScaffoldConfig({
    templateName,
    outputDir,
    overrides,
  });
  const outDir = config.outDir;

  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2scaffold-sync-'));
  try {
    config.outDir = stagingDir;
    await renderDirectory(config);

    /** @type {Record<string, any[]>} */
    const result = {
      created: [],
      updated: [],
      unchanged: [],
      adopted: [],
      unmanaged: [],
      ambiguous: [],
      drifted: [],
    };

    /** @param {string} rel */
    const walk = (rel) => {
      const abs = path.join(stagingDir, rel);
      if (fs.statSync(abs).isDirectory()) {
        for (const name of fs.readdirSync(abs)) {
          walk(rel ? path.join(rel, name) : name);
        }
        return;
      }

      const dest = path.join(outDir, rel);
      const incoming = fs.readFileSync(abs, 'utf8');

      // Absent: creating a file cannot destroy one.
      if (!fs.existsSync(dest)) {
        if (!dryRun) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, incoming);
        }
        result.created.push(rel);
        return;
      }

      const existing = fs.readFileSync(dest, 'utf8');

      if (hasManagedRegion(incoming)) {
        const merged = mergeManagedRegion(existing, incoming);
        if (merged !== null) {
          if (merged === existing) {
            result.unchanged.push(rel);
          } else {
            if (!dryRun) fs.writeFileSync(dest, merged);
            result.updated.push(rel);
          }
          return;
        }

        // Template owns a region, file has no valid one: adoptable only if
        // marker-less; broken markers are reported for repair.
        const state = classifyRegion(existing);
        if (state.kind === 'ambiguous') {
          result.ambiguous.push({ file: rel, reason: state.reason });
          return;
        }
        if (adopt) {
          const wrapped = adoptManagedRegion(existing, incoming);
          if (wrapped !== null) {
            if (!dryRun) fs.writeFileSync(dest, wrapped);
            result.adopted.push(rel);
            return;
          }
        }
        result.unmanaged.push(rel);
        return;
      }

      // Enforcement files are seeded, but a missing rule is a protection gap,
      // so it is reported (never overwritten); see `enforcement.js`.
      const posix = rel.split(path.sep).join('/');
      if (ENFORCEMENT_FILES.includes(posix)) {
        const missing = missingEnforcement(posix, existing, incoming);
        if (missing.length > 0) result.drifted.push({ file: rel, missing });
        return;
      }

      // Seeded and present: the human's. Silent on purpose; reporting every
      // divergence would train people to ignore the output.
    };

    walk('');
    return /** @type {any} */ (result);
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}
