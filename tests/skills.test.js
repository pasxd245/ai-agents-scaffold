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
  isSkillRef,
  discoverSkills,
  installSkillRef,
} from '../src/skills.js';
import yaml from 'js-yaml';

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

// ── isSkillRef ─────────────────────────────────────────────────────

describe('isSkillRef', () => {
  it('returns false for a regular skill', () => {
    const result = isSkillRef(path.join(FIXTURES, 'valid-skill'));
    assert.equal(result.isRef, false);
    assert.equal(result.content, null);
  });

  it('returns true for a skill-ref', () => {
    const result = isSkillRef(path.join(FIXTURES, 'skill-ref-skill'));
    assert.equal(result.isRef, true);
    assert.ok(result.content);
    assert.ok(result.content.includes('type: skill-ref'));
  });

  it('returns false when SKILL.md is missing', () => {
    const result = isSkillRef(path.join(FIXTURES, 'base-output'));
    assert.equal(result.isRef, false);
    assert.equal(result.content, null);
  });

  it('returns false when no frontmatter', () => {
    const result = isSkillRef(path.join(FIXTURES, 'no-frontmatter-skill'));
    assert.equal(result.isRef, false);
    assert.equal(result.content, null);
  });
});

// ── discoverSkills ─────────────────────────────────────────────────

describe('discoverSkills', () => {
  it('discovers skills in an agents directory', () => {
    const tmpAgents = path.join(FIXTURES, '_tmp-discover');
    const skillA = path.join(tmpAgents, 'skills', 'skill-a');
    const skillB = path.join(tmpAgents, 'skills', 'skill-b');
    fs.mkdirSync(skillA, { recursive: true });
    fs.mkdirSync(skillB, { recursive: true });
    fs.writeFileSync(
      path.join(skillA, 'SKILL.md'),
      '---\nname: skill-a\ndescription: A.\n---\n'
    );
    fs.writeFileSync(
      path.join(skillB, 'SKILL.md'),
      '---\nname: skill-b\ndescription: B.\n---\n'
    );

    try {
      const skills = discoverSkills(tmpAgents);
      assert.equal(skills.length, 2);
      assert.equal(skills[0].name, 'skill-a');
      assert.equal(skills[1].name, 'skill-b');
      assert.ok(skills[0].skillDir.endsWith('skill-a'));
    } finally {
      fs.rmSync(tmpAgents, { recursive: true });
    }
  });

  it('returns empty array when no skills directory', () => {
    const skills = discoverSkills('/tmp/nonexistent-agents');
    assert.equal(skills.length, 0);
  });

  it('returns empty array for empty skills directory', () => {
    const tmpAgents = path.join(FIXTURES, '_tmp-discover-empty');
    fs.mkdirSync(path.join(tmpAgents, 'skills'), { recursive: true });

    try {
      const skills = discoverSkills(tmpAgents);
      assert.equal(skills.length, 0);
    } finally {
      fs.rmSync(tmpAgents, { recursive: true });
    }
  });
});

// ── installSkillRef ────────────────────────────────────────────────

describe('installSkillRef', () => {
  let tmpFrom;
  let tmpTo;

  beforeEach(() => {
    tmpFrom = fs.mkdtempSync(path.join(FIXTURES, '_tmp-ref-from-'));
    tmpTo = fs.mkdtempSync(path.join(FIXTURES, '_tmp-ref-to-'));

    // Create a valid skill in the source agents dir
    const skillDir = path.join(tmpFrom, 'skills', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: test-skill\ndescription: A test skill.\n---\n\n## Procedure\n1. Do it\n'
    );
  });

  afterEach(() => {
    fs.rmSync(tmpFrom, { recursive: true, force: true });
    fs.rmSync(tmpTo, { recursive: true, force: true });
  });

  it('creates a single skill ref', async () => {
    const results = await installSkillRef({
      from: tmpFrom,
      to: tmpTo,
      skill: 'test-skill',
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].name, 'test-skill');

    const output = fs.readFileSync(
      path.join(tmpTo, 'skills', 'test-skill', 'SKILL.md'), 'utf8'
    );
    assert.ok(output.includes('name: test-skill'));
    assert.ok(output.includes('type: skill-ref'));
    assert.ok(output.includes('rootPath:'));
    assert.ok(output.includes('@rootPath/'));
  });

  it('creates refs for all skills with --skill all', async () => {
    // Add a second skill
    const skillDir = path.join(tmpFrom, 'skills', 'another-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: another-skill\ndescription: Another.\n---\n'
    );

    const results = await installSkillRef({
      from: tmpFrom,
      to: tmpTo,
      skill: 'all',
    });

    assert.equal(results.length, 2);
    const names = results.map((r) => r.name).sort((a, b) => a.localeCompare(b));
    assert.deepEqual(names, ['another-skill', 'test-skill']);
  });

  it('copies skill-ref source verbatim', async () => {
    // Replace source skill with a skill-ref
    const refDir = path.join(tmpFrom, 'skills', 'ref-skill');
    fs.mkdirSync(refDir, { recursive: true });
    const refContent =
      '---\nname: ref-skill\nmetadata:\n  type: skill-ref\n  rootPath: ../../..\n---\n\n# Refer to Skill Details at:\n\n@rootPath/.agents/skills/ref-skill/SKILL.md\n';
    fs.writeFileSync(path.join(refDir, 'SKILL.md'), refContent);

    const results = await installSkillRef({
      from: tmpFrom,
      to: tmpTo,
      skill: 'ref-skill',
    });

    assert.equal(results.length, 1);
    const output = fs.readFileSync(
      path.join(tmpTo, 'skills', 'ref-skill', 'SKILL.md'), 'utf8'
    );
    assert.equal(output, refContent);
  });

  it('errors when from === to', async () => {
    await assert.rejects(
      () => installSkillRef({ from: tmpFrom, to: tmpFrom, skill: 'test-skill' }),
      /must differ/
    );
  });

  it('errors when dest has a real skill', async () => {
    // Create a real skill at dest
    const destSkill = path.join(tmpTo, 'skills', 'test-skill');
    fs.mkdirSync(destSkill, { recursive: true });
    fs.writeFileSync(
      path.join(destSkill, 'SKILL.md'),
      '---\nname: test-skill\ndescription: Real.\n---\n'
    );

    await assert.rejects(
      () => installSkillRef({ from: tmpFrom, to: tmpTo, skill: 'test-skill', force: true }),
      /Cannot overwrite real skill/
    );
  });

  it('errors when dest has existing ref without --force', async () => {
    // First install
    await installSkillRef({ from: tmpFrom, to: tmpTo, skill: 'test-skill' });

    // Second install without force
    await assert.rejects(
      () => installSkillRef({ from: tmpFrom, to: tmpTo, skill: 'test-skill' }),
      /already exists/
    );
  });

  it('overwrites existing ref with --force', async () => {
    await installSkillRef({ from: tmpFrom, to: tmpTo, skill: 'test-skill' });

    const results = await installSkillRef({
      from: tmpFrom,
      to: tmpTo,
      skill: 'test-skill',
      force: true,
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].name, 'test-skill');
  });

  it('errors when source skill does not exist', async () => {
    await assert.rejects(
      () => installSkillRef({ from: tmpFrom, to: tmpTo, skill: 'nonexistent' }),
      /not found/
    );
  });

  it('computes correct rootPath', async () => {
    await installSkillRef({ from: tmpFrom, to: tmpTo, skill: 'test-skill' });

    const output = fs.readFileSync(
      path.join(tmpTo, 'skills', 'test-skill', 'SKILL.md'), 'utf8'
    );
    const match = output.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const frontmatter = yaml.load(match[1]);

    // rootPath should be a relative path from dest skill dir to source parent
    const destSkillDir = path.join(tmpTo, 'skills', 'test-skill');
    const sourceRoot = path.resolve(tmpFrom, '..');
    const expected = path.relative(destSkillDir, sourceRoot);

    assert.equal(frontmatter.metadata.rootPath, expected);
  });

  it('errors when no skills found with --skill all', async () => {
    const emptyFrom = fs.mkdtempSync(path.join(FIXTURES, '_tmp-ref-empty-'));
    fs.mkdirSync(path.join(emptyFrom, 'skills'), { recursive: true });

    try {
      await assert.rejects(
        () => installSkillRef({ from: emptyFrom, to: tmpTo, skill: 'all' }),
        /No skills found/
      );
    } finally {
      fs.rmSync(emptyFrom, { recursive: true, force: true });
    }
  });
});
