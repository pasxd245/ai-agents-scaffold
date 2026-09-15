import fs from 'node:fs';
import path from 'node:path';

import { validateSkill } from './validate.js';
import { isSkillRef } from './list.js';
import { auditSkill } from './audit.js';
import { resolveSkillSource } from './resolve.js';
import { sparseCloneGitHub } from '../utils/download.js';
import { SKILL_FILE } from '../constants.js';

/** @typedef {import('../config/rc.js').A2ScaffoldRc} A2ScaffoldRc */

/**
 * Build and VCS artefacts that must never be copied into an installed skill.
 *
 * A source skill is a working directory, so it accumulates caches its own repo
 * gitignores. `fs.cpSync` copies what is on disk, not what is tracked, so
 * without this a `__pycache__` follows the skill into every project that
 * installs it — first noticed when `skill audit` flagged three `.pyc` files in
 * a skill whose repo ignores them.
 */
const EXCLUDED_NAMES = new Set([
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '__pycache__',
  '.pytest_cache',
  '.ruff_cache',
  '.mypy_cache',
  'node_modules',
  '.venv',
  'venv',
]);

/** Extensions of compiled artefacts, excluded wherever they appear. */
const EXCLUDED_EXTENSIONS = new Set(['.pyc', '.pyo', '.pyd']);

/**
 * Decide whether a path should be copied into the installed skill.
 *
 * Symbolic links never are. `fs.cpSync` does not dereference by default, so a
 * link is copied as a link and keeps pointing wherever it pointed — out of the
 * skill, and out of the project. A skill shipping `notes.md -> ~/.ssh/id_rsa`
 * then reads as an ordinary file to the agent told to open it. The audit
 * reports links as high-severity ({@link auditSkill}); dropping them here is
 * the half that holds even when someone passes `--force`.
 *
 * @param {string} src - Absolute source path offered by `fs.cpSync`
 * @returns {boolean} true to copy
 */
function isInstallable(src) {
  if (fs.lstatSync(src).isSymbolicLink()) return false;
  const name = path.basename(src);
  if (EXCLUDED_NAMES.has(name)) return false;
  return !EXCLUDED_EXTENSIONS.has(path.extname(name).toLowerCase());
}

/**
 * Install a skill into the target skills directory.
 *
 * Resolution order (see `resolveSkillSource`):
 *   1. Explicit local path / GitHub URL → use as-is
 *   2. `--from <registry>` → fetch from rc-defined registry
 *   3. Bare/nested name → built-in local pool (templates/skills/)
 *
 * Install destination preserves the *requested* path for bare names so
 * `skill add planning/master-plan` lands at `<target>/planning/master-plan/`.
 *
 * Skills fetched over the network are screened before they land (see
 * {@link auditSkill}); a high-severity finding aborts the install unless
 * `force` is set. Local installs are not screened — you already have the files.
 *
 * @param {string} source
 * @param {string} targetDir - Path to .agents/skills/ directory
 * @param {{ from?: string, rc?: A2ScaffoldRc, force?: boolean }} [options]
 * @returns {{ name: string, path: string, findings?: import('./audit.js').AuditFinding[] }}
 */
export function installSkill(source, targetDir, options = {}) {
  const rc = options.rc ?? {};
  const resolved = resolveSkillSource(source, { from: options.from, rc });

  // Decide destination name. For bare/nested names that hit the local
  // pool or a registry, preserve the request verbatim. For explicit
  // local paths / GitHub URLs, use the source basename (legacy behavior).
  const destName = isBareOrNested(source) ? source : null;

  if (resolved.type === 'local') {
    return installFromLocal(resolved.localPath, targetDir, {
      force: options.force,
      destName,
    });
  }

  return installFromGitHub(resolved, targetDir, {
    force: options.force,
    destName,
  });
}

/**
 * @param {string} source
 */
function isBareOrNested(source) {
  if (source.startsWith('./') || source.startsWith('../')) return false;
  if (source.startsWith('/')) return false;
  if (/^https?:\/\//.test(source)) return false;
  return true;
}

/**
 * @param {string} sourcePath
 * @param {string} targetDir
 * @param {{ force?: boolean, destName?: string | null }} options
 */
function installFromLocal(sourcePath, targetDir, options) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  // Validation follows a link; the copy filter drops it. A source whose
  // SKILL.md is a symlink therefore passed validation and installed as a
  // directory with no SKILL.md in it, reported as a success. The one file a
  // skill cannot be without has to be a real file, before anything else runs.
  const sourceSkillFile = path.join(sourcePath, SKILL_FILE);
  if (
    fs.existsSync(sourceSkillFile) &&
    fs.lstatSync(sourceSkillFile).isSymbolicLink()
  ) {
    throw new Error(
      `Source skill is invalid:\n  - ${SKILL_FILE} is a symbolic link; it must be a regular file`
    );
  }

  const preCheck = validateSkill(sourcePath);
  if (!preCheck.valid) {
    throw new Error(
      `Source skill is invalid:\n  - ${preCheck.errors.join('\n  - ')}`
    );
  }

  const skillName = options.destName ?? path.basename(sourcePath);
  const destPath = path.join(targetDir, skillName);

  if (fs.existsSync(destPath) && !options.force) {
    throw new Error(
      `Skill "${skillName}" already exists. Use --force to overwrite.`
    );
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  // Build the filtered copy beside the destination, check that what survived
  // the filter is still a skill, and only then swap it in. Staging next to the
  // destination keeps the final move a rename on one filesystem, so an
  // existing installation is replaced whole or not at all — never left as
  // the half of a copy that a failure got through.
  const staging = fs.mkdtempSync(
    path.join(path.dirname(destPath), '.a2scaffold-install-')
  );
  try {
    const staged = path.join(staging, path.basename(destPath));
    fs.cpSync(sourcePath, staged, { recursive: true, filter: isInstallable });

    // A skill-ref resolves its pointer relative to its own directory, so it
    // cannot be judged from the staging path; its source was already walked.
    const postCheck = isSkillRef(staged)
      ? { valid: fs.existsSync(path.join(staged, SKILL_FILE)), errors: [] }
      : validateSkill(staged);
    if (!postCheck.valid) {
      const detail = postCheck.errors.length
        ? `\n  - ${postCheck.errors.join('\n  - ')}`
        : '';
      throw new Error(
        `Skill "${skillName}" is not valid once excluded files are removed:${detail}`
      );
    }

    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true });
    }
    fs.renameSync(staged, destPath);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }

  return { name: skillName, path: destPath };
}

/**
 * Abort when a downloaded skill trips a high-severity audit finding.
 *
 * Skills run with the agent's full permissions, so an unreviewed one from a
 * registry is a supply-chain risk. `--force` is the explicit override.
 *
 * @param {string} skillDir
 * @param {{ force?: boolean }} options
 * @returns {import('./audit.js').AuditFinding[]}
 */
function screenRemoteSkill(skillDir, options) {
  const { findings } = auditSkill(skillDir);
  const high = findings.filter((f) => f.severity === 'high');

  if (high.length > 0 && !options.force) {
    const detail = high
      .map((f) => `  - [${f.file}${f.line ? `:${f.line}` : ''}] ${f.message}`)
      .join('\n');
    throw new Error(
      `Refusing to install: ${high.length} high-severity audit finding(s).\n${detail}\n\n` +
        'Skills run with your agent\u2019s full permissions. Review the source, then ' +
        're-run with --force if you trust it.'
    );
  }

  return findings;
}

/**
 * @param {{ owner: string, repo: string, skillPath?: string, ref?: string }} parsed
 * @param {string} targetDir
 * @param {{ force?: boolean, destName?: string | null }} options
 */
function installFromGitHub(parsed, targetDir, options) {
  const { owner, repo, skillPath, ref } = parsed;

  return sparseCloneGitHub(
    { owner, repo, ref, subPath: skillPath },
    (clonedSkillDir) => {
      const skillFile = path.join(clonedSkillDir, SKILL_FILE);
      if (!fs.existsSync(skillFile)) {
        const subs = fs.readdirSync(clonedSkillDir, { withFileTypes: true });
        const skillDirs = subs.filter(
          (s) =>
            s.isDirectory() &&
            fs.existsSync(path.join(clonedSkillDir, s.name, SKILL_FILE))
        );
        if (skillDirs.length > 0) {
          const names = skillDirs.map((s) => s.name).join(', ');
          throw new Error(
            `"${skillPath || repo}" contains multiple skills (${names}). ` +
              'Specify the full path to a single skill.'
          );
        }
        throw new Error(
          `No SKILL.md found at "${skillPath || '/'}" in ${owner}/${repo}`
        );
      }

      const findings = screenRemoteSkill(clonedSkillDir, options);
      const result = installFromLocal(clonedSkillDir, targetDir, options);
      return { ...result, findings };
    }
  );
}
