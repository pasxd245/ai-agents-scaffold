import fs from 'node:fs';
import path from 'node:path';

import { parseSkillSource } from './parse-source.js';
import { validateSkill } from './validate.js';
import { sparseCloneGitHub } from '../utils/download.js';

/**
 * Install a skill from a source into the target skills directory.
 *
 * @param {string} source - Skill source string (local path or GitHub ref)
 * @param {string} targetDir - Path to .agents/skills/ directory
 * @param {{ force?: boolean }} [options]
 * @returns {{ name: string, path: string }}
 */
export function installSkill(source, targetDir, options = {}) {
  const parsed = parseSkillSource(source);

  if (parsed.type === 'local') {
    return installFromLocal(parsed.localPath, targetDir, options);
  }

  if (parsed.type === 'github') {
    return installFromGitHub(parsed, targetDir, options);
  }

  throw new Error(
    `Unsupported source type: ${/** @type {{type:string}} */ (parsed).type}`
  );
}

/**
 * @param {string} sourcePath
 * @param {string} targetDir
 * @param {{ force?: boolean }} options
 */
function installFromLocal(sourcePath, targetDir, options) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  // Validate before copying
  const preCheck = validateSkill(sourcePath);
  if (!preCheck.valid) {
    throw new Error(
      `Source skill is invalid:\n  - ${preCheck.errors.join('\n  - ')}`
    );
  }

  const skillName = path.basename(sourcePath);
  const destPath = path.join(targetDir, skillName);

  if (fs.existsSync(destPath) && !options.force) {
    throw new Error(
      `Skill "${skillName}" already exists. Use --force to overwrite.`
    );
  }

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true });
  }

  fs.cpSync(sourcePath, destPath, { recursive: true });

  return { name: skillName, path: destPath };
}

/**
 * @param {{ owner: string, repo: string, skillPath?: string, ref?: string }} parsed
 * @param {string} targetDir
 * @param {{ force?: boolean }} options
 */
function installFromGitHub(parsed, targetDir, options) {
  const { owner, repo, skillPath, ref } = parsed;

  return sparseCloneGitHub(
    { owner, repo, ref, subPath: skillPath },
    (clonedSkillDir) => {
      const skillFile = path.join(clonedSkillDir, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        const subs = fs.readdirSync(clonedSkillDir, { withFileTypes: true });
        const skillDirs = subs.filter(
          (s) =>
            s.isDirectory() &&
            fs.existsSync(path.join(clonedSkillDir, s.name, 'SKILL.md'))
        );
        if (skillDirs.length > 0) {
          const names = skillDirs.map((s) => s.name).join(', ');
          throw new Error(
            `"${skillPath || repo}" contains multiple skills (${names}). ` +
              'Specify the full path to a single skill.'
          );
        }
        throw new Error(
          `No SKILL.md found at "${skillPath || '/'}" in ${owner}/${repo}`
        );
      }

      return installFromLocal(clonedSkillDir, targetDir, options);
    }
  );
}
