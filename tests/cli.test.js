import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', 'bin', 'cli.js');

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
      /Template "nonexistent" not found/
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
    execFileSync(
      'node',
      [CLI_PATH, 'skill', 'add', source, '-d', tmpAgents],
      { encoding: 'utf8' }
    );

    const out = execFileSync(
      'node',
      [CLI_PATH, 'skill', 'list', '-d', tmpAgents],
      { encoding: 'utf8' }
    );
    assert.ok(out.includes('valid-skill'));
  });

  it('skill validate passes for valid skill', () => {
    const source = path.join(__dirname, 'fixtures', 'valid-skill');
    execFileSync(
      'node',
      [CLI_PATH, 'skill', 'add', source, '-d', tmpAgents],
      { encoding: 'utf8' }
    );

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
        execFileSync(
          'node',
          [CLI_PATH, 'skill', 'add', '-d', tmpAgents],
          { encoding: 'utf8' }
        ),
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
