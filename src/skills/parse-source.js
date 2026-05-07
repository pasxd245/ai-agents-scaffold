import path from 'node:path';

/**
 * Parse a skill source string into a structured object.
 *
 * Supported formats:
 *   - Local path: ./my-skill, ../my-skill, /absolute/path
 *   - GitHub shorthand: owner/repo, owner/repo/path/to/skill
 *   - GitHub URL: https://github.com/owner/repo/tree/ref/path
 *
 * @param {string} source - The skill source string
 * @returns {{ type: 'local', localPath: string } | { type: 'github', owner: string, repo: string, skillPath: string, ref: string }}
 */
export function parseSkillSource(source) {
  // Local path
  if (
    source.startsWith('./') ||
    source.startsWith('../') ||
    source.startsWith('/')
  ) {
    return { type: 'local', localPath: path.resolve(source) };
  }

  // GitHub URL
  const urlMatch = source.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/
  );
  if (urlMatch) {
    return {
      type: 'github',
      owner: urlMatch[1],
      repo: urlMatch[2],
      ref: urlMatch[3],
      skillPath: urlMatch[4],
    };
  }

  // GitHub shorthand: owner/repo or owner/repo/sub/path
  const parts = source.split('/');
  if (parts.length >= 2 && !source.includes(':')) {
    return {
      type: 'github',
      owner: parts[0],
      repo: parts[1],
      skillPath: parts.slice(2).join('/') || '',
      ref: '',
    };
  }

  throw new Error(
    `Unable to parse skill source: "${source}". ` +
      'Expected a local path (./skill), GitHub shorthand (owner/repo/path), ' +
      'or GitHub URL (https://github.com/owner/repo/tree/ref/path).'
  );
}
