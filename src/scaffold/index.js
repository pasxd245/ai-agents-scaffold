import fs from 'node:fs';
import path from 'node:path';
import { planRender, resolveConfig } from '@nci-gis/js-tmpl';
import { resolveTemplatePath } from '../templates/index.js';
import { TEMPLATE_EXT } from '../constants.js';
import { assertNoRetiredKeys } from '../config/retired-keys.js';
import { mergeManagedRegion, adoptManagedRegion } from './managed-region.js';
import { toNative } from './output-paths.js';

export { checkExistingFiles, classifyConflicts } from './conflicts.js';
export { sync } from './sync.js';
export { listOutputPaths } from './output-paths.js';
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
  // Every entry point — scaffold, sync, dry-run, the API — passes through
  // here, so this is the one place an old key is guaranteed to be caught.
  assertNoRetiredKeys(overrides);

  const paths = resolveTemplatePath(templateName);
  const outDir = path.resolve(outputDir);

  // Since js-tmpl 0.2.0 nothing is discovered from `cwd` — a config file is
  // read only when named — and every path passed here is absolute, so the
  // second argument is inert. The template root is passed for the message a
  // relative path would produce if one ever slipped in.
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

  // Values and CLI overrides only. The whole process environment used to be
  // merged in as `env`, so any template — including one passed with `--use` —
  // could render a token into a file the user then commits. Nothing shipped
  // here ever read it. A template that needs an environment value asks for it
  // through `values.yaml`, where the key is visible.
  config.view = deepMerge(config.view, overrides);
  return { config, view: config.view, paths };
}

/**
 * A render stopped because a file needed a permission it was not given.
 *
 * The two lists are kept apart because they are two different questions to
 * put to a human: "may I add a block to your file?" and "may I delete what is
 * in it?".
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
 * Write a render plan onto the target, preserving managed-region surroundings.
 *
 * This is the last thing between a render and someone's file, so it decides
 * for itself what it may destroy rather than trusting a preflight. Three
 * permissions, deliberately separate:
 *
 * - **Merge** — both sides carry a managed region. Always allowed.
 * - **Adopt** — the template owns a region, the existing file has none.
 *   Needs `adopt`.
 * - **Replace** — everything else, `.agents/` canon included. Needs `force`.
 *
 * A byte-identical rewrite needs no permission and never appears in a
 * refusal. The whole plan is built before anything is written, so a refusal
 * leaves the target exactly as it was, and its lists are the authoritative
 * account of what a run would touch.
 *
 * With `dryRun`, the same plan is built and reported but nothing is written
 * and nothing throws: the caller gets every list, including the two refusal
 * lists, so a preview shows the split the real run would stop on.
 *
 * @param {Array<{ target: string, content: string }>} entries - js-tmpl's
 *   plan: what a render would write, `/`-separated targets
 * @param {string} outDir - Destination
 * @param {{ adopt?: boolean, force?: boolean, dryRun?: boolean }} [permissions]
 * @returns {MergeReport} output-relative paths
 * @throws {ScaffoldRefusal} when a file needs a permission that was not given
 */
function mergeRenderedTree(entries, outDir, permissions = {}) {
  const { adopt = false, force = false, dryRun = false } = permissions;

  /** @type {Array<{ rel: string, content: string }>} */
  const plan = [];
  /** @type {string[]} */
  const created = [];
  /** @type {string[]} */
  const preserved = [];
  /** @type {string[]} */
  const adopted = [];
  /** @type {string[]} */
  const replaced = [];
  /** @type {string[]} */
  const unchanged = [];
  /** @type {string[]} */
  const needsAdopt = [];
  /** @type {string[]} */
  const needsForce = [];

  /**
   * @param {string} rel - Output-relative, native separators
   * @param {string} incoming - Rendered content
   */
  const visit = (rel, incoming) => {
    const dest = path.join(outDir, rel);
    if (!fs.existsSync(dest)) {
      plan.push({ rel, content: incoming });
      created.push(rel);
      return;
    }

    const existing = fs.readFileSync(dest, 'utf8');

    const merged = mergeManagedRegion(existing, incoming);
    if (merged !== null) {
      // A stub whose region already matches the render is current, not
      // refreshed: reporting it as "updated" and rewriting it was false.
      if (merged === existing) {
        unchanged.push(rel);
        return;
      }
      plan.push({ rel, content: merged });
      preserved.push(rel);
      return;
    }

    // Computed even without `adopt`: it decides which list a refusal uses.
    // Broken markers are not adoptable, so they fall through to `force`.
    const wrapped = adoptManagedRegion(existing, incoming);
    if (adopt && wrapped !== null) {
      plan.push({ rel, content: wrapped });
      adopted.push(rel);
      return;
    }

    if (existing === incoming) {
      unchanged.push(rel);
      return;
    }

    if (force) {
      plan.push({ rel, content: incoming });
      replaced.push(rel);
      return;
    }

    (wrapped !== null ? needsAdopt : needsForce).push(rel);
  };

  for (const entry of entries) visit(toNative(entry.target), entry.content);

  const report = {
    created,
    preserved,
    adopted,
    replaced,
    unchanged,
    needsAdopt,
    needsForce,
  };

  if (dryRun) return report;

  if (needsAdopt.length > 0 || needsForce.length > 0) {
    throw new ScaffoldRefusal(needsAdopt, needsForce);
  }

  for (const { rel, content } of plan) {
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  }

  return report;
}

/**
 * @typedef {object} MergeReport
 * @property {string[]} created    - Did not exist; written fresh
 * @property {string[]} preserved  - Managed region refreshed, edits kept
 * @property {string[]} adopted    - Marker-less stub given the block below its title
 * @property {string[]} replaced   - Replaced wholesale under `force`; edits lost
 * @property {string[]} unchanged  - Already identical to the render
 * @property {string[]} needsAdopt - Would be adopted, but `adopt` was not given
 * @property {string[]} needsForce - Would be replaced, but `force` was not given
 */

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
 * @param {boolean} [options.dryRun] - Build and report the plan; write nothing
 *   and never throw a refusal. The report's `needsAdopt`/`needsForce` say what
 *   a real run would stop on.
 * @returns {Promise<{ outputDir: string, template: string } & MergeReport>}
 */
export async function scaffold({
  templateName,
  outputDir,
  overrides = {},
  adopt = false,
  force = false,
  dryRun = false,
}) {
  const { config } = resolveScaffoldConfig({
    templateName,
    outputDir,
    overrides,
  });
  const outDir = config.outDir;

  // Plan in memory, then merge. Rendering in place would clobber a file
  // before its region could be read back; a staging directory used to stand
  // in for the plan, and cost a temp dir and a walk per run.
  const entries = await planRender(config);
  const report = mergeRenderedTree(entries, outDir, { adopt, force, dryRun });
  return { outputDir: outDir, template: templateName, ...report };
}
