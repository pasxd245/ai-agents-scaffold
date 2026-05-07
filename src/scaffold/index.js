import path from 'node:path';
import { renderDirectory, resolveConfig } from '@nci-gis/js-tmpl';
import { resolveTemplatePath } from '../templates/index.js';
import { TEMPLATE_EXT } from '../constants.js';

export { checkExistingFiles } from './conflicts.js';

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
 * @returns {Promise<{ outputDir: string, template: string }>}
 */
export async function scaffold({ templateName, outputDir, overrides = {} }) {
  const paths = resolveTemplatePath(templateName);
  const outDir = path.resolve(outputDir);

  // Use the template root as `cwd` for resolveConfig so it doesn't pick up
  // a `js-tmpl.config.*` from the user's project. All paths we pass are
  // absolute, so cwd only affects project-config discovery.
  const cfg = resolveConfig(
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

  cfg.view = deepMerge(cfg.view, { ...overrides, env: process.env });

  await renderDirectory(cfg);

  return { outputDir: cfg.outDir, template: templateName };
}
