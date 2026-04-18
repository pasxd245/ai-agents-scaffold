import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

/**
 * List all available template names.
 * Each subdirectory under templates/ is a template.
 *
 * @returns {string[]}
 */
export function listTemplates() {
  const entries = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/**
 * Resolve paths for a given template name.
 *
 * @param {string} name - Template name (e.g. "base")
 * @returns {{ templateDir: string, valuesFile: string, partialsDir?: string }}
 */
export function resolveTemplatePath(name) {
  const templateRoot = path.join(TEMPLATES_DIR, name);

  if (!fs.existsSync(templateRoot)) {
    const available = listTemplates().join(', ');
    throw new Error(
      `Template "${name}" not found. Available templates: ${available}`
    );
  }

  const templateDir = path.join(templateRoot, 'template');
  const valuesFile = path.join(templateRoot, 'values.yaml');
  const partialsDir = path.join(templateRoot, 'partials');

  if (!fs.existsSync(templateDir)) {
    throw new Error(
      `Template "${name}" is missing a template/ directory at ${templateDir}`
    );
  }

  if (!fs.existsSync(valuesFile)) {
    throw new Error(
      `Template "${name}" is missing values.yaml at ${valuesFile}`
    );
  }

  return {
    templateDir,
    valuesFile,
    partialsDir: fs.existsSync(partialsDir) ? partialsDir : undefined,
  };
}
