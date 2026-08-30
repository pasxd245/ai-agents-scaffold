import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  scaffold,
  checkExistingFiles,
  classifyConflicts,
  listOutputPaths,
  hasManagedRegion,
  mergeManagedRegion,
  adoptManagedRegion,
  resolveScaffoldConfig,
} from '../src/scaffold/index.js';
import { resolveTemplatePath } from '../src/templates/index.js';

const TEMPLATE = 'scaffold/base';

/**
 * The view the CLI would resolve, with `overrides` layered on top.
 *
 * Path prediction is a mirror of the renderer, and the renderer *throws* on a
 * formula naming a variable the view does not define — so a hand-rolled
 * partial view is not a smaller version of the real thing, it is an error.
 * Building it the way the CLI does keeps these tests honest.
 *
 * @param {Record<string, any>} [overrides]
 * @returns {Record<string, any>}
 */
const view = (overrides = {}) =>
  resolveScaffoldConfig({ templateName: TEMPLATE, outputDir: '.', overrides })
    .view;

// ── mergeManagedRegion ──────────────────────────────────────────────

describe('mergeManagedRegion', () => {
  const wrap = (body) =>
    `<!-- a2scaffold:start -->\n${body}\n<!-- a2scaffold:end -->`;

  it('replaces the region and keeps everything around it', () => {
    // Note: don't assert on /old/ here — the marker contains "scaffold".
    const existing = `# Mine\n\n${wrap('PREVIOUS')}\n\n## Hand-written\n\nkeep me`;
    const merged = mergeManagedRegion(existing, wrap('REGENERATED'));
    assert.match(merged, /# Mine/);
    assert.match(merged, /REGENERATED/);
    assert.doesNotMatch(merged, /PREVIOUS/);
    assert.match(merged, /## Hand-written\n\nkeep me/);
  });

  it('refuses to merge when either side has no region', () => {
    assert.equal(mergeManagedRegion('plain', wrap('new')), null);
    assert.equal(mergeManagedRegion(wrap('old'), 'plain'), null);
  });

  it('refuses to merge when the markers are out of order', () => {
    const inverted = '<!-- a2scaffold:end -->\nx\n<!-- a2scaffold:start -->';
    assert.equal(hasManagedRegion(inverted), false);
    assert.equal(mergeManagedRegion(inverted, wrap('new')), null);
  });
});

// ── conditional output paths ────────────────────────────────────────

describe('listOutputPaths', () => {
  const templateDir = resolveTemplatePath(TEMPLATE).templateDir;

  it('resolves $if{} segments away when the condition is truthy', () => {
    const out = listOutputPaths(
      templateDir,
      view({ agents: { claude: true, agentsmd: true } })
    ).map((p) => p.outputRel);
    assert.ok(out.includes('CLAUDE.md'), 'CLAUDE.md should be predicted');
    assert.ok(!out.some((p) => p.includes('$if{')));
  });

  it('omits files whose condition is falsy', () => {
    const out = listOutputPaths(
      templateDir,
      view({ agents: { claude: false, agentsmd: true } })
    ).map((p) => p.outputRel);
    assert.ok(!out.includes('CLAUDE.md'));
    assert.ok(out.includes('AGENTS.md'));
  });
});

// ── adopting a file the tool did not write ──────────────────────────

describe('adoptManagedRegion', () => {
  const incoming =
    '# AGENTS.md — proj\n\n<!-- a2scaffold:start -->\nGENERATED\n' +
    '<!-- a2scaffold:end -->\n\nseeded tail\n';

  it('keeps every line of a hand-written file', () => {
    const existing = '# proj Bootstrap\n\n## Stack\n\npnpm, Python 3.11\n';
    const out = adoptManagedRegion(existing, incoming);
    for (const line of existing.split('\n').filter(Boolean)) {
      assert.ok(out.includes(line), `lost: ${line}`);
    }
  });

  it("inserts the block below the author's own title", () => {
    const out = adoptManagedRegion('# proj Bootstrap\n\n## Stack\n', incoming);
    assert.match(out, /^# proj Bootstrap\n\n<!-- a2scaffold:start -->/);
    assert.ok(
      !out.includes('# AGENTS.md — proj'),
      'template title must not win'
    );
  });

  it('leaves frontmatter first, where harnesses require it', () => {
    const existing = '---\napplyTo: "**"\n---\n\n# Title\n\nbody\n';
    const out = adoptManagedRegion(existing, incoming);
    assert.match(
      out,
      /^---\napplyTo: "\*\*"\n---\n\n# Title\n\n<!-- a2scaffold:start -->/
    );
  });

  it('inserts at the top when there is no heading', () => {
    const out = adoptManagedRegion('just prose\n', incoming);
    assert.match(out, /^<!-- a2scaffold:start -->/);
    assert.ok(out.includes('just prose'));
  });

  it('declines when the incoming render has no region', () => {
    // `.agents/` canon has no managed region on purpose, so --force must keep
    // meaning "replace" there rather than quietly prepending a block.
    assert.equal(adoptManagedRegion('# mine\n', 'plain canon\n'), null);
  });

  it('declines when the existing file already has a region', () => {
    assert.equal(adoptManagedRegion(incoming, incoming), null);
  });
});

// ── end-to-end: re-scaffolding is non-destructive ───────────────────

describe('re-scaffolding an existing project', () => {
  /** @type {string} */
  let tmpDir;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-rescaffold-'));
    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir });
  });

  afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('detects conditional files as existing, which raw paths missed', () => {
    const { templateDir } = resolveTemplatePath(TEMPLATE);
    // Without a view, $if{} segments cannot be evaluated and every gated
    // stub is invisible to conflict detection.
    const blind = checkExistingFiles(templateDir, tmpDir);
    assert.ok(!blind.includes('CLAUDE.md'));

    // With a view, CLAUDE.md resolves — and is then excluded only because it
    // carries a managed region, not because it was never seen.
    const seen = listOutputPaths(
      templateDir,
      view({ agents: { claude: true } })
    ).map((p) => p.outputRel);
    assert.ok(seen.includes('CLAUDE.md'));
  });

  it('lets the author rename the title and keep it', async () => {
    // The H1 names the file by default (`CLAUDE.md — my-project`), which is
    // the least useful thing it could say to a model reading it at launch.
    // It sits outside the managed region so a project can name itself.
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    const renamed = "# AI-Cowork — the owner's daily work & life base";
    fs.writeFileSync(
      claudeMd,
      fs.readFileSync(claudeMd, 'utf8').replace(/^# .*$/m, renamed)
    );

    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir });

    const after = fs.readFileSync(claudeMd, 'utf8');
    assert.match(after, /^# AI-Cowork/m);
    assert.ok(
      after.includes('a2scaffold:start'),
      'the generated block should still be regenerated'
    );
  });

  it('keeps edited philosophy principles across a re-scaffold', async () => {
    // The stub ships placeholder principles and context/philosophy.md tells
    // the user to replace them. While the summary lived inside the managed
    // region, doing so guaranteed it would be silently reverted.
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(
      claudeMd,
      fs
        .readFileSync(claudeMd, 'utf8')
        .replace(
          /1\. \*\*Ask before assuming\.\*\*/,
          '1. **A personal tool that might generalise.**'
        )
    );

    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir });

    const after = fs.readFileSync(claudeMd, 'utf8');
    assert.match(after, /A personal tool that might generalise/);
    assert.ok(
      !after.includes('1. **Ask before assuming.**'),
      'the placeholder principle should not have been restored'
    );
  });

  it('preserves author content outside the managed region', async () => {
    const claudeMd = path.join(tmpDir, 'CLAUDE.md');
    fs.appendFileSync(claudeMd, '\n## Mine\n\nhand-written\n');
    const before = fs.readFileSync(claudeMd, 'utf8');
    assert.ok(hasManagedRegion(before));

    const result = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
    });

    const after = fs.readFileSync(claudeMd, 'utf8');
    assert.match(after, /## Mine\n\nhand-written/);
    assert.ok(result.preserved.includes('CLAUDE.md'));
  });

  it('refuses only the files that would actually change', async () => {
    // The old pre-flight compared the *unrendered* template against the
    // target, so every already-correct canon file counted as a conflict: 23
    // names under "edits lost" when one had changed. A list that is mostly
    // noise is a list people type past, which defeats the prompt entirely.
    fs.appendFileSync(
      path.join(tmpDir, '.agents/context/philosophy.md'),
      '\nMy own principle.\n'
    );

    await assert.rejects(
      () => scaffold({ templateName: TEMPLATE, outputDir: tmpDir }),
      (/** @type {any} */ err) => {
        assert.deepEqual(err.needsForce, [
          path.join('.agents', 'context', 'philosophy.md'),
        ]);
        assert.deepEqual(err.needsAdopt, []);
        return true;
      }
    );
  });

  it('does not report a managed stub as a conflict', () => {
    const { templateDir } = resolveTemplatePath(TEMPLATE);
    const conflicts = checkExistingFiles(templateDir, tmpDir, view());
    assert.ok(!conflicts.includes('CLAUDE.md'));
    // Canonical knowledge has no managed region and must still conflict.
    assert.ok(conflicts.includes(path.join('.agents', 'AGENTS.md')));
  });
});

// ── prose that mentions the markers is not a managed file ───────────

describe('hasManagedRegion (markers that are not a region)', () => {
  const wrapped = (/** @type {string} */ body) =>
    `<!-- a2scaffold:start -->\n${body}\n<!-- a2scaffold:end -->`;

  it('ignores markers inside inline code', () => {
    // This repo's own reference docs describe the markers in backticks. If
    // that counted, a re-scaffold would splice the doc at the wrong offsets.
    const doc = [
      '# Root files',
      '',
      '- Generated content is fenced by `<!-- a2scaffold:start -->` /',
      '  `<!-- a2scaffold:end -->`. Write your sections outside it.',
    ].join('\n');
    assert.equal(hasManagedRegion(doc), false);
  });

  it('still recognises real markers on their own line', () => {
    const real =
      '# T\n\n<!-- a2scaffold:start -->\nbody\n<!-- a2scaffold:end -->\n';
    assert.equal(hasManagedRegion(real), true);
  });

  it('ignores markers inside a fenced example', () => {
    // A doc that *shows* what a generated stub looks like puts real markers
    // on real lines. Counting those would let a merge overwrite the author's
    // example — the one thing the region exists to prevent.
    const doc = [
      '# Root files',
      '',
      '```markdown',
      '<!-- a2scaffold:start -->',
      'example generated content',
      '<!-- a2scaffold:end -->',
      '```',
      '',
      'Prose after the example.',
    ].join('\n');
    assert.equal(hasManagedRegion(doc), false);
    assert.equal(mergeManagedRegion(doc, wrapped('new')), null);
  });

  it('reads a region that surrounds a fenced example', () => {
    // The inverse: a generated block may legitimately contain fenced code,
    // and the markers around it are outside the fence.
    const doc = [
      '# T',
      '',
      '<!-- a2scaffold:start -->',
      '',
      '```bash',
      'a2scaffold sync',
      '```',
      '',
      '<!-- a2scaffold:end -->',
    ].join('\n');
    assert.equal(hasManagedRegion(doc), true);
  });

  it('fails closed on a duplicated marker pair', () => {
    // Two candidate regions and no way to know which one the template owns.
    // Refusing leaves the file to the caller's ordinary rules, which will not
    // destroy it without an explicit permission.
    const doubled =
      '<!-- a2scaffold:start -->\na\n<!-- a2scaffold:end -->\n\n' +
      '<!-- a2scaffold:start -->\nb\n<!-- a2scaffold:end -->\n';
    assert.equal(hasManagedRegion(doubled), false);
  });

  it('fails closed on a start with no end', () => {
    assert.equal(
      hasManagedRegion('# T\n\n<!-- a2scaffold:start -->\nbody\n'),
      false
    );
  });
});

// ── end-to-end: adopting a repo that predates the tool ──────────────

describe('scaffolding a repo that already has agent files', () => {
  /**
   * The case every adopter passes through exactly once, and the one the
   * managed-region merge could not cover: an existing `AGENTS.md` with no
   * markers. Before adoption, `--force` deleted its content outright.
   */
  /** @type {string} */
  let tmpDir;
  const handWritten =
    '# p-01 Bootstrap\n\n## What is this\n\nMonorepo for data processing.\n\n' +
    '## Stack\n\n- pnpm workspace\n- Python 3.11 with uv\n';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-adopt-'));
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), handWritten);
  });

  afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('classifies a marker-less stub as adoptable, not overwritable', () => {
    const { templateDir } = resolveTemplatePath(TEMPLATE);
    const { adopt, overwrite } = classifyConflicts(
      templateDir,
      tmpDir,
      view({ agents: { agentsmd: true, claude: true } })
    );
    assert.ok(adopt.includes('AGENTS.md'));
    assert.ok(!overwrite.includes('AGENTS.md'));
  });

  it('keeps the hand-written content when adopting', async () => {
    const result = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
      adopt: true,
    });

    const after = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    for (const line of handWritten.split('\n').filter(Boolean)) {
      assert.ok(after.includes(line), `adoption lost: ${line}`);
    }
    assert.ok(hasManagedRegion(after));
    assert.ok(result.adopted.includes('AGENTS.md'));
  });

  it('refuses to replace the file when given neither permission', async () => {
    // Adoption and replacement are different permissions, and the merge is
    // the last thing between a render and someone's file: it decides for
    // itself rather than trusting a caller to have run the preflight.
    await assert.rejects(
      () => scaffold({ templateName: TEMPLATE, outputDir: tmpDir }),
      (/** @type {any} */ err) => {
        assert.equal(err.name, 'ScaffoldRefusal');
        assert.deepEqual(err.needsAdopt, ['AGENTS.md']);
        assert.deepEqual(
          err.needsForce,
          [],
          'a stub is adoptable, so it must not demand the destructive flag'
        );
        return true;
      }
    );
    const after = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    assert.ok(
      after.includes('Monorepo for data processing.'),
      'a refused run must leave the file exactly as it was'
    );
  });

  it('replaces the file wholesale when force says so', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir, force: true });
    const after = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    assert.ok(!after.includes('Monorepo for data processing.'));
  });

  it('takes the ordinary merge path on the next run', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir, adopt: true });
    const second = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
      adopt: true,
    });

    // Adoption happens once. After it, the file has markers and is merged.
    assert.ok(second.preserved.includes('AGENTS.md'));
    assert.ok(!second.adopted.includes('AGENTS.md'));

    const after = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    assert.ok(after.includes('Monorepo for data processing.'));
    assert.match(after, /^# p-01 Bootstrap/);
  });
});
