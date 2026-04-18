import path from 'node:path';
import { parseArgs } from 'node:util';

const VALUE_FLAGS = new Set([
  'u',
  'use',
  'o',
  'output',
  'n',
  'name',
  'd',
  'agents-dir',
]);

/**
 * Check if an argv token is a flag whose value should be skipped.
 *
 * @param {string} token
 * @returns {boolean}
 */
function isValueFlag(token) {
  if (!token.startsWith('-')) return false;
  if (token.startsWith('--') && token.includes('=')) return false;
  const flag = token.replace(/^-+/, '');
  return VALUE_FLAGS.has(flag);
}

/**
 * Find the index of the first positional (non-flag) argument.
 * Returns -1 if no positional is found.
 *
 * @param {string[]} argv
 * @returns {number}
 */
function findFirstPositional(argv) {
  let skip = false;
  for (let i = 0; i < argv.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (argv[i] === '--') return -1;
    if (argv[i].startsWith('-')) {
      skip = isValueFlag(argv[i]);
      continue;
    }
    return i;
  }
  return -1;
}

/**
 * Detect command from argv. Returns { command, args } where command is
 * 'scaffold' (default) or 'skill', and args is the remaining argv slice.
 *
 * @param {string[]} argv
 * @returns {{ command: 'scaffold' | 'skill', args: string[] }}
 */
export function detectCommand(argv) {
  const idx = findFirstPositional(argv);
  if (idx === -1) return { command: 'scaffold', args: argv };

  if (argv[idx] === 'skill') {
    return { command: 'skill', args: argv.slice(idx + 1) };
  }
  if (argv[idx] === 'init') {
    return {
      command: 'scaffold',
      args: [...argv.slice(0, idx), ...argv.slice(idx + 1)],
    };
  }
  return { command: 'scaffold', args: argv };
}

/** @param {string[]} args */
export function parseSkillArgs(args) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'agents-dir': { type: 'string', short: 'd', default: '.agents' },
      force: { type: 'boolean', short: 'f', default: false },
    },
    allowPositionals: true,
    strict: true,
  });
  return {
    agentsDir: path.resolve(/** @type {string} */ (values['agents-dir'])),
    force: Boolean(values.force),
    positionals,
  };
}

/** @param {string[]} args */
export function parseSkillRefArgs(args) {
  const { values } = parseArgs({
    args,
    options: {
      skill: { type: 'string' },
      from: { type: 'string', default: '.agents' },
      to: { type: 'string' },
      force: { type: 'boolean', short: 'f', default: false },
    },
    strict: true,
  });

  if (!values.skill) {
    console.error('Error: --skill is required.\n');
    console.error('Usage: a2scaffold skill ref --skill <name|all> --to <dir>');
    process.exit(1);
  }

  if (!values.to) {
    console.error('Error: --to is required.\n');
    console.error('Usage: a2scaffold skill ref --skill <name|all> --to <dir>');
    process.exit(1);
  }

  return {
    skill: values.skill,
    from: /** @type {string} */ (values.from),
    to: values.to,
    force: Boolean(values.force),
  };
}
