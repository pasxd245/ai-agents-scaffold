import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PARTIALS_DIRNAME,
  SCAFFOLD_TYPE,
  SKILLS_DIRNAME,
  TEMPLATE_DIRNAME,
  VALUES_DIRNAME,
  VALUES_FILE,
} from '../constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');
const SCAFFOLD_DIR = path.join(TEMPLATES_DIR, SCAFFOLD_TYPE);

export const BUILTIN_SKILLS_DIR = path.join(TEMPLATES_DIR, SKILLS_DIRNAME);

/**
 * @param {string} root
 * @returns {boolean}
 */
function isTemplate(root) {
  return fs.existsSync(path.join(root, TEMPLATE_DIRNAME));
}

/**
 * Recursively walk a directory and yield relative paths to template roots
 * (directories containing both `template/` and `values.yaml`).
 *
 * @param {string} root
 * @param {string} prefix
 * @returns {string[]}
 */
function walkTemplateDir(root, prefix = '') {
  if (!fs.existsSync(root)) return [];
  /** @type {string[]} */
  const out = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const abs = path.join(root, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (isTemplate(abs)) {
      out.push(rel);
      continue;
    }
    out.push(...walkTemplateDir(abs, rel));
  }
  return out;
}

/**
 * List available scaffold template names. Names may be nested
 * (e.g. "shared/research-setup").
 *
 * @returns {string[]}
 */
export function listTemplates() {
  return walkTemplateDir(SCAFFOLD_DIR).sort((a, b) => a.localeCompare(b));
}

/**
 * List child directory names under a scaffold sub-path that aren't
 * themselves templates. Used to render helpful "did you mean" hints.
 *
 * @param {string} subPath
 * @returns {string[]}
 */
export function listChildren(subPath) {
  const abs = path.join(SCAFFOLD_DIR, subPath);
  if (!fs.existsSync(abs)) return [];
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Resolve paths for a given template.
 *
 * `name` is a path relative to `templates/`. The CLI normally prepends
 * `scaffold/` so `--use base` becomes `scaffold/base`. Internal callers
 * that target the singular `skill-ref` template pass `skill-ref` directly.
 *
 * Only `template/` is required. `values.yaml`, `values/`, and `partials/`
 * are all optional (mirrors js-tmpl's optional valuesFile/valuesDir/
 * partialsDir).
 *
 * @param {string} name - Template path (e.g. "scaffold/base", "skill-ref")
 * @returns {{ templateRoot: string, templateDir: string, valuesFile?: string, valuesDir?: string, partialsDir?: string }}
 */
export function resolveTemplatePath(name) {
  const templateRoot = path.join(TEMPLATES_DIR, name);

  if (!fs.existsSync(templateRoot)) {
    const available = listTemplates().join(', ');
    throw new Error(
      `Template "${name}" not found. Available scaffold templates: ${available}`
    );
  }

  const templateDir = path.join(templateRoot, TEMPLATE_DIRNAME);
  const valuesFile = path.join(templateRoot, VALUES_FILE);
  const valuesDir = path.join(templateRoot, VALUES_DIRNAME);
  const partialsDir = path.join(templateRoot, PARTIALS_DIRNAME);

  if (!fs.existsSync(templateDir)) {
    // Helpful error: maybe the user pointed at a parent directory
    const scaffoldPrefix = `${SCAFFOLD_TYPE}/`;
    if (name.startsWith(scaffoldPrefix)) {
      const sub = name.slice(scaffoldPrefix.length);
      const children = listChildren(sub);
      if (children.length > 0) {
        throw new Error(
          `"${sub}" is not a template directly. Available under "${sub}/": ${children.join(', ')}`
        );
      }
    }
    throw new Error(
      `Template "${name}" is missing a template/ directory at ${templateDir}`
    );
  }

  return {
    templateRoot,
    templateDir,
    valuesFile: fs.existsSync(valuesFile) ? valuesFile : undefined,
    valuesDir:
      fs.existsSync(valuesDir) && fs.statSync(valuesDir).isDirectory()
        ? valuesDir
        : undefined,
    partialsDir: fs.existsSync(partialsDir) ? partialsDir : undefined,
  };
}
