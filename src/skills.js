import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';

const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MAX_NAME_LEN = 64;
const MAX_DESC_LEN = 1024;
const MAX_COMPAT_LEN = 500;

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * Returns { frontmatter, body } or null if no frontmatter found.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const frontmatter = yaml.load(match[1]);
  const body = content.slice(match[0].length).trim();
  return { frontmatter: frontmatter || {}, body };
}

/**
 * Validate a skill directory against the agentskills.io spec.
 *
 * @param {string} skillDir - Path to the skill directory
 * @returns {{ valid: boolean, errors: string[], skill: object|null }}
 */
export function validateSkill(skillDir) {
  const errors = [];
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

  // Required: name
  if (!frontmatter.name) {
    errors.push('Missing required field: name');
  } else {
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
      errors.push(
        `name "${name}" does not match directory name "${dirName}"`
      );
    }
  }

  // Required: description
  if (!frontmatter.description) {
    errors.push('Missing required field: description');
  } else {
    const desc = String(frontmatter.description);
    if (desc.length > MAX_DESC_LEN) {
      errors.push(`description exceeds ${MAX_DESC_LEN} characters`);
    }
  }

  // Optional: compatibility
  if (
    frontmatter.compatibility &&
    String(frontmatter.compatibility).length > MAX_COMPAT_LEN
  ) {
    errors.push(`compatibility exceeds ${MAX_COMPAT_LEN} characters`);
  }

  const skill = errors.length === 0 ? frontmatter : null;
  return { valid: errors.length === 0, errors, skill };
}

/**
 * List installed skills in an .agents directory.
 *
 * @param {string} agentsDir - Path to .agents/ directory
 * @returns {Array<{ name: string, description: string, path: string }>}
 */
export function listSkills(agentsDir) {
  const skillsDir = path.join(agentsDir, 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillPath = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillFile)) continue;

    try {
      const content = fs.readFileSync(skillFile, 'utf8');
      const parsed = parseFrontmatter(content);
      if (parsed && parsed.frontmatter.name) {
        skills.push({
          name: parsed.frontmatter.name,
          description: parsed.frontmatter.description || '',
          path: skillPath,
        });
      }
    } catch {
      // Skip skills with unparseable SKILL.md
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Parse a skill source string into a structured object.
 *
 * Supported formats:
 *   - Local path: ./my-skill, ../my-skill, /absolute/path
 *   - GitHub shorthand: owner/repo, owner/repo/path/to/skill
 *   - GitHub URL: https://github.com/owner/repo/tree/ref/path
 *
 * @param {string} source - The skill source string
 * @returns {{ type: string, localPath?: string, owner?: string, repo?: string, skillPath?: string, ref?: string }}
 */
export function parseSkillSource(source) {
  // Local path
  if (
    source.startsWith('./') ||
    source.startsWith('../') ||
    source.startsWith('/')
  ) {
    return { type: 'local', localPath: path.resolve(source) };
  }

  // GitHub URL
  const urlMatch = source.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/
  );
  if (urlMatch) {
    return {
      type: 'github',
      owner: urlMatch[1],
      repo: urlMatch[2],
      ref: urlMatch[3],
      skillPath: urlMatch[4],
    };
  }

  // GitHub shorthand: owner/repo or owner/repo/sub/path
  const parts = source.split('/');
  if (parts.length >= 2 && !source.includes(':')) {
    return {
      type: 'github',
      owner: parts[0],
      repo: parts[1],
      skillPath: parts.slice(2).join('/') || '',
      ref: '',
    };
  }

  throw new Error(
    `Unable to parse skill source: "${source}". ` +
      'Expected a local path (./skill), GitHub shorthand (owner/repo/path), ' +
      'or GitHub URL (https://github.com/owner/repo/tree/ref/path).'
  );
}

/**
 * Install a skill from a source into the target skills directory.
 *
 * @param {string} source - Skill source string (local path or GitHub ref)
 * @param {string} targetDir - Path to .agents/skills/ directory
 * @param {{ force?: boolean }} [options={}]
 * @returns {{ name: string, path: string }}
 */
export function installSkill(source, targetDir, options = {}) {
  const parsed = parseSkillSource(source);

  if (parsed.type === 'local') {
    return installFromLocal(parsed.localPath, targetDir, options);
  }

  if (parsed.type === 'github') {
    return installFromGitHub(parsed, targetDir, options);
  }

  throw new Error(`Unsupported source type: ${parsed.type}`);
}

function installFromLocal(sourcePath, targetDir, options) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  // Validate before copying
  const preCheck = validateSkill(sourcePath);
  if (!preCheck.valid) {
    throw new Error(
      `Source skill is invalid:\n  - ${preCheck.errors.join('\n  - ')}`
    );
  }

  const skillName = path.basename(sourcePath);
  const destPath = path.join(targetDir, skillName);

  if (fs.existsSync(destPath) && !options.force) {
    throw new Error(
      `Skill "${skillName}" already exists. Use --force to overwrite.`
    );
  }

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true });
  }

  fs.cpSync(sourcePath, destPath, { recursive: true });

  return { name: skillName, path: destPath };
}

function installFromGitHub(parsed, targetDir, options) {
  const { owner, repo, skillPath, ref } = parsed;
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  // Create temp directory
  const tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'a2scaffold-skill-'));

  try {
    // Clone with sparse checkout
    const cloneArgs = ['clone', '--depth', '1', '--filter=blob:none', '--sparse'];
    if (ref) {
      cloneArgs.push('--branch', ref);
    }
    cloneArgs.push(repoUrl, tmpDir);

    execFileSync('git', cloneArgs, { stdio: 'pipe' });

    if (skillPath) {
      execFileSync('git', ['sparse-checkout', 'set', skillPath], {
        cwd: tmpDir,
        stdio: 'pipe',
      });
    }

    // Determine source directory within clone
    const clonedSkillDir = skillPath
      ? path.join(tmpDir, skillPath)
      : tmpDir;

    if (!fs.existsSync(clonedSkillDir)) {
      throw new Error(
        `Path "${skillPath}" not found in ${owner}/${repo}`
      );
    }

    // If the path points to a directory with SKILL.md, install it directly
    // If it points to a directory of skills, error with guidance
    const skillFile = path.join(clonedSkillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      // Check if subdirectories have SKILL.md
      const subs = fs.readdirSync(clonedSkillDir, { withFileTypes: true });
      const skillDirs = subs.filter(
        (s) =>
          s.isDirectory() &&
          fs.existsSync(path.join(clonedSkillDir, s.name, 'SKILL.md'))
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

    return installFromLocal(clonedSkillDir, targetDir, options);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
