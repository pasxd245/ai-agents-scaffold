import path from 'node:path';
import { installSkill } from '../../skills/index.js';
import { loadRc } from '../../config/rc.js';
import { SKILLS_DIRNAME } from '../../constants.js';

/**
 * @param {string | undefined} source
 * @param {string} agentsDir
 * @param {boolean} force
 * @param {string} [from]
 */
export function runSkillAdd(source, agentsDir, force, from) {
  if (!source) {
    console.error('Error: skill add requires a source argument.\n');
    console.error('Usage: a2scaffold skill add <source> [--from <registry>]');
    console.error('  source: bare/nested name, local path (./), or GitHub URL');
    process.exit(1);
  }
  const skillsDir = path.join(agentsDir, SKILLS_DIRNAME);
  const rc = loadRc();
  const result = installSkill(source, skillsDir, { force, from, rc });
  console.log(`Installed skill "${result.name}" to ${result.path}`);
}
