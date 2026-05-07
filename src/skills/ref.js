import fs from 'node:fs';
import path from 'node:path';

import { scaffold } from '../scaffold/index.js';
import { discoverSkills, isSkillRef } from './list.js';
import { SKILL_FILE, SKILL_REF, SKILLS_DIRNAME } from '../constants.js';

/**
 * Resolve the list of skills to reference based on the skill option.
 *
 * `name` is the relative path under `<from>/skills/` and may be nested
 * (e.g. `planning/master-plan`). Used as the destination subpath.
 *
 * @param {string} resolvedFrom
 * @param {string} skill
 */
function resolveSkillsToRef(resolvedFrom, skill) {
  if (skill === 'all') {
    const skills = discoverSkills(resolvedFrom);
    if (skills.length === 0) {
      throw new Error(`No skills found in ${resolvedFrom}/skills/`);
    }
    return skills;
  }

  const skillDir = path.join(resolvedFrom, SKILLS_DIRNAME, skill);
  if (!fs.existsSync(skillDir)) {
    throw new Error(`Skill "${skill}" not found in ${resolvedFrom}/skills/`);
  }
  const skillFile = path.join(skillDir, SKILL_FILE);
  if (!fs.existsSync(skillFile)) {
    throw new Error(
      `Skill "${skill}" has no SKILL.md in ${resolvedFrom}/skills/`
    );
  }
  return [{ name: skill, skillDir }];
}

/**
 * Leaf name of a possibly-nested skill name. Used for the ref's
 * frontmatter `name:` field, which the validator constrains to match
 * the directory basename.
 *
 * @param {string} name
 */
function leafName(name) {
  return name.split('/').at(-1) ?? name;
}

/**
 * Check destination for conflicts before writing a skill ref.
 * Throws if a real skill exists or if a ref exists without --force.
 *
 * @param {string} destSkillDir
 * @param {string} name
 * @param {boolean} force
 */
function checkDestConflict(destSkillDir, name, force) {
  const destSkillFile = path.join(destSkillDir, SKILL_FILE);

  if (!fs.existsSync(destSkillFile)) return;

  const destRef = isSkillRef(destSkillDir);

  if (!destRef.isRef) {
    throw new Error(
      `Cannot overwrite real skill "${name}". Remove it manually first.`
    );
  }

  if (!force) {
    throw new Error(
      `Skill ref "${name}" already exists. Use --force to overwrite.`
    );
  }
}

/**
 * Create skill references (lightweight pointer files) in a destination
 * agents directory, pointing back to skills in a source agents directory.
 *
 * @param {object} options
 * @param {string} options.from - Source agents dir (e.g. ".agents")
 * @param {string} options.to - Destination agents dir (e.g. ".claude")
 * @param {string} options.skill - Skill name or "all"
 * @param {boolean} [options.force] - Overwrite existing skill-refs
 * @returns {Promise<Array<{ name: string, path: string }>>}
 */
export async function installSkillRef({ from, to, skill, force = false }) {
  const resolvedFrom = path.resolve(from);
  const resolvedTo = path.resolve(to);

  if (resolvedFrom === resolvedTo) {
    throw new Error('Source and destination agents dirs must differ.');
  }

  const skillsToRef = resolveSkillsToRef(resolvedFrom, skill);
  /** @type {Array<{ name: string, path: string }>} */
  const results = [];

  for (const { name, skillDir } of skillsToRef) {
    const destSkillDir = path.join(resolvedTo, SKILLS_DIRNAME, name);

    checkDestConflict(destSkillDir, name, force);

    // If source is already a skill-ref, copy verbatim
    const sourceRef = isSkillRef(skillDir);
    if (sourceRef.isRef) {
      fs.mkdirSync(destSkillDir, { recursive: true });
      fs.writeFileSync(
        path.join(destSkillDir, SKILL_FILE),
        sourceRef.content,
        'utf8'
      );
      results.push({ name, path: destSkillDir });
      continue;
    }

    // Compute paths for the template
    const sourceRoot = path.resolve(resolvedFrom, '..');
    const agentsDirName = path.basename(resolvedFrom);
    const rootPath = path.relative(destSkillDir, sourceRoot);
    const sourceDir = path.join(agentsDirName, SKILLS_DIRNAME, name);

    await scaffold({
      templateName: SKILL_REF,
      outputDir: resolvedTo,
      overrides: {
        skill: {
          name: leafName(name),
          path: path.join(SKILLS_DIRNAME, name),
          rootPath,
          sourceDir,
        },
      },
    });

    results.push({ name, path: destSkillDir });
  }

  return results;
}
