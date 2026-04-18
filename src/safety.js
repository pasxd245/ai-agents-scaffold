import fs from 'node:fs';
import path from 'node:path';

/**
 * Walk template directory and predict output file paths.
 * Returns list of paths relative to outDir that would be generated.
 *
 * @param {string} templateDir
 * @param {string} [extname]
 * @returns {string[]}
 */
function predictOutputPaths(templateDir, extname = '.hbs') {
  /** @type {string[]} */
  const results = [];
  /** @type {string[]} */
  const queue = [''];

  while (queue.length) {
    const rel = /** @type {string} */ (queue.shift());
    const abs = path.join(templateDir, rel);
    const stat = fs.statSync(abs);

    if (stat.isDirectory()) {
      const items = fs.readdirSync(abs);
      for (const name of items) {
        queue.push(rel ? path.join(rel, name) : name);
      }
    } else if (abs.endsWith(extname)) {
      // Strip the template extension to get the output path
      const outputRel = rel.replace(new RegExp(`${extname}$`), '');
      results.push(outputRel);
    }
  }

  return results;
}

/**
 * Check which output files already exist in the target directory.
 * @param {string} templateDir - Path to template/ directory
 * @param {string} outDir - Target output directory
 * @param {string} [extname='.hbs'] - Template file extension
 * @returns {string[]} List of existing file paths (relative to outDir)
 */
export function checkExistingFiles(templateDir, outDir, extname = '.hbs') {
  const outputPaths = predictOutputPaths(templateDir, extname);

  return outputPaths.filter((rel) => {
    const abs = path.join(outDir, rel);
    return fs.existsSync(abs);
  });
}
