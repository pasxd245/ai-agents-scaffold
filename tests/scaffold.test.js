import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffold } from '../src/scaffold.js';

describe('scaffold base template', () => {
  let tmpDir;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'));
    await scaffold({
      templateName: 'base',
      outputDir: tmpDir,
      overrides: { project: { name: 'test-project' } },
    });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates .agents/AGENTS.md', () => {
    assert.ok(fs.existsSync(path.join(tmpDir, '.agents', 'AGENTS.md')));
  });

  it('generates .agents/ directory structure', () => {
    const dirs = [
      'context',
      'memory',
      'prompts',
      'skills',
      'plan',
      'plan/cycles',
    ];
    for (const dir of dirs) {
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.agents', dir)),
        `Missing directory: .agents/${dir}`
      );
    }
  });

  it('generates .claude/CLAUDE.md', () => {
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'CLAUDE.md')));
  });

  it('generates .github/copilot-instructions.md', () => {
    assert.ok(
      fs.existsSync(path.join(tmpDir, '.github', 'copilot-instructions.md'))
    );
  });

  it('generates .agents/plan/PDCA.md', () => {
    assert.ok(
      fs.existsSync(path.join(tmpDir, '.agents', 'plan', 'PDCA.md'))
    );
  });

  it('generates .agents/plan/promotions.md', () => {
    assert.ok(
      fs.existsSync(path.join(tmpDir, '.agents', 'plan', 'promotions.md'))
    );
  });

  it('generates empty .gitkeep files', () => {
    const gitkeeps = [
      '.agents/context/.gitkeep',
      '.agents/memory/.gitkeep',
      '.agents/prompts/.gitkeep',
      '.agents/skills/.gitkeep',
      '.agents/plan/cycles/.gitkeep',
    ];
    for (const gk of gitkeeps) {
      const fullPath = path.join(tmpDir, gk);
      assert.ok(fs.existsSync(fullPath), `Missing: ${gk}`);
      assert.equal(
        fs.readFileSync(fullPath, 'utf8'),
        '',
        `${gk} should be empty`
      );
    }
  });

  it('does NOT generate README.md', () => {
    assert.ok(!fs.existsSync(path.join(tmpDir, 'README.md')));
  });

  it('AGENTS.md contains expected content', () => {
    const content = fs.readFileSync(path.join(tmpDir, '.agents', 'AGENTS.md'), 'utf8');
    assert.ok(content.includes('Pair Programming Guide'));
    assert.ok(content.includes('.agents/'));
  });
});
