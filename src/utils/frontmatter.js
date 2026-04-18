import yaml from 'js-yaml';

/**
 * @typedef {Record<string, any>} Frontmatter
 * @typedef {{ frontmatter: Frontmatter, body: string }} ParsedFrontmatter
 */

/**
 * Parse YAML frontmatter from a markdown file's content.
 * Returns `{ frontmatter, body }` or `null` if no frontmatter found.
 *
 * @param {string} content
 * @returns {ParsedFrontmatter | null}
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const frontmatter = /** @type {Frontmatter} */ (yaml.load(match[1]) || {});
  const body = content.slice(match[0].length).trim();
  return { frontmatter, body };
}
