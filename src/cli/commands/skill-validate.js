import fs from 'node:fs';
import path from 'node:path';
import { validateSkill } from '../../skills/index.js';

/**
 * @param {string | undefined} targetName
 * @param {string} agentsDir
 */
export function runSkillValidate(targetName, agentsDir) {
  const skillsDir = path.join(agentsDir, 'skills');

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
    const result = validateSkill(dir);
    if (result.valid) {
      console.log(`  ${name} — valid`);
    } else {
      allValid = false;
      console.error(`  ${name} — invalid`);
      for (const err of result.errors) {
        console.error(`    - ${err}`);
      }
    }
  }

  if (!allValid) {
    process.exit(1);
  }
}
