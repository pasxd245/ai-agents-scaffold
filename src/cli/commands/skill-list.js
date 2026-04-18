import { listSkills } from '../../skills.js';

/** @param {string} agentsDir */
export function runSkillList(agentsDir) {
  const skills = listSkills(agentsDir);
  if (skills.length === 0) {
    console.log('No skills installed.\n');
    console.log('Install one with: a2scaffold skill add <source>');
    return;
  }
  console.log('Installed skills:\n');
  for (const s of skills) {
    console.log(`  ${s.name}`);
    if (s.description) {
      console.log(`    ${s.description}`);
    }
  }
}
