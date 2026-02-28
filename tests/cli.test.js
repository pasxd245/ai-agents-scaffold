import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
    assert.ok(out.includes('--template'));
    assert.ok(out.includes('--output'));
    assert.ok(out.includes('--name'));
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
          [CLI_PATH, '--template', 'nonexistent', '-o', '/tmp/bad-test'],
          { encoding: 'utf8' }
        ),
      /Template "nonexistent" not found/
    );
  });
});
