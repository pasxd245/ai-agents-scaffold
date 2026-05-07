import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../utils/frontmatter.js';
import { SKILL_FILE, SKILL_REF, SKILLS_DIRNAME } from '../constants.js';

/**
 * List installed skills in an .agents directory (recursive).
 *
 * Skill `name` is read from frontmatter when present; otherwise the
 * relative path under `skills/` is used as the fallback name.
 *
 * @param {string} agentsDir - Path to .agents/ directory
 * @returns {Array<{ name: string, description: string, path: string }>}
 */
export function listSkills(agentsDir) {
  const skillsDir = path.join(agentsDir, SKILLS_DIRNAME);
  const discovered = walkSkills(skillsDir);
  /** @type {Array<{ name: string, description: string, path: string }>} */
  const skills = [];

  for (const { name: relName, skillDir } of discovered) {
    const skillFile = path.join(skillDir, SKILL_FILE);
    try {
      const content = fs.readFileSync(skillFile, 'utf8');
      const parsed = parseFrontmatter(content);
      const name = parsed?.frontmatter?.name ?? relName;
      const description = parsed?.frontmatter?.description ?? '';
      skills.push({ name, description, path: skillDir });
    } catch {
      // Skip skills with unparseable SKILL.md
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Recursively walk skillsDir and collect any directory containing a
 * SKILL.md. Returns relative names (which may include slashes).
 *
 * @param {string} skillsDir
 * @param {string} prefix
 * @returns {Array<{ name: string, skillDir: string }>}
 */
function walkSkills(skillsDir, prefix = '') {
  if (!fs.existsSync(skillsDir)) return [];
  /** @type {Array<{ name: string, skillDir: string }>} */
  const out = [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const abs = path.join(skillsDir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const skillFile = path.join(abs, SKILL_FILE);
    if (fs.existsSync(skillFile)) {
      out.push({ name: rel, skillDir: abs });
      continue;
    }
    out.push(...walkSkills(abs, rel));
  }
  return out;
}

/**
 * Discover all skills in an agents directory (recursive).
 *
 * Unlike `listSkills`, this returns the skill directory path (`skillDir`)
 * and uses the relative path (possibly nested) as the canonical name.
 * Used internally by `installSkillRef` to resolve `--skill all`.
 *
 * @param {string} agentsDir - Path to an agents directory (e.g. .agents/)
 * @returns {Array<{ name: string, skillDir: string }>}
 */
export function discoverSkills(agentsDir) {
  const skillsDir = path.join(agentsDir, SKILLS_DIRNAME);
  return walkSkills(skillsDir).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check whether a skill directory contains a skill-ref (pointer) file.
 *
 * @param {string} skillDir - Path to a skill directory containing SKILL.md
 * @returns {{ isRef: true, content: string } | { isRef: false, content: null }}
 */
export function isSkillRef(skillDir) {
  const skillFile = path.join(skillDir, SKILL_FILE);

  if (!fs.existsSync(skillFile)) {
    return { isRef: false, content: null };
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    return { isRef: false, content: null };
  }

  const isRef = parsed.frontmatter.metadata?.type === SKILL_REF;
  return isRef ? { isRef: true, content } : { isRef: false, content: null };
}
