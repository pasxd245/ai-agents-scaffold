import fs from 'node:fs';
import path from 'node:path';
import { validateSkill } from '../../skills/index.js';
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

  const dirs = targetName
    ? [path.join(skillsDir, targetName)]
    : fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(skillsDir, e.name));

  if (dirs.length === 0) {
    console.log('No skills to validate.');
    return;
  }

  let allValid = true;
  for (const dir of dirs) {
    const name = path.basename(dir);
    const type = detectSkillType(dir);
    const typeLabel = type === SKILL_REF ? 'skill-ref' : type;
    const result = validateSkill(dir);
    if (result.valid) {
      console.log(`  ✔ ${name} [${typeLabel}] — valid`);
    } else {
      allValid = false;
      console.error(`  ✘ ${name} [${typeLabel}] — invalid`);
      for (const err of result.errors) {
        console.error(`    - ${err}`);
      }
    }
  }

  if (!allValid) {
    process.exit(1);
  }
}
