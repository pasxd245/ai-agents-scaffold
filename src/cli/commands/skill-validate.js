import fs from 'node:fs';
import path from 'node:path';
import { validateSkill, discoverSkills } from '../../skills/index.js';
import { parseFrontmatter } from '../../utils/frontmatter.js';
import { SKILL_FILE, SKILL_REF, SKILLS_DIRNAME } from '../../constants.js';

/**
 * @param {string} skillDir
 * @returns {string} 'skill-ref' | 'skill' | 'unknown'
 */
function detectSkillType(skillDir) {
  const skillFile = path.join(skillDir, SKILL_FILE);
  if (!fs.existsSync(skillFile)) return 'unknown';
  const parsed = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'));
  if (!parsed) return 'unknown';
  return parsed.frontmatter.metadata?.type === SKILL_REF ? SKILL_REF : 'skill';
}

/**
 * @param {string | undefined} targetName
 * @param {string} agentsDir
 */
export function runSkillValidate(targetName, agentsDir) {
  const skillsDir = path.join(agentsDir, SKILLS_DIRNAME);

  if (!fs.existsSync(skillsDir)) {
    console.log('No skills directory found.');
    return;
  }

  // `discoverSkills` recurses, so a nested skill installed as
  // `skill add planning/master-plan` is validated under its full name rather
  // than reported as a directory with no SKILL.md.
  const targets = targetName
    ? [{ name: targetName, skillDir: path.join(skillsDir, targetName) }]
    : discoverSkills(agentsDir);

  if (targets.length === 0) {
    console.log('No skills to validate.');
    return;
  }

  let allValid = true;
  let warned = 0;

  for (const { name, skillDir } of targets) {
    const type = detectSkillType(skillDir);
    const typeLabel = type === SKILL_REF ? 'skill-ref' : type;
    const result = validateSkill(skillDir);

    if (result.valid) {
      console.log(`  ✔ ${name} [${typeLabel}] — valid, ${result.score}/100`);
    } else {
      allValid = false;
      console.error(`  ✘ ${name} [${typeLabel}] — invalid`);
      for (const err of result.errors) {
        console.error(`    - ${err}`);
      }
    }

    for (const w of result.warnings) {
      warned++;
      console.error(`    ! ${w.message}`);
    }
  }

  if (warned > 0) {
    console.error(
      `\n${warned} conformance warning${warned === 1 ? '' : 's'}. ` +
        'These do not block installation.'
    );
  }

  // Exit code tracks spec validity only. Conformance warnings are advice.
  if (!allValid) {
    process.exit(1);
  }
}
