import path from 'node:path';
import { installSkill } from '../../skills/index.js';

/**
 * @param {string | undefined} source
 * @param {string} agentsDir
 * @param {boolean} force
 */
export function runSkillAdd(source, agentsDir, force) {
  if (!source) {
    console.error('Error: skill add requires a source argument.\n');
    console.error('Usage: a2scaffold skill add <source>');
    console.error('  source: local path, GitHub shorthand, or GitHub URL');
    process.exit(1);
  }
  const skillsDir = path.join(agentsDir, 'skills');
  const result = installSkill(source, skillsDir, { force });
  console.log(`Installed skill "${result.name}" to ${result.path}`);
}
