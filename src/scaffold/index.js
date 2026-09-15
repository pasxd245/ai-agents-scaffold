import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderDirectory, resolveConfig } from '@nci-gis/js-tmpl';
import { resolveTemplatePath } from '../templates/index.js';
import { TEMPLATE_EXT } from '../constants.js';
import { mergeManagedRegion, adoptManagedRegion } from './managed-region.js';

export { checkExistingFiles, classifyConflicts } from './conflicts.js';
export { sync } from './sync.js';
export { listOutputPaths, resolveOutputPath } from './output-paths.js';
export {
  classifyRegion,
  hasManagedRegion,
  mergeManagedRegion,
  adoptManagedRegion,
  REGION_START,
  REGION_END,
} from './managed-region.js';

/**
 * Deep-merge two objects. Source values override target.
 * Arrays are replaced, not concatenated.
 *
 * @param {Record<string, any>} target
 * @param {Record<string, any>} source
 * @returns {Record<string, any>}
 */
function deepMerge(target, source) {
  /** @type {Record<string, any>} */
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Build the render config for a template without rendering it.
 *
 * Exposed so callers that need to know what a render *would* do — conflict
 * detection, dry-run — can evaluate `$if{...}` path segments against the same
 * view the renderer will use.
 *
 * @param {object} options
 * @param {string} options.templateName
 * @param {string} options.outputDir
 * @param {object} [options.overrides]
 * @returns {{ config: any, view: Record<string, any>, paths: any }}
 */
export function resolveScaffoldConfig({
  templateName,
  outputDir,
  overrides = {},
}) {
  const paths = resolveTemplatePath(templateName);
  const outDir = path.resolve(outputDir);

  // Use the template root as `cwd` for resolveConfig so it doesn't pick up
  // a `js-tmpl.config.*` from the user's project. All paths we pass are
  // absolute, so cwd only affects project-config discovery.
  const config = resolveConfig(
    {
      templateDir: paths.templateDir,
      outDir,
      extname: TEMPLATE_EXT,
      ...(paths.valuesFile ? { valuesFile: paths.valuesFile } : {}),
      ...(paths.valuesDir ? { valuesDir: paths.valuesDir } : {}),
      ...(paths.partialsDir ? { partialsDir: paths.partialsDir } : {}),
    },
    paths.templateRoot
  );

  config.view = deepMerge(config.view, { ...overrides, env: process.env });
  return { config, view: config.view, paths };
}

/**
 * A render stopped because a file needed a permission it was not given.
 *
 * Carries the two lists apart, because they are two different questions to put
 * to a human: "may I keep your file and add a block to it?" and "may I delete
 * what is in this file?". Answering the first should never require answering
 * the second.
 */
export class ScaffoldRefusal extends Error {
  /**
   * @param {string[]} needsAdopt - Marker-less stubs; adoption keeps their content
   * @param {string[]} needsForce - Files a render would replace wholesale
   */
  constructor(needsAdopt, needsForce) {
    const parts = [];
    if (needsAdopt.length > 0) {
      parts.push(
        `${needsAdopt.length} file(s) would be adopted (content kept): ` +
          needsAdopt.join(', ')
      );
    }
    if (needsForce.length > 0) {
      parts.push(
        `${needsForce.length} file(s) would be replaced wholesale: ` +
          needsForce.join(', ')
      );
    }
    super(`Refusing to write. ${parts.join('. ')}`);
    this.name = 'ScaffoldRefusal';
    /** @type {string[]} */
    this.needsAdopt = needsAdopt;
    /** @type {string[]} */
    this.needsForce = needsForce;
  }
}

/**
 * Copy a rendered tree onto the target, preserving managed-region surroundings.
 *
 * This is the last thing standing between a render and someone's file, so it
 * decides for itself what it is allowed to destroy rather than trusting the
 * CLI's preflight. The preflight predicts output paths, and a prediction that
 * drifts from the renderer used to turn straight into silent data loss here —
 * an unguarded `copyFileSync` on a file no conflict list had ever mentioned.
 *
 * Three permissions, deliberately separate:
 *
 * - **Merge** — both sides carry a managed region. Always allowed; only the
 *   fenced block changes and nothing outside it can be lost.
 * - **Adopt** — the template owns a region, the existing file has none. Needs
 *   `adopt`: the author's content survives, but their file is still edited.
 * - **Replace** — everything else, `.agents/` canon included. Needs `force`.
 *
 * Rewriting a file with byte-identical content is none of the three: it
 * destroys nothing, so a re-scaffold that changes nothing needs no permission
 * and never appears in a refusal. A conflict list padded with files that are
 * already correct is how a `--force` prompt gets typed past without reading.
 *
 * The plan is built in full before a single byte is written, so a refusal
 * leaves the target exactly as it was rather than half-updated. That also
 * makes the refusal the authoritative account of what a run would destroy —
 * the CLI reports {@link ScaffoldRefusal}'s lists rather than predicting its
 * own, so there is one answer to the question and not two.
 *
 * @param {string} stagingDir - Freshly rendered tree
 * @param {string} outDir - Destination
 * @param {{ adopt?: boolean, force?: boolean }} [permissions]
 * @returns {{ preserved: string[], adopted: string[] }} output-relative paths
 * @throws {ScaffoldRefusal} when a file needs a permission that was not given
 */
function mergeRenderedTree(stagingDir, outDir, permissions = {}) {
  const { adopt = false, force = false } = permissions;

  /** @type {Array<{ rel: string, content: string | null }>} */
  const plan = [];
  /** @type {string[]} */
  const preserved = [];
  /** @type {string[]} */
  const adopted = [];
  /** @type {string[]} */
  const needsAdopt = [];
  /** @type {string[]} */
  const needsForce = [];

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
    if (!fs.existsSync(dest)) {
      plan.push({ rel, content: null });
      return;
    }

    const existing = fs.readFileSync(dest, 'utf8');
    const incoming = fs.readFileSync(abs, 'utf8');

    const merged = mergeManagedRegion(existing, incoming);
    if (merged !== null) {
      plan.push({ rel, content: merged });
      preserved.push(rel);
      return;
    }

    // Computed either way: with `adopt` it is the gentler outcome, without it
    // it is what tells a refusal which of the two questions to ask. A file
    // whose markers are broken — duplicated, inverted, unclosed — is not
    // adoptable, so it lands under `needsForce`: replacing it is the only
    // thing a run could do, and that needs the destructive permission.
    const wrapped = adoptManagedRegion(existing, incoming);
    if (adopt && wrapped !== null) {
      plan.push({ rel, content: wrapped });
      adopted.push(rel);
      return;
    }

    if (existing === incoming) return;

    // `force` is the stronger permission and means what it says: replace.
    if (force) {
      plan.push({ rel, content: null });
      return;
    }

    (wrapped !== null ? needsAdopt : needsForce).push(rel);
  };

  walk('');

  if (needsAdopt.length > 0 || needsForce.length > 0) {
    throw new ScaffoldRefusal(needsAdopt, needsForce);
  }

  for (const { rel, content } of plan) {
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (content === null) {
      fs.copyFileSync(path.join(stagingDir, rel), dest);
    } else {
      fs.writeFileSync(dest, content);
    }
  }

  return { preserved, adopted };
}

/**
 * Scaffold a template to the output directory.
 *
 * Delegates values loading to js-tmpl's `resolveConfig` so that `values.yaml`,
 * `values/` (value partials), and `partials/` are all optional. Overrides
 * are deep-merged on top of the resolved view.
 *
 * Existing files are never replaced unless `force` says so; see
 * {@link mergeRenderedTree} for the three permissions and why they are apart.
 *
 * @param {object} options
 * @param {string} options.templateName - Template path (e.g. "scaffold/base")
 * @param {string} options.outputDir - Target directory to write files
 * @param {object} [options.overrides] - Values to merge over template defaults
 * @param {boolean} [options.adopt] - Insert the generated block into an
 *   existing file that has no managed region, instead of replacing it.
 * @param {boolean} [options.force] - Replace an existing file wholesale when
 *   neither merge nor adoption applies. Without it, such a file aborts the run.
 * @returns {Promise<{ outputDir: string, template: string, preserved: string[],
 *   adopted: string[] }>}
 */
export async function scaffold({
  templateName,
  outputDir,
  overrides = {},
  adopt = false,
  force = false,
}) {
  const { config } = resolveScaffoldConfig({
    templateName,
    outputDir,
    overrides,
  });
  const outDir = config.outDir;

  // Render to a staging directory first, then merge. Rendering straight into
  // the target would clobber a file before its managed region could be read
  // back, and a failure mid-render would leave the target half-written.
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2scaffold-'));
  try {
    config.outDir = stagingDir;
    await renderDirectory(config);
    const { preserved, adopted } = mergeRenderedTree(stagingDir, outDir, {
      adopt,
      force,
    });
    return { outputDir: outDir, template: templateName, preserved, adopted };
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}
