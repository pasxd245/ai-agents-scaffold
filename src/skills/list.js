import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../utils/frontmatter.js';

/**
 * List installed skills in an .agents directory.
 *
 * @param {string} agentsDir - Path to .agents/ directory
 * @returns {Array<{ name: string, description: string, path: string }>}
 */
export function listSkills(agentsDir) {
  const skillsDir = path.join(agentsDir, 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  /** @type {Array<{ name: string, description: string, path: string }>} */
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillPath = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillFile)) continue;

    try {
      const content = fs.readFileSync(skillFile, 'utf8');
      const parsed = parseFrontmatter(content);
      if (parsed?.frontmatter?.name) {
        skills.push({
          name: parsed.frontmatter.name,
          description: parsed.frontmatter.description || '',
          path: skillPath,
        });
      }
    } catch {
      // Skip skills with unparseable SKILL.md
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Discover all skills in an agents directory.
 *
 * Unlike `listSkills`, this returns the skill directory path (`skillDir`)
 * instead of `description` and `path`. Used internally by `installSkillRef`
 * to resolve `--skill all`.
 *
 * @param {string} agentsDir - Path to an agents directory (e.g. .agents/)
 * @returns {Array<{ name: string, skillDir: string }>}
 */
export function discoverSkills(agentsDir) {
  const skillsDir = path.join(agentsDir, 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  /** @type {Array<{ name: string, skillDir: string }>} */
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillFile)) continue;

    try {
      const content = fs.readFileSync(skillFile, 'utf8');
      const parsed = parseFrontmatter(content);
      if (parsed?.frontmatter.name) {
        skills.push({
          name: parsed.frontmatter.name,
          skillDir,
        });
      }
    } catch {
      // Skip skills with unparseable SKILL.md
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check whether a skill directory contains a skill-ref (pointer) file.
 *
 * @param {string} skillDir - Path to a skill directory containing SKILL.md
 * @returns {{ isRef: true, content: string } | { isRef: false, content: null }}
 */
export function isSkillRef(skillDir) {
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    return { isRef: false, content: null };
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    return { isRef: false, content: null };
  }

  const isRef = parsed.frontmatter.metadata?.type === 'skill-ref';
  return isRef ? { isRef: true, content } : { isRef: false, content: null };
}
