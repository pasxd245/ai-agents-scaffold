import fs from 'node:fs';
import path from 'node:path';

import { auditSkill, discoverSkills } from '../../skills/index.js';
import { SKILLS_DIRNAME } from '../../constants.js';

const SEVERITY_ORDER = { high: 0, medium: 1 };

/**
 * Screen installed skills for supply-chain risks.
 *
 * Reports and exits 0 even when findings exist: a finding is a prompt to look,
 * not a verdict. Only a missing skills directory or an unknown skill fails.
 *
 * @param {string | undefined} targetName
 * @param {string} agentsDir
 */
export function runSkillAudit(targetName, agentsDir) {
  const skillsDir = path.join(agentsDir, SKILLS_DIRNAME);

  if (!fs.existsSync(skillsDir)) {
    console.error(`No skills directory found at ${skillsDir}`);
    process.exit(1);
  }

  // Recurse, so a nested skill is screened rather than its parent directory
  // being reported as a skill with no SKILL.md.
  const targets = targetName
    ? [{ name: targetName, skillDir: path.join(skillsDir, targetName) }]
    : discoverSkills(agentsDir);

  if (targets.length === 0) {
    console.log('No skills to audit.');
    return;
  }

  let total = 0;
  let high = 0;

  for (const { name, skillDir } of targets) {
    if (!fs.existsSync(skillDir)) {
      console.error(`Skill not found: ${name}`);
      process.exit(1);
    }

    const { findings, scanned, clean } = auditSkill(skillDir);

    if (clean) {
      console.log(`  ✔ ${name} — ${scanned} file(s) screened, nothing flagged`);
      continue;
    }

    console.log(`  • ${name} — ${findings.length} finding(s)`);
    const sorted = [...findings].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );
    for (const f of sorted) {
      total++;
      if (f.severity === 'high') high++;
      const where = f.line ? `${f.file}:${f.line}` : f.file;
      console.log(`    [${f.severity}] ${where} — ${f.message}`);
    }
  }

  if (total > 0) {
    console.log(
      `\n${total} finding(s), ${high} high severity. These are heuristics, ` +
        'not proof of anything: read the flagged lines before trusting a skill ' +
        'you did not write. Skills run with your agent’s full permissions.'
    );
  }
}
