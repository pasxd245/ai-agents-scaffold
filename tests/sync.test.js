import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { scaffold, sync } from '../src/scaffold/index.js';

const TEMPLATE = 'scaffold/base';

/**
 * `sync` exists because the full scaffold has one behaviour for every file:
 * refreshing a stub meant `--force`, and `--force` also replaces `.agents/`
 * wholesale. Every test here is really the same assertion from a different
 * angle — sync writes only inside one unambiguous managed region and never
 * overwrites an existing seeded file, so it needs no `--force` and no conflict
 * list.
 */
describe('sync', () => {
  /** @type {string} */
  let dir;

  const read = (/** @type {string} */ rel) =>
    fs.readFileSync(path.join(dir, rel), 'utf8');
  const write = (/** @type {string} */ rel, /** @type {string} */ text) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-sync-'));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('installs a repo that has nothing, without needing --force', async () => {
    const result = await sync({ templateName: TEMPLATE, outputDir: dir });
    assert.ok(result.created.includes('CLAUDE.md'));
    assert.ok(result.created.includes('.agents/AGENTS.md'));
    assert.equal(result.unmanaged.length, 0);
  });

  it('refreshes a stale managed region', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: dir });
    write('CLAUDE.md', read('CLAUDE.md').replace('@.agents/AGENTS.md', '@old'));

    const result = await sync({ templateName: TEMPLATE, outputDir: dir });

    assert.ok(result.updated.includes('CLAUDE.md'));
    assert.ok(read('CLAUDE.md').includes('@.agents/AGENTS.md'));
  });

  it('never touches seeded canon, however far it has diverged', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: dir });
    const mine = '# Philosophy — mine\n\nNothing the template said.\n';
    write('.agents/context/philosophy.md', mine);

    const result = await sync({ templateName: TEMPLATE, outputDir: dir });

    assert.equal(read('.agents/context/philosophy.md'), mine);
    assert.ok(!result.updated.includes('.agents/context/philosophy.md'));
    // Silent, not merely unmodified: our own philosophy.md is three times the
    // template's, and reporting that every run trains people to ignore output.
    assert.ok(!result.drifted.includes('.agents/context/philosophy.md'));
  });

  it('keeps author content below the marker while refreshing above it', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: dir });
    write('CLAUDE.md', `${read('CLAUDE.md')}\n## Mine\n\nhand-written\n`);
    write('CLAUDE.md', read('CLAUDE.md').replace('@.agents/AGENTS.md', '@old'));

    await sync({ templateName: TEMPLATE, outputDir: dir });

    const after = read('CLAUDE.md');
    assert.match(after, /## Mine\n\nhand-written/);
    assert.ok(after.includes('@.agents/AGENTS.md'));
  });

  it('reports an unmanaged stub instead of overwriting it', async () => {
    const handWritten = '# p-01\n\n## Stack\n\npnpm, Python\n';
    write('AGENTS.md', handWritten);

    const result = await sync({ templateName: TEMPLATE, outputDir: dir });

    assert.ok(result.unmanaged.includes('AGENTS.md'));
    assert.equal(read('AGENTS.md'), handWritten, 'must not be touched');
  });

  it('brings an unmanaged stub under management with adopt', async () => {
    write('AGENTS.md', '# p-01\n\n## Stack\n\npnpm, Python\n');

    const result = await sync({
      templateName: TEMPLATE,
      outputDir: dir,
      adopt: true,
    });

    assert.ok(result.adopted.includes('AGENTS.md'));
    assert.ok(read('AGENTS.md').includes('pnpm, Python'));
    assert.ok(read('AGENTS.md').includes('a2scaffold:start'));
  });

  it('reports a missing enforcement rule, and names it', async () => {
    await scaffold({ templateName: TEMPLATE, outputDir: dir });
    const trimmed = JSON.stringify(
      { permissions: { ask: ['Edit(/.agents/AGENTS.md)'] } },
      null,
      2
    );
    write('.claude/settings.json', trimmed);

    const result = await sync({ templateName: TEMPLATE, outputDir: dir });

    const drift = result.drifted.find(
      (d) => d.file === path.join('.claude', 'settings.json')
    );
    assert.ok(drift, 'a stripped settings file is behind the template');
    assert.ok(drift.missing.length > 0, 'the missing rules should be named');
    assert.ok(drift.missing.every((m) => m.startsWith('permissions.')));
    assert.equal(
      read('.claude/settings.json'),
      trimmed,
      'must not be rewritten'
    );
  });

  it('does not call a reformatted settings file drift', async () => {
    // Byte comparison called every formatter run, key reorder and local rule
    // a security regression. A warning that is usually wrong gets ignored,
    // which is the protection it claims to defend.
    await scaffold({ templateName: TEMPLATE, outputDir: dir });
    const settings = JSON.parse(read('.claude/settings.json'));
    settings.permissions.ask.push('Edit(/secrets/**)');
    write('.claude/settings.json', JSON.stringify(settings));

    const result = await sync({ templateName: TEMPLATE, outputDir: dir });

    assert.deepEqual(
      result.drifted,
      [],
      'reformatting and extra local rules are the user\u2019s business'
    );
  });

  it('writes nothing on a dry run', async () => {
    const before = fs.readdirSync(dir);
    const result = await sync({
      templateName: TEMPLATE,
      outputDir: dir,
      dryRun: true,
    });

    assert.ok(
      result.created.length > 0,
      'it should still report what it would do'
    );
    assert.deepEqual(fs.readdirSync(dir), before);
  });

  it('is idempotent', async () => {
    await sync({ templateName: TEMPLATE, outputDir: dir });
    const second = await sync({ templateName: TEMPLATE, outputDir: dir });

    assert.deepEqual(second.created, []);
    assert.deepEqual(second.updated, []);
    assert.ok(second.unchanged.length > 0);
  });
});
