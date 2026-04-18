import { HELP, pkg } from './help.js';
import { detectCommand } from './args.js';
import { runScaffold } from './commands/scaffold.js';
import { runSkill } from './commands/skill.js';

export async function run() {
  const argv = process.argv.slice(2);

  // Handle top-level --help and --version before command detection
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    return;
  }
  if (argv.includes('--version') || argv.includes('-v')) {
    console.log(pkg.version);
    return;
  }

  const { command, args } = detectCommand(argv);

  if (command === 'skill') {
    await runSkill(args);
  } else {
    await runScaffold(args);
  }
}
