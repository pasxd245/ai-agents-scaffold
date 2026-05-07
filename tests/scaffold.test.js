import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffold } from '../src/scaffold/index.js';

describe('scaffold base template', () => {
  let tmpDir;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'));
    await scaffold({
      templateName: 'scaffold/base',
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
    assert.ok(fs.existsSync(path.join(tmpDir, '.agents', 'plan', 'PDCA.md')));
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
    const content = fs.readFileSync(
      path.join(tmpDir, '.agents', 'AGENTS.md'),
      'utf8'
    );
    assert.ok(content.includes('Pair Programming Guide'));
    assert.ok(content.includes('.agents/'));
  });
});

describe('scaffold with optional values', () => {
  let templatesRoot;

  before(async () => {
    const { resolveTemplatePath } = await import('../src/templates/index.js');
    const baseDir = resolveTemplatePath('scaffold/base').templateDir;
    templatesRoot = path.dirname(path.dirname(baseDir));
  });

  it('renders a template with no values.yaml and no values/ dir', async () => {
    const tplDir = fs.mkdtempSync(path.join(templatesRoot, 'noval-'));
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'noval-out-'));
    try {
      fs.mkdirSync(path.join(tplDir, 'template'));
      fs.writeFileSync(
        path.join(tplDir, 'template', 'README.md.hbs'),
        'static content\n'
      );

      await scaffold({
        templateName: `scaffold/${path.basename(tplDir)}`,
        outputDir: outDir,
      });

      assert.equal(
        fs.readFileSync(path.join(outDir, 'README.md'), 'utf8'),
        'static content\n'
      );
    } finally {
      fs.rmSync(tplDir, { recursive: true, force: true });
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('loads values from a values/ directory (value partials)', async () => {
    const tplDir = fs.mkdtempSync(path.join(templatesRoot, 'valdir-'));
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valdir-out-'));
    try {
      fs.mkdirSync(path.join(tplDir, 'template'));
      fs.mkdirSync(path.join(tplDir, 'values'));
      fs.writeFileSync(
        path.join(tplDir, 'values', 'project.yaml'),
        'name: from-values-dir\n'
      );
      fs.writeFileSync(
        path.join(tplDir, 'template', 'README.md.hbs'),
        'project: {{project.name}}\n'
      );

      await scaffold({
        templateName: `scaffold/${path.basename(tplDir)}`,
        outputDir: outDir,
      });

      assert.equal(
        fs.readFileSync(path.join(outDir, 'README.md'), 'utf8'),
        'project: from-values-dir\n'
      );
    } finally {
      fs.rmSync(tplDir, { recursive: true, force: true });
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });
});
