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
  classifyRegion,
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

  it('keeps the indentation of the first line after the title', () => {
    // A hand-written CLAUDE.md often opens with an indented code block. The
    // adopter used to strip all leading whitespace, not just blank lines, so
    // the block's first line lost its indent while the rest kept it.
    const existing = '# T\n\n    code line 1\n    code line 2\n\nprose\n';
    const out = adoptManagedRegion(existing, incoming);
    assert.ok(out.includes('\n    code line 1\n    code line 2\n'), out);
    assert.ok(out.endsWith('\n\nprose\n'), out);
  });

  it('does not turn an indented example marker into a live one', () => {
    // Four spaces is an indented code block; a marker shown there is an
    // example. De-indenting it created a second live pair that `sync` then
    // refused forever.
    const existing =
      '# T\n\n    <!-- a2scaffold:start -->\n    <!-- a2scaffold:end -->\n';
    const out = adoptManagedRegion(existing, incoming);
    assert.equal(classifyRegion(out).kind, 'valid', out);
  });

  it('declines when the incoming render has no region', () => {
    // `.agents/` canon has no managed region on purpose, so --force must keep
    // meaning "replace" there rather than quietly prepending a block.
    assert.equal(adoptManagedRegion('# mine\n', 'plain canon\n'), null);
  });

  it('declines when the existing file already has a region', () => {
    assert.equal(adoptManagedRegion(incoming, incoming), null);
  });

  it('declines when the existing markers are broken, rather than adding more', () => {
    // The parser returned `null` for "no markers" and for "broken markers"
    // alike, and adoption read both as marker-less. `--adopt` on a file with a
    // duplicated pair reported success and left a third pair behind — a file
    // that was still unmergeable, and now harder to repair by hand.
    const dup =
      '# T\n<!-- a2scaffold:start -->\na\n<!-- a2scaffold:end -->\n' +
      '<!-- a2scaffold:start -->\nb\n<!-- a2scaffold:end -->\n';
    const inverted =
      '# T\n<!-- a2scaffold:end -->\nx\n<!-- a2scaffold:start -->\n';
    const unclosed = '# T\n<!-- a2scaffold:start -->\nx\n';
    for (const broken of [dup, inverted, unclosed]) {
      assert.equal(adoptManagedRegion(broken, incoming), null);
    }
  });
});

// ── classifyRegion: the three states callers must keep apart ────────

describe('classifyRegion', () => {
  const S = '<!-- a2scaffold:start -->';
  const E = '<!-- a2scaffold:end -->';

  it('reports none for a file without markers', () => {
    assert.deepEqual(classifyRegion('# mine\n\nprose\n'), { kind: 'none' });
  });

  it('reports valid with offsets for exactly one ordered pair', () => {
    const state = classifyRegion(`# T\n\n${S}\nbody\n${E}\n`);
    assert.equal(state.kind, 'valid');
    if (state.kind === 'valid') {
      assert.equal(state.start, '# T\n\n'.length);
      assert.equal(state.end, `# T\n\n${S}\nbody\n${E}`.length);
    }
  });

  it('recognises markers in a file with CRLF line endings', () => {
    const crlf =
      '# T\r\n\r\n<!-- a2scaffold:start -->\r\nOLDBODY\r\n<!-- a2scaffold:end -->\r\n\r\nmine\r\n';
    const state = classifyRegion(crlf);
    assert.equal(state.kind, 'valid', JSON.stringify(state));
    const merged = mergeManagedRegion(
      crlf,
      '<!-- a2scaffold:start -->\nNEWBODY\n<!-- a2scaffold:end -->\n'
    );
    assert.ok(
      merged !== null,
      'CRLF file must merge, not fall through to adopt'
    );
    assert.ok(merged.includes('NEWBODY'));
    assert.ok(!merged.includes('OLDBODY'));
    assert.ok(merged.endsWith('\r\n\r\nmine\r\n'), JSON.stringify(merged));
  });

  it('names the reason for each ambiguous shape', () => {
    const cases = [
      [`${S}\na\n${E}\n${S}\nb\n${E}\n`, /more than one/],
      [`${E}\nx\n${S}\n`, /before start/],
      [`${S}\nx\n`, /no end/],
      [`x\n${E}\n`, /no start/],
    ];
    for (const [text, reason] of cases) {
      const state = classifyRegion(text);
      assert.equal(state.kind, 'ambiguous', text);
      if (state.kind === 'ambiguous') assert.match(state.reason, reason);
    }
  });
});

// ── end-to-end: re-scaffolding is non-destructive ───────────────────

describe('resolveScaffoldConfig', () => {
  it('does not expose the process environment to templates', () => {
    // `env: process.env` was merged into every view, so a template could
    // render a token into a committed file. Nothing shipped used it.
    process.env.A2SCAFFOLD_TEST_SECRET = 'leak-me';
    try {
      const { view } = resolveScaffoldConfig({
        templateName: TEMPLATE,
        outputDir: '.',
        overrides: {},
      });
      assert.equal(view.env?.A2SCAFFOLD_TEST_SECRET, undefined);
      assert.equal(view.env?.PATH, undefined);
    } finally {
      delete process.env.A2SCAFFOLD_TEST_SECRET;
    }
  });
});

describe('re-scaffolding an existing project', () => {
  /** @type {string} */
  let tmpDir;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-rescaffold-'));
    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir });
  });

  afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('reports an untouched project as current and rewrites nothing', async () => {
    const stub = path.join(tmpDir, 'CLAUDE.md');
    const before = fs.statSync(stub).mtimeMs;
    await new Promise((r) => setTimeout(r, 20));

    const second = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
    });

    // Every managed stub is byte-identical to the render, so it belongs in
    // `unchanged`, not `preserved`, and its file is left alone.
    assert.deepEqual(second.preserved, []);
    assert.ok(second.unchanged.includes('CLAUDE.md'));
    assert.equal(fs.statSync(stub).mtimeMs, before);
  });

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

  it('names the canon files --force replaced', async () => {
    // `--force` used to report only the stubs it kept; the files it destroyed
    // were never listed, so the success banner read as a clean run.
    const canon = path.join(tmpDir, '.agents', 'AGENTS.md');
    fs.appendFileSync(canon, '\nMY EDIT\n');

    const result = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
      force: true,
    });

    assert.deepEqual(result.replaced, ['.agents/AGENTS.md']);
    assert.ok(!fs.readFileSync(canon, 'utf8').includes('MY EDIT'));
  });

  it('dry-run reports the conflict split and writes nothing', async () => {
    const canon = path.join(tmpDir, '.agents', 'AGENTS.md');
    fs.appendFileSync(canon, '\nMY EDIT\n');
    const stub = path.join(tmpDir, 'GEMINI.md');
    fs.writeFileSync(stub, '# hand-written, no markers\n');
    const before = fs.readFileSync(canon, 'utf8');

    const plan = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
      overrides: { agents: { gemini: true } },
      dryRun: true,
    });

    assert.deepEqual(plan.needsForce, ['.agents/AGENTS.md']);
    assert.deepEqual(plan.needsAdopt, ['GEMINI.md']);
    assert.ok(plan.unchanged.length > 0);
    assert.equal(fs.readFileSync(canon, 'utf8'), before, 'dry-run wrote');
    assert.equal(fs.readFileSync(stub, 'utf8'), '# hand-written, no markers\n');
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
    // The region already matched the render, so the file is current; the
    // author's addition outside it is what makes it differ from a fresh
    // render, and that is not the tool's to touch.
    assert.ok(result.unchanged.includes('CLAUDE.md'));
    assert.ok(!result.preserved.includes('CLAUDE.md'));
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

  it('ignores markers inside an indented code example', () => {
    // CommonMark has a second kind of code block: four spaces or a tab. The
    // fence fix left this one open, and a merge was reproduced replacing the
    // author's indented example with the generated block, no flag asked for.
    const spaced = [
      '# Marker example',
      '',
      '    <!-- a2scaffold:start -->',
      '    example generated content',
      '    <!-- a2scaffold:end -->',
    ].join('\n');
    const tabbed = spaced.replace(/^ {4}/gm, '\t');
    for (const doc of [spaced, tabbed]) {
      assert.equal(hasManagedRegion(doc), false);
      assert.equal(mergeManagedRegion(doc, wrapped('new')), null);
      assert.deepEqual(classifyRegion(doc), { kind: 'none' });
    }
  });

  it('still reads a marker indented up to three spaces', () => {
    // Three spaces is still a paragraph in CommonMark, and the same bound the
    // fence parser uses; the two must not disagree about where code begins.
    const doc =
      '# T\n\n   <!-- a2scaffold:start -->\nbody\n   <!-- a2scaffold:end -->\n';
    assert.equal(hasManagedRegion(doc), true);
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

  it('refuses a stub with broken markers even when adopt is given', async () => {
    // Adopting a file that already has a broken pair would add a second
    // block to it. Replacement is the only thing a run could do to such a
    // file, and that is the destructive permission — so it is asked for.
    const broken =
      '# p-01\n\n<!-- a2scaffold:start -->\nold\n<!-- a2scaffold:end -->\n' +
      '\n<!-- a2scaffold:start -->\nold again\n<!-- a2scaffold:end -->\n';
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), broken);

    const { templateDir } = resolveTemplatePath(TEMPLATE);
    const { adopt, overwrite } = classifyConflicts(
      templateDir,
      tmpDir,
      view({ agents: { agentsmd: true, claude: true } })
    );
    assert.ok(!adopt.includes('AGENTS.md'), 'must not be offered adoption');
    assert.ok(overwrite.includes('AGENTS.md'));

    await assert.rejects(
      () =>
        scaffold({ templateName: TEMPLATE, outputDir: tmpDir, adopt: true }),
      (/** @type {any} */ err) => {
        assert.equal(err.name, 'ScaffoldRefusal');
        assert.deepEqual(err.needsAdopt, []);
        assert.deepEqual(err.needsForce, ['AGENTS.md']);
        return true;
      }
    );
    assert.equal(
      fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8'),
      broken
    );
  });

  it('takes the ordinary merge path on the next run', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: tmpDir, adopt: true });
    const second = await scaffold({
      templateName: TEMPLATE,
      outputDir: tmpDir,
      adopt: true,
    });

    // Adoption happens once. After it, the file has markers, its region
    // already matches the render, and nothing is adopted or rewritten.
    assert.ok(second.unchanged.includes('AGENTS.md'));
    assert.ok(!second.adopted.includes('AGENTS.md'));
    assert.ok(!second.preserved.includes('AGENTS.md'));

    const after = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf8');
    assert.ok(after.includes('Monorepo for data processing.'));
    assert.match(after, /^# p-01 Bootstrap/);
  });
});
