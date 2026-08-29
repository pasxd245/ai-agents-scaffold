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

  it('generates the root AGENTS.md stub', () => {
    assert.ok(fs.existsSync(path.join(tmpDir, 'AGENTS.md')));
  });

  it('points every importing stub straight at .agents/AGENTS.md', () => {
    for (const stub of ['CLAUDE.md', 'AGENTS.md']) {
      const body = fs.readFileSync(path.join(tmpDir, stub), 'utf8');
      const imports = [...body.matchAll(/^@(\S+)$/gm)].map((m) => m[1]);
      assert.deepEqual(imports, ['.agents/AGENTS.md'], `${stub} import target`);
      assert.ok(fs.existsSync(path.join(tmpDir, imports[0])));
    }
  });

  it('keeps the stubs independent of one another', () => {
    // No stub may import another stub: each reaches the KB in one hop.
    const claudeMd = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.doesNotMatch(claudeMd, /^@AGENTS\.md$/m);
  });

  it('restates (does not @-import) for harnesses without import support', () => {
    const copilotMd = fs.readFileSync(
      path.join(tmpDir, '.github', 'copilot-instructions.md'),
      'utf8'
    );
    assert.match(copilotMd, /\[AGENTS\.md\]\(\.\.\/\.agents\/AGENTS\.md\)/);
    assert.doesNotMatch(copilotMd, /^@/m);
  });

  it('keeps .agents/ root free of loose docs', () => {
    // Only AGENTS.md sits at the root: it is the one file loaded every
    // session. Everything else lives behind a trigger in reference/.
    const loose = fs
      .readdirSync(path.join(tmpDir, '.agents'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);
    assert.deepEqual(loose, ['AGENTS.md']);
  });

  it('keeps the knowledge base under its 100-line budget', () => {
    // .agents/AGENTS.md is imported into every session by every stub, so it
    // is the most expensive file in the scaffold. Detail belongs behind a
    // trigger in reference/ or governance.md.
    const lines = fs
      .readFileSync(path.join(tmpDir, '.agents', 'AGENTS.md'), 'utf8')
      .split('\n').length;
    assert.ok(lines < 100, `.agents/AGENTS.md is ${lines} lines, over budget`);
  });

  it('keeps every harness stub under the 200-line budget', () => {
    // Imports load at launch and count in full against the context window.
    for (const rel of [
      'CLAUDE.md',
      'AGENTS.md',
      '.github/copilot-instructions.md',
    ]) {
      const lines = fs
        .readFileSync(path.join(tmpDir, rel), 'utf8')
        .split('\n').length;
      assert.ok(lines < 200, `${rel} is ${lines} lines, over budget`);
    }
  });

  it('generates the on-demand reference docs', () => {
    for (const name of [
      'root-files.md',
      'mechanisms.md',
      'skills.md',
      'docs-agents.md',
      'memory-and-promotion.md',
    ]) {
      assert.ok(
        fs.existsSync(path.join(tmpDir, '.agents', 'reference', name)),
        `missing .agents/reference/${name}`
      );
    }
  });

  it('gives every reference doc an explicit trigger', () => {
    // A doc that is not auto-loaded is useless unless it says when to read it.
    const dir = path.join(tmpDir, '.agents', 'reference');
    for (const name of fs.readdirSync(dir)) {
      const body = fs.readFileSync(path.join(dir, name), 'utf8');
      assert.match(body, /\*\*Read this when\*\*/, `${name} has no trigger`);
    }
  });

  it('emits permission rules that back the authority table', () => {
    const raw = fs.readFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      'utf8'
    );
    const settings = JSON.parse(raw);
    const ask = settings.permissions.ask;
    for (const dir of ['context', 'prompts', 'reference', 'skills', 'plan']) {
      assert.ok(
        ask.includes(`Edit(/.agents/${dir}/**)`),
        `missing ask rule for .agents/${dir}/`
      );
    }
    // Claude Code only consults Edit() rules for file paths; Write() rules are
    // accepted and silently ignored.
    assert.ok(!ask.some((r) => r.startsWith('Write(')));
  });

  it('generates .agents/context/philosophy.md', () => {
    assert.ok(
      fs.existsSync(path.join(tmpDir, '.agents', 'context', 'philosophy.md'))
    );
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

  it('AGENTS.md carries the load order, authority and write policy', () => {
    // Assert the contract, not the wording: these three sections are what a
    // cold-start agent needs and what the rest of .agents/ hangs off.
    const content = fs.readFileSync(
      path.join(tmpDir, '.agents', 'AGENTS.md'),
      'utf8'
    );
    assert.match(content, /^## Load first$/m);
    assert.match(content, /^## Authority$/m);
    assert.match(content, /^## Write policy$/m);
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
