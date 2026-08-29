import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderDirectory, resolveConfig } from '@nci-gis/js-tmpl';
import { resolveTemplatePath } from '../templates/index.js';
import { TEMPLATE_EXT } from '../constants.js';
import { mergeManagedRegion } from './managed-region.js';

export { checkExistingFiles } from './conflicts.js';
export { listOutputPaths, resolveOutputPath } from './output-paths.js';
export {
  hasManagedRegion,
  mergeManagedRegion,
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
 * Copy a rendered tree onto the target, preserving managed-region surroundings.
 *
 * @param {string} stagingDir - Freshly rendered tree
 * @param {string} outDir - Destination
 * @returns {string[]} output-relative paths whose author content was preserved
 */
function mergeRenderedTree(stagingDir, outDir) {
  /** @type {string[]} */
  const preserved = [];

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
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (fs.existsSync(dest)) {
      const merged = mergeManagedRegion(
        fs.readFileSync(dest, 'utf8'),
        fs.readFileSync(abs, 'utf8')
      );
      if (merged !== null) {
        fs.writeFileSync(dest, merged);
        preserved.push(rel);
        return;
      }
    }

    fs.copyFileSync(abs, dest);
  };

  walk('');
  return preserved;
}

/**
 * Scaffold a template to the output directory.
 *
 * Delegates values loading to js-tmpl's `resolveConfig` so that `values.yaml`,
 * `values/` (value partials), and `partials/` are all optional. Overrides
 * are deep-merged on top of the resolved view.
 *
 * @param {object} options
 * @param {string} options.templateName - Template path (e.g. "scaffold/base")
 * @param {string} options.outputDir - Target directory to write files
 * @param {object} [options.overrides] - Values to merge over template defaults
 * @returns {Promise<{ outputDir: string, template: string, preserved: string[] }>}
 */
export async function scaffold({ templateName, outputDir, overrides = {} }) {
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
    const preserved = mergeRenderedTree(stagingDir, outDir);
    return { outputDir: outDir, template: templateName, preserved };
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}
