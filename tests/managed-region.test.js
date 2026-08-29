import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  scaffold,
  checkExistingFiles,
  listOutputPaths,
  hasManagedRegion,
  mergeManagedRegion,
} from '../src/scaffold/index.js';
import { resolveTemplatePath } from '../src/templates/index.js';

const TEMPLATE = 'scaffold/base';

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
    const out = listOutputPaths(templateDir, {
      agents: { claude: true, agentsmd: true },
    }).map((p) => p.outputRel);
    assert.ok(out.includes('CLAUDE.md'), 'CLAUDE.md should be predicted');
    assert.ok(!out.some((p) => p.includes('$if{')));
  });

  it('omits files whose condition is falsy', () => {
    const out = listOutputPaths(templateDir, {
      agents: { claude: false, agentsmd: true },
    }).map((p) => p.outputRel);
    assert.ok(!out.includes('CLAUDE.md'));
    assert.ok(out.includes('AGENTS.md'));
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
    const seen = listOutputPaths(templateDir, {
      agents: { claude: true },
    }).map((p) => p.outputRel);
    assert.ok(seen.includes('CLAUDE.md'));
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

  it('does not report a managed stub as a conflict', () => {
    const { templateDir } = resolveTemplatePath(TEMPLATE);
    const conflicts = checkExistingFiles(templateDir, tmpDir, {
      agents: { claude: true, agentsmd: true, copilot: true },
    });
    assert.ok(!conflicts.includes('CLAUDE.md'));
    // Canonical knowledge has no managed region and must still conflict.
    assert.ok(conflicts.includes(path.join('.agents', 'AGENTS.md')));
  });
});
