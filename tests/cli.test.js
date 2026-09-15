import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', 'bin', 'a2scaffold');

describe('CLI', () => {
  it('--help shows usage information', () => {
    const out = execFileSync('node', [CLI_PATH, '--help'], {
      encoding: 'utf8',
    });
    assert.ok(out.includes('a2scaffold'));
    assert.ok(out.includes('--use'));
    assert.ok(out.includes('--output'));
    assert.ok(out.includes('--name'));
  });

  it('--help includes skill commands', () => {
    const out = execFileSync('node', [CLI_PATH, '--help'], {
      encoding: 'utf8',
    });
    assert.ok(out.includes('skill add'));
    assert.ok(out.includes('skill list'));
    assert.ok(out.includes('skill validate'));
  });

  it('--version shows version', () => {
    const out = execFileSync('node', [CLI_PATH, '--version'], {
      encoding: 'utf8',
    });
    assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('--list shows available templates', () => {
    const out = execFileSync('node', [CLI_PATH, '--list'], {
      encoding: 'utf8',
    });
    assert.ok(out.includes('base'));
  });

  it('--dry-run lists files without writing', () => {
    const out = execFileSync(
      'node',
      [CLI_PATH, '--dry-run', '-o', '/tmp/dry-run-test', '-n', 'TestProject'],
      { encoding: 'utf8' }
    );
    assert.ok(out.includes('Dry run'));
    assert.ok(out.includes('AGENTS.md'));
    assert.ok(out.includes('.agents/context/.gitkeep'));
  });

  it('invalid template exits with error', () => {
    assert.throws(
      () =>
        execFileSync(
          'node',
          [CLI_PATH, '--use', 'nonexistent', '-o', '/tmp/bad-test'],
          { encoding: 'utf8' }
        ),
      /Template "scaffold\/nonexistent" not found/
    );
  });
});

describe('CLI skill commands', () => {
  let tmpAgents;

  beforeEach(() => {
    tmpAgents = fs.mkdtempSync('/tmp/a2scaffold-cli-skill-');
  });

  afterEach(() => {
    fs.rmSync(tmpAgents, { recursive: true, force: true });
  });

  it('skill list shows empty message', () => {
    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'list', '-d', tmpAgents],
      { encoding: 'utf8' }
    );
    assert.ok(out.includes('No skills installed'));
  });

  it('skill add installs from local path', () => {
    const source = path.join(__dirname, 'fixtures', 'valid-skill');
    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'add', source, '-d', tmpAgents],
      { encoding: 'utf8' }
    );
    assert.ok(out.includes('Installed skill'));
    assert.ok(
      fs.existsSync(path.join(tmpAgents, 'skills', 'valid-skill', 'SKILL.md'))
    );
  });

  it('skill list shows installed skill', () => {
    const source = path.join(__dirname, 'fixtures', 'valid-skill');
    execFileSync('node', [CLI_PATH, 'skill', 'add', source, '-d', tmpAgents], {
      encoding: 'utf8',
    });

    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'list', '-d', tmpAgents],
      { encoding: 'utf8' }
    );
    assert.ok(out.includes('valid-skill'));
  });

  it('skill validate passes for valid skill', () => {
    const source = path.join(__dirname, 'fixtures', 'valid-skill');
    execFileSync('node', [CLI_PATH, 'skill', 'add', source, '-d', tmpAgents], {
      encoding: 'utf8',
    });

    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'validate', '-d', tmpAgents],
      { encoding: 'utf8' }
    );
    assert.ok(out.includes('valid'));
  });

  it('skill add fails without source', () => {
    assert.throws(
      () =>
        execFileSync('node', [CLI_PATH, 'skill', 'add', '-d', tmpAgents], {
          encoding: 'utf8',
        }),
      /skill add requires a source/
    );
  });

  it('skill add fails for invalid skill', () => {
    const source = path.join(__dirname, 'fixtures', 'invalid-skill');
    assert.throws(
      () =>
        execFileSync(
          'node',
          [CLI_PATH, 'skill', 'add', source, '-d', tmpAgents],
          { encoding: 'utf8' }
        ),
      /Source skill is invalid/
    );
  });
});

describe('CLI skill commands (nested skills)', () => {
  // `skill add group/name` is a documented form, and `skill list` recursed
  // while `validate` and `audit` did not: they read one level, found a
  // group directory with no SKILL.md, and reported the group as a broken
  // skill — a high-severity audit finding for a skill that was fine.
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2s-nested-'));
    const skillDir = path.join(tmpDir, '.agents', 'skills', 'planning', 'deep');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      [
        '---',
        'name: deep',
        'description: Use when checking that a nested skill is discovered by ' +
          'the validate and audit commands rather than being reported as a ' +
          'directory that is missing its SKILL.md file entirely.',
        '---',
        '',
        '## Trigger',
        '',
        'When a nested skill needs validating.',
        '',
      ].join('\n')
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('validates a nested skill under its full name', () => {
    const out = execFileSync(
      'node',
      [
        CLI_PATH,
        'skill',
        'validate',
        '--agents-dir',
        path.join(tmpDir, '.agents'),
      ],
      { encoding: 'utf8' }
    );
    assert.match(out, /planning\/deep/);
    assert.ok(!out.includes('SKILL.md not found'), out);
  });

  it('audits a nested skill instead of flagging its parent directory', () => {
    const out = execFileSync(
      'node',
      [
        CLI_PATH,
        'skill',
        'audit',
        '--agents-dir',
        path.join(tmpDir, '.agents'),
      ],
      { encoding: 'utf8' }
    );
    assert.match(out, /planning\/deep/);
    assert.ok(!out.includes('not a skill directory'), out);
  });
});

describe('CLI skill commands (skills/ outside .agents)', () => {
  // Some repos keep their skills at `<root>/skills/` with no `.agents/` at
  // all. Every skill command reads `<dir>/skills/`, so `-d <root>` covers that
  // layout without moving anything. This pins it as a contract rather than an
  // accident of how the path is joined.
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2s-root-skills-'));
    const skillDir = path.join(tmpDir, 'skills', 'demo');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.copyFileSync(
      path.join(__dirname, 'fixtures', 'valid-skill', 'SKILL.md'),
      path.join(skillDir, 'SKILL.md')
    );
    // The fixture is named for its own directory; rename it for this one.
    const file = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(
      file,
      fs.readFileSync(file, 'utf8').replace('name: valid-skill', 'name: demo')
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('validates skills kept at the repo root via -d <root>', () => {
    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'validate', '-d', tmpDir],
      { encoding: 'utf8' }
    );
    assert.match(out, /demo \[skill\] — valid/);
  });

  it('audits skills kept at the repo root via -d <root>', () => {
    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'audit', '-d', tmpDir],
      {
        encoding: 'utf8',
      }
    );
    assert.match(out, /demo/);
    assert.ok(!out.includes('No skills directory found'), out);
  });
});
