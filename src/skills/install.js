import fs from 'node:fs';
import path from 'node:path';

import { validateSkill } from './validate.js';
import { resolveSkillSource } from './resolve.js';
import { sparseCloneGitHub } from '../utils/download.js';
import { SKILL_FILE } from '../constants.js';

/** @typedef {import('../config/rc.js').A2ScaffoldRc} A2ScaffoldRc */

/**
 * Install a skill into the target skills directory.
 *
 * Resolution order (see `resolveSkillSource`):
 *   1. Explicit local path / GitHub URL → use as-is
 *   2. `--from <registry>` → fetch from rc-defined registry
 *   3. Bare/nested name → built-in local pool (templates/skills/)
 *
 * Install destination preserves the *requested* path for bare names so
 * `skill add planning/master-plan` lands at `<target>/planning/master-plan/`.
 *
 * @param {string} source
 * @param {string} targetDir - Path to .agents/skills/ directory
 * @param {{ from?: string, rc?: A2ScaffoldRc, force?: boolean }} [options]
 * @returns {{ name: string, path: string }}
 */
export function installSkill(source, targetDir, options = {}) {
  const rc = options.rc ?? {};
  const resolved = resolveSkillSource(source, { from: options.from, rc });

  // Decide destination name. For bare/nested names that hit the local
  // pool or a registry, preserve the request verbatim. For explicit
  // local paths / GitHub URLs, use the source basename (legacy behavior).
  const destName = isBareOrNested(source) ? source : null;

  if (resolved.type === 'local') {
    return installFromLocal(resolved.localPath, targetDir, {
      force: options.force,
      destName,
    });
  }

  return installFromGitHub(resolved, targetDir, {
    force: options.force,
    destName,
  });
}

/**
 * @param {string} source
 */
function isBareOrNested(source) {
  if (source.startsWith('./') || source.startsWith('../')) return false;
  if (source.startsWith('/')) return false;
  if (/^https?:\/\//.test(source)) return false;
  return true;
}

/**
 * @param {string} sourcePath
 * @param {string} targetDir
 * @param {{ force?: boolean, destName?: string | null }} options
 */
function installFromLocal(sourcePath, targetDir, options) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  const preCheck = validateSkill(sourcePath);
  if (!preCheck.valid) {
    throw new Error(
      `Source skill is invalid:\n  - ${preCheck.errors.join('\n  - ')}`
    );
  }

  const skillName = options.destName ?? path.basename(sourcePath);
  const destPath = path.join(targetDir, skillName);

  if (fs.existsSync(destPath) && !options.force) {
    throw new Error(
      `Skill "${skillName}" already exists. Use --force to overwrite.`
    );
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true });
  }

  fs.cpSync(sourcePath, destPath, { recursive: true });

  return { name: skillName, path: destPath };
}

/**
 * @param {{ owner: string, repo: string, skillPath?: string, ref?: string }} parsed
 * @param {string} targetDir
 * @param {{ force?: boolean, destName?: string | null }} options
 */
function installFromGitHub(parsed, targetDir, options) {
  const { owner, repo, skillPath, ref } = parsed;

  return sparseCloneGitHub(
    { owner, repo, ref, subPath: skillPath },
    (clonedSkillDir) => {
      const skillFile = path.join(clonedSkillDir, SKILL_FILE);
      if (!fs.existsSync(skillFile)) {
        const subs = fs.readdirSync(clonedSkillDir, { withFileTypes: true });
        const skillDirs = subs.filter(
          (s) =>
            s.isDirectory() &&
            fs.existsSync(path.join(clonedSkillDir, s.name, SKILL_FILE))
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
