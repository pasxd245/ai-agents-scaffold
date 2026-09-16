import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

  it('does not claim a guardrail it was told not to generate', async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-noguard-'));
    try {
      await scaffold({
        templateName: 'scaffold/base',
        outputDir: outDir,
        overrides: { guardrails: { claude: false } },
      });
      assert.ok(!fs.existsSync(path.join(outDir, '.claude')));
      const kb = fs.readFileSync(
        path.join(outDir, '.agents/AGENTS.md'),
        'utf8'
      );
      const hb = fs.readFileSync(
        path.join(outDir, '.agents/context/harness-behaviour.md'),
        'utf8'
      );
      // Both files used to state the settings file ships regardless.
      assert.ok(!kb.includes('makes it **ask**'), kb);
      assert.ok(kb.includes('generates none'), kb);
      assert.ok(!hb.includes('Shipped. Interactive only'), hb);
      assert.ok(hb.includes('Not generated'), hb);
      assert.ok(kb.split('\n').length < 100, 'budget holds with the flag off');
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
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

  it('does not ship a policy for docs/agents/, which it never creates', () => {
    // The scaffold has no opinion it can enforce about a directory outside
    // .agents/. Shipping one charged every repo ~50 lines for a convention
    // that may not apply. It is a recommendation in docs/usage.md instead.
    assert.equal(
      fs.existsSync(
        path.join(tmpDir, '.agents', 'reference', 'docs-agents.md')
      ),
      false
    );
    const kb = fs.readFileSync(
      path.join(tmpDir, '.agents', 'AGENTS.md'),
      'utf8'
    );
    assert.ok(!kb.includes('docs-agents.md'));
  });

  it('generates the on-demand reference docs', () => {
    for (const name of [
      'root-files.md',
      'mechanisms.md',
      'skills.md',
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

  it('generates the memory-placement rule and a memory template', () => {
    // Two memory systems exist the moment a harness with its own memory is
    // used; without this the scaffold leaves the user to discover the clash.
    assert.ok(
      fs.existsSync(
        path.join(tmpDir, '.agents', 'context', 'memory-placement.md')
      )
    );
    assert.ok(
      fs.existsSync(path.join(tmpDir, '.agents', 'memory', '_TEMPLATE.md'))
    );
  });

  it('keeps the memory format in one place', () => {
    // _TEMPLATE.md is copyable and therefore authoritative; the reference doc
    // must point at it rather than restate it.
    const ref = fs.readFileSync(
      path.join(tmpDir, '.agents', 'reference', 'memory-and-promotion.md'),
      'utf8'
    );
    assert.match(ref, /_TEMPLATE\.md/);
    assert.doesNotMatch(ref, /^\*\*Confidence\*\*/m);
  });

  it('dates the harness-behaviour facts', () => {
    // Provider behaviour changes without notice, so the file has to say when
    // it was last checked or it becomes confidently wrong.
    const body = fs.readFileSync(
      path.join(tmpDir, '.agents', 'context', 'harness-behaviour.md'),
      'utf8'
    );
    assert.match(body, /\*\*Last verified\*\*: \d{4}-\d{2}-\d{2}/);
  });

  it('gives memory entries a staleness field', () => {
    const tpl = fs.readFileSync(
      path.join(tmpDir, '.agents', 'memory', '_TEMPLATE.md'),
      'utf8'
    );
    assert.match(tpl, /\*\*Review-by\*\*/);
    assert.match(tpl, /\*\*Source\*\*/);
  });

  it('specifies round numbering that survives round 100', () => {
    const pdca = fs.readFileSync(
      path.join(tmpDir, '.agents', 'plan', 'PDCA.md'),
      'utf8'
    );
    assert.match(pdca, /three-digit/);
    assert.doesNotMatch(pdca, /zero-padded two-digit/);
    assert.match(pdca, /## Compaction/);
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

  it('generates a general Definition of Done', () => {
    const dod = fs.readFileSync(
      path.join(tmpDir, '.agents', 'plan', 'DoD.md'),
      'utf8'
    );
    // Ours rotted by accumulating per-round checklists. The shipped one says
    // not to, and that instruction is the point of the file.
    assert.match(dod, /Round-specific criteria belong in that round/);
    assert.ok(!/Round \d/.test(dod), 'the shipped DoD must not name a round');
  });

  it('generates a copyable round template beside the cycles', () => {
    // PDCA.md points at this file instead of inlining the format; a broken
    // pointer leaves the round format documented nowhere.
    const readOut = (/** @type {string} */ rel) =>
      fs.readFileSync(path.join(tmpDir, rel), 'utf8');

    const tpl = readOut('.agents/plan/cycles/_TEMPLATE.md');
    assert.match(tpl, /^# Round NNN:/m);
    assert.match(tpl, /three\*{2} digits/);

    const pdca = readOut('.agents/plan/PDCA.md');
    assert.ok(
      pdca.includes('cycles/_TEMPLATE.md'),
      'PDCA.md should point at the copyable template'
    );
    assert.ok(
      !pdca.includes('**Status**: Planning | In Progress'),
      'PDCA.md should not carry a second copy of the round format'
    );
  });

  it('ships the compaction prompt, which PDCA.md tells users to run', () => {
    assert.ok(
      fs.existsSync(
        path.join(tmpDir, '.agents', 'prompts', 'compact-content.prompt.md')
      )
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

describe('scaffold base template (opt-in planning surface)', () => {
  /**
   * `plan.decisions` is off by default: `.agents/decisions/` is real surface,
   * and a repo that has not felt cross-round drift does not need it. The flag
   * has to move three things together — the directory, the knowledge base's
   * map and authority table, and the permission rules that back that table.
   * A flag that moves only some of them is worse than no flag.
   */
  /** @param {boolean} decisions */
  const render = async (decisions) => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2s-decisions-'));
    await scaffold({
      templateName: 'scaffold/base',
      outputDir: outDir,
      overrides: { plan: { decisions } },
    });
    return outDir;
  };

  it('omits decisions/ by default', async () => {
    const outDir = await render(false);
    try {
      assert.equal(
        fs.existsSync(path.join(outDir, '.agents/decisions')),
        false
      );

      const kb = fs.readFileSync(
        path.join(outDir, '.agents/AGENTS.md'),
        'utf8'
      );
      assert.ok(!kb.includes('decisions/'));

      const settings = JSON.parse(
        fs.readFileSync(path.join(outDir, '.claude/settings.json'), 'utf8')
      );
      assert.ok(
        !settings.permissions.ask.includes('Edit(/.agents/decisions/**)')
      );
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('omits programs/ by default and generates it when enabled', async () => {
    const off = await render(false);
    try {
      assert.equal(
        fs.existsSync(path.join(off, '.agents/plan/programs')),
        false
      );
    } finally {
      fs.rmSync(off, { recursive: true, force: true });
    }

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2s-programs-'));
    try {
      await scaffold({
        templateName: 'scaffold/base',
        outputDir: outDir,
        overrides: { plan: { programs: true } },
      });
      for (const file of ['README.md', '_TEMPLATE.md']) {
        assert.ok(
          fs.existsSync(path.join(outDir, '.agents/plan/programs', file)),
          `.agents/plan/programs/${file} should be generated`
        );
      }
      const kb = fs.readFileSync(
        path.join(outDir, '.agents/AGENTS.md'),
        'utf8'
      );
      assert.match(kb, /^ {4}programs\//m, 'directory map should list it');
      assert.ok(
        kb.split('\n').length < 100,
        'knowledge base must stay under budget'
      );
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('links a round to its program through the Part of header', async () => {
    // The header is the only link between cycles/ and programs/; without it a
    // round is an orphan and cross-round drift becomes invisible.
    const outDir = await render(false);
    try {
      const roundTpl = fs.readFileSync(
        path.join(outDir, '.agents/plan/cycles/_TEMPLATE.md'),
        'utf8'
      );
      assert.match(roundTpl, /^\*\*Part of\*\*:/m);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('generates decisions/ and its governance when enabled', async () => {
    const outDir = await render(true);
    try {
      for (const file of ['README.md', '_TEMPLATE.md']) {
        assert.ok(
          fs.existsSync(path.join(outDir, '.agents/decisions', file)),
          `.agents/decisions/${file} should be generated`
        );
      }

      const kb = fs.readFileSync(
        path.join(outDir, '.agents/AGENTS.md'),
        'utf8'
      );
      assert.match(kb, /^ {2}decisions\//m, 'directory map should list it');
      assert.match(
        kb,
        /`decisions\/`.*READ ONLY/,
        'authority table should cover it'
      );
      assert.ok(
        kb.split('\n').length < 100,
        'knowledge base must stay under budget with the flag on'
      );

      // The template renders JSON by string interpolation, so a badly placed
      // conditional produces a trailing comma and a file no harness can read.
      const settings = JSON.parse(
        fs.readFileSync(path.join(outDir, '.claude/settings.json'), 'utf8')
      );
      assert.ok(
        settings.permissions.ask.includes('Edit(/.agents/decisions/**)')
      );
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
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

// ── generated output must not fight the formatter ───────────────────

describe('generated stubs are formatter-stable', () => {
  /**
   * The managed region is rewritten on every scaffold, so anything a
   * formatter insists on changing inside it becomes a permanent ping-pong:
   * prettier adds it, the next run strips it, the diff never settles.
   *
   * This missed once already — `<!-- a2scaffold:start -->` was followed
   * directly by a blockquote, and prettier wants a blank line between them.
   */
  /** @type {string} */
  let tmpDir;

  const stubs = [
    'CLAUDE.md',
    'AGENTS.md',
    'GEMINI.md',
    '.github/copilot-instructions.md',
  ];

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-fmt-'));
    await scaffold({
      templateName: 'scaffold/base',
      outputDir: tmpDir,
      overrides: { project: { name: 'fmt' }, agents: { gemini: true } },
    });
  });

  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  for (const rel of stubs) {
    it(`renders ${rel} exactly as prettier would write it`, async () => {
      const prettier = await import('prettier');
      const repoRoot = path.dirname(__dirname);
      const options = await prettier.resolveConfig(
        path.join(repoRoot, 'README.md')
      );
      const text = fs.readFileSync(path.join(tmpDir, rel), 'utf8');
      const formatted = await prettier.format(text, {
        ...options,
        parser: 'markdown',
      });
      assert.equal(
        formatted,
        text,
        `${rel} is not formatter-stable; a prettier-using repo would rewrite it every run`
      );
    });
  }
});
