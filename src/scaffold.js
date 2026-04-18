import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { renderDirectory } from '@nci-gis/js-tmpl';
/** @typedef {import('@nci-gis/js-tmpl').RenderDirectoryConfig} RenderDirectoryConfig */
import { resolveTemplatePath } from './templates.js';

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
 * @param {object} options
 * @param {string} options.templateName - Template name (e.g. "base")
 * @param {string} options.outputDir - Target directory to write files
 * @param {object} [options.overrides={}] - Values to merge over defaults
 * @returns {Promise<{ outputDir: string, template: string }>}
 */
export async function scaffold({ templateName, outputDir, overrides = {} }) {
  const { templateDir, valuesFile, partialsDir } =
    resolveTemplatePath(templateName);

  // Load default values from template's values.yaml
  const raw = fs.readFileSync(valuesFile, 'utf8');
  const defaultValues = yaml.load(raw) || {};

  // Merge with CLI overrides
  const mergedValues = deepMerge(defaultValues, overrides);

  // Build config object directly for renderDirectory
  /** @type {RenderDirectoryConfig} */
  const config = {
    templateDir,
    outDir: path.resolve(outputDir),
    extname: '.hbs',
    view: { ...mergedValues, env: process.env },
  };

  if (partialsDir) {
    config.partialsDir = partialsDir;
  }

  await renderDirectory(config);

  return { outputDir: config.outDir, template: templateName };
}
