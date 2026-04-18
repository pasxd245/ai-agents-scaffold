import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../utils/frontmatter.js';

export const MAX_REF_DEPTH = 5;
const ROOT_PATH_PREFIX = '@rootPath/';

/**
 * Extract the `sourceDir` (the path after `@rootPath/`) from a skill-ref
 * body. Returns null if no such line is present.
 *
 * @param {string} body
 * @returns {string | null}
 */
function extractSourceDir(body) {
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith(ROOT_PATH_PREFIX)) {
      return trimmed.slice(ROOT_PATH_PREFIX.length);
    }
  }
  return null;
}

/**
 * Read a skill directory's SKILL.md and return the parsed ref pointer,
 * or null if the skill is not a ref / cannot be parsed as one.
 *
 * @param {string} skillDir
 * @returns {{ rootPath: string, sourceDir: string } | null}
 */
function readRefPointer(skillDir) {
  const skillFile = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;

  const content = fs.readFileSync(skillFile, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) return null;

  if (parsed.frontmatter.metadata?.type !== 'skill-ref') return null;

  const rootPath = parsed.frontmatter.metadata.rootPath;
  if (typeof rootPath !== 'string') return null;

  const sourceDir = extractSourceDir(parsed.body);
  if (!sourceDir) return null;

  return { rootPath, sourceDir };
}

/**
 * Walk a skill-ref chain starting at `startDir` and return either the
 * terminal raw skill directory (absolute), or an error string.
 *
 * Error strings are returned (not thrown) so callers can fold them into
 * validation-result arrays.
 *
 * @param {string} startDir - Absolute path to the initial skill directory
 * @returns {{ ok: true, terminalDir: string, chain: string[] } | { ok: false, error: string, chain: string[] }}
 */
export function walkRefChain(startDir) {
  /** @type {string[]} */
  const chain = [path.resolve(startDir)];
  const visited = new Set([path.resolve(startDir)]);
  let current = path.resolve(startDir);

  for (let depth = 0; depth <= MAX_REF_DEPTH; depth++) {
    const ref = readRefPointer(current);
    if (!ref) {
      // Terminal: not a ref, treat as raw skill dir (caller validates it)
      return { ok: true, terminalDir: current, chain };
    }

    const targetDir = path.resolve(current, ref.rootPath, ref.sourceDir);

    if (!fs.existsSync(targetDir)) {
      return {
        ok: false,
        error: `broken ref: target does not exist at "${targetDir}"`,
        chain,
      };
    }

    if (visited.has(targetDir)) {
      const cycle = [...chain, targetDir]
        .map((p) => path.basename(path.dirname(p)) + '/' + path.basename(p))
        .join(' → ');
      return {
        ok: false,
        error: `ref cycle detected: ${cycle}`,
        chain,
      };
    }

    chain.push(targetDir);
    visited.add(targetDir);
    current = targetDir;
  }

  return {
    ok: false,
    error: `ref chain exceeds max depth (${MAX_REF_DEPTH})`,
    chain,
  };
}
