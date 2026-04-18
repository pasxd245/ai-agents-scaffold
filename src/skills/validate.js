import fs from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from '../utils/frontmatter.js';
import { walkRefChain } from './ref-chain.js';

const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MAX_NAME_LEN = 64;
const MAX_DESC_LEN = 1024;
const MAX_COMPAT_LEN = 500;

/**
 * Validate the frontmatter fields of a parsed SKILL.md.
 *
 * @param {import('../utils/frontmatter.js').Frontmatter} frontmatter
 * @param {string} dirName - Basename of the skill directory
 * @returns {string[]} list of errors (empty if valid)
 */
function validateFrontmatterFields(frontmatter, dirName) {
  /** @type {string[]} */
  const errors = [];

  // Required: name
  if (frontmatter?.name) {
    const name = String(frontmatter.name);
    if (name.length > MAX_NAME_LEN) {
      errors.push(`name exceeds ${MAX_NAME_LEN} characters`);
    }
    if (!NAME_RE.test(name)) {
      errors.push(
        'name must be lowercase alphanumeric with hyphens, no leading/trailing/consecutive hyphens'
      );
    }
    if (name.includes('--')) {
      errors.push('name must not contain consecutive hyphens');
    }
    if (name !== dirName) {
      errors.push(`name "${name}" does not match directory name "${dirName}"`);
    }
  } else {
    errors.push('Missing required field: name');
  }

  // Required: description
  if (frontmatter?.description) {
    const desc = String(frontmatter.description);
    if (desc.length > MAX_DESC_LEN) {
      errors.push(`description exceeds ${MAX_DESC_LEN} characters`);
    }
  } else {
    errors.push('Missing required field: description');
  }

  // Optional: compatibility
  if (
    frontmatter.compatibility &&
    String(frontmatter.compatibility).length > MAX_COMPAT_LEN
  ) {
    errors.push(`compatibility exceeds ${MAX_COMPAT_LEN} characters`);
  }

  return errors;
}

/**
 * Validate a skill directory against the agentskills.io spec.
 *
 * If the skill is a skill-ref, walks the ref chain (cycle-safe,
 * depth-capped) and validates the terminal skill. Ref-hop errors are
 * surfaced in `errors`.
 *
 * @param {string} skillDir - Path to the skill directory
 * @returns {{ valid: boolean, errors: string[], skill: object|null }}
 */
export function validateSkill(skillDir) {
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    return { valid: false, errors: ['SKILL.md not found'], skill: null };
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    return {
      valid: false,
      errors: ['SKILL.md has no YAML frontmatter'],
      skill: null,
    };
  }

  const { frontmatter } = parsed;
  const dirName = path.basename(skillDir);
  const errors = validateFrontmatterFields(frontmatter, dirName);

  // If it's a skill-ref, also validate the chain terminates at a valid raw skill
  if (frontmatter.metadata?.type === 'skill-ref') {
    const walk = walkRefChain(skillDir);
    if (!walk.ok) {
      errors.push(walk.error);
    } else if (walk.terminalDir !== path.resolve(skillDir)) {
      // Chain resolved to a different dir — validate the terminal raw skill
      const terminalResult = validateSkill(walk.terminalDir);
      if (!terminalResult.valid) {
        for (const e of terminalResult.errors) {
          errors.push(`terminal skill invalid: ${e}`);
        }
      }
    }
  }

  const skill = errors.length === 0 ? frontmatter : null;
  return { valid: errors.length === 0, errors, skill };
}
