import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../utils/frontmatter.js';
import { SKILL_FILE, SKILL_REF } from '../constants.js';

export const MAX_REF_DEPTH = 5;

/**
 * Read a skill directory's SKILL.md and return the parsed ref pointer,
 * or null if the skill is not a ref / cannot be parsed as one.
 *
 * The pointer is read from `metadata.skillPath` in the frontmatter — a
 * path relative to the ref directory that resolves to the source skill.
 *
 * @param {string} skillDir
 * @returns {{ skillPath: string } | null}
 */
function readRefPointer(skillDir) {
  const skillFile = path.join(skillDir, SKILL_FILE);
  if (!fs.existsSync(skillFile)) return null;

  const content = fs.readFileSync(skillFile, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) return null;

  if (parsed.frontmatter.metadata?.type !== SKILL_REF) return null;

  const skillPath = parsed.frontmatter.metadata.skillPath;
  if (typeof skillPath !== 'string') return null;

  return { skillPath };
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

    const targetDir = path.resolve(current, ref.skillPath);

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
