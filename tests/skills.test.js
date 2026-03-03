import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateSkill,
  listSkills,
  parseSkillSource,
  installSkill,
} from '../src/skills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

// ── validateSkill ───────────────────────────────────────────────────

describe('validateSkill', () => {
  it('accepts a valid skill', () => {
    const result = validateSkill(path.join(FIXTURES, 'valid-skill'));
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.skill.name, 'valid-skill');
    assert.ok(result.skill.description.length > 0);
  });

  it('rejects when SKILL.md is missing', () => {
    const result = validateSkill(path.join(FIXTURES, 'base-output'));
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('SKILL.md not found')));
  });

  it('rejects when frontmatter is missing', () => {
    const result = validateSkill(
      path.join(FIXTURES, 'no-frontmatter-skill')
    );
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('no YAML frontmatter')));
  });

  it('rejects invalid name (uppercase, empty description)', () => {
    const result = validateSkill(path.join(FIXTURES, 'invalid-skill'));
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes('lowercase alphanumeric'))
    );
    assert.ok(
      result.errors.some((e) => e.includes('description'))
    );
  });

  it('rejects name that does not match directory name', () => {
    // valid-skill has name: "valid-skill" — check from a renamed dir
    const tmpDir = path.join(FIXTURES, '_tmp-mismatch-skill');
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'SKILL.md'),
      '---\nname: other-name\ndescription: Test.\n---\n'
    );

    try {
      const result = validateSkill(tmpDir);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes('does not match directory'))
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('rejects name with consecutive hyphens', () => {
    const tmpDir = path.join(FIXTURES, '_tmp-bad--name');
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'SKILL.md'),
      '---\nname: bad--name\ndescription: Test.\n---\n'
    );

    try {
      const result = validateSkill(tmpDir);
      assert.equal(result.valid, false);
      assert.ok(
        result.errors.some((e) => e.includes('consecutive hyphens'))
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

// ── listSkills ──────────────────────────────────────────────────────

describe('listSkills', () => {
  it('lists skills from a directory', () => {
    // Create a temporary agents dir with one skill
    const tmpAgents = path.join(FIXTURES, '_tmp-agents');
    const skillDir = path.join(tmpAgents, 'skills', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: test-skill\ndescription: A test.\n---\n'
    );

    try {
      const skills = listSkills(tmpAgents);
      assert.equal(skills.length, 1);
      assert.equal(skills[0].name, 'test-skill');
      assert.equal(skills[0].description, 'A test.');
    } finally {
      fs.rmSync(tmpAgents, { recursive: true });
    }
  });

  it('returns empty array for empty skills directory', () => {
    const tmpAgents = path.join(FIXTURES, '_tmp-agents-empty');
    fs.mkdirSync(path.join(tmpAgents, 'skills'), { recursive: true });

    try {
      const skills = listSkills(tmpAgents);
      assert.equal(skills.length, 0);
    } finally {
      fs.rmSync(tmpAgents, { recursive: true });
    }
  });

  it('returns empty array when skills directory does not exist', () => {
    const skills = listSkills('/tmp/nonexistent-agents-dir');
    assert.equal(skills.length, 0);
  });

  it('skips directories without SKILL.md', () => {
    const tmpAgents = path.join(FIXTURES, '_tmp-agents-skip');
    fs.mkdirSync(path.join(tmpAgents, 'skills', 'no-skill'), {
      recursive: true,
    });

    try {
      const skills = listSkills(tmpAgents);
      assert.equal(skills.length, 0);
    } finally {
      fs.rmSync(tmpAgents, { recursive: true });
    }
  });
});

// ── parseSkillSource ────────────────────────────────────────────────

describe('parseSkillSource', () => {
  it('parses relative local path', () => {
    const result = parseSkillSource('./my-skill');
    assert.equal(result.type, 'local');
    assert.ok(result.localPath.endsWith('my-skill'));
  });

  it('parses parent-relative local path', () => {
    const result = parseSkillSource('../my-skill');
    assert.equal(result.type, 'local');
    assert.ok(result.localPath.includes('my-skill'));
  });

  it('parses absolute local path', () => {
    const result = parseSkillSource('/tmp/my-skill');
    assert.equal(result.type, 'local');
    assert.equal(result.localPath, '/tmp/my-skill');
  });

  it('parses GitHub shorthand (owner/repo)', () => {
    const result = parseSkillSource('anthropics/skills');
    assert.equal(result.type, 'github');
    assert.equal(result.owner, 'anthropics');
    assert.equal(result.repo, 'skills');
    assert.equal(result.skillPath, '');
  });

  it('parses GitHub shorthand with subpath', () => {
    const result = parseSkillSource('anthropics/skills/code-review');
    assert.equal(result.type, 'github');
    assert.equal(result.owner, 'anthropics');
    assert.equal(result.repo, 'skills');
    assert.equal(result.skillPath, 'code-review');
  });

  it('parses GitHub URL with tree/ref/path', () => {
    const result = parseSkillSource(
      'https://github.com/anthropics/skills/tree/main/code-review'
    );
    assert.equal(result.type, 'github');
    assert.equal(result.owner, 'anthropics');
    assert.equal(result.repo, 'skills');
    assert.equal(result.ref, 'main');
    assert.equal(result.skillPath, 'code-review');
  });

  it('throws for unparseable source', () => {
    assert.throws(() => parseSkillSource('just-a-word'), /Unable to parse/);
  });
});

// ── installSkill (local) ────────────────────────────────────────────

describe('installSkill (local)', () => {
  let tmpTarget;

  beforeEach(() => {
    tmpTarget = fs.mkdtempSync(path.join(FIXTURES, '_tmp-install-'));
  });

  afterEach(() => {
    fs.rmSync(tmpTarget, { recursive: true, force: true });
  });

  it('installs a valid skill from local path', () => {
    const source = path.join(FIXTURES, 'valid-skill');
    const result = installSkill(source, tmpTarget);

    assert.equal(result.name, 'valid-skill');
    assert.ok(fs.existsSync(path.join(tmpTarget, 'valid-skill', 'SKILL.md')));
  });

  it('fails when skill already exists without --force', () => {
    const source = path.join(FIXTURES, 'valid-skill');
    installSkill(source, tmpTarget);

    assert.throws(
      () => installSkill(source, tmpTarget),
      /already exists/
    );
  });

  it('overwrites with force option', () => {
    const source = path.join(FIXTURES, 'valid-skill');
    installSkill(source, tmpTarget);
    const result = installSkill(source, tmpTarget, { force: true });

    assert.equal(result.name, 'valid-skill');
    assert.ok(fs.existsSync(path.join(tmpTarget, 'valid-skill', 'SKILL.md')));
  });

  it('fails when source does not exist', () => {
    assert.throws(
      () => installSkill('/tmp/nonexistent-skill-path', tmpTarget),
      /does not exist/
    );
  });

  it('fails when source skill is invalid', () => {
    const source = path.join(FIXTURES, 'invalid-skill');
    assert.throws(
      () => installSkill(source, tmpTarget),
      /Source skill is invalid/
    );
  });
});
