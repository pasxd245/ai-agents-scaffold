import { installSkillRef } from '../../skills.js';
import { parseSkillRefArgs } from '../args.js';

/** @param {string[]} args */
export async function runSkillRef(args) {
  const { skill, from, to, force } = parseSkillRefArgs(args);
  const results = await installSkillRef({ from, to, skill, force });
  for (const result of results) {
    console.log(`Created skill ref "${result.name}" at ${result.path}`);
  }
}
