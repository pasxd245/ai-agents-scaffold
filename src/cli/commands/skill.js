import { HELP } from '../help.js';
import { parseSkillArgs } from '../args.js';
import { runSkillAdd } from './skill-add.js';
import { runSkillList } from './skill-list.js';
import { runSkillValidate } from './skill-validate.js';
import { runSkillRef } from './skill-ref.js';

/** @param {string[]} args */
export async function runSkill(args) {
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    console.log(HELP);
    return;
  }

  // ref has its own arg parser; other subcommands share parseSkillArgs
  if (subcommand === 'ref') {
    await runSkillRef(args.slice(1));
    return;
  }

  const { agentsDir, force, positionals } = parseSkillArgs(args.slice(1));

  switch (subcommand) {
    case 'add':
      runSkillAdd(positionals[0], agentsDir, force);
      return;
    case 'list':
      runSkillList(agentsDir);
      return;
    case 'validate':
      runSkillValidate(positionals[0], agentsDir);
      return;
    default:
      console.error(`Unknown skill command: ${subcommand}`);
      console.error('Available: add, list, ref, validate');
      process.exit(1);
  }
}
