import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { listOutputPaths } from '../src/scaffold/output-paths.js';
import { checkExistingFiles } from '../src/scaffold/conflicts.js';

/**
 * `listOutputPaths` used to mirror js-tmpl's path rules, and this file pinned
 * the mirror against the installed renderer. The mirror is gone: the engine
 * plans, we wrap. What is left to pin is the wrapper's contract — the plan
 * is what the engine would write, its errors are the engine's, and the paths
 * it hands back are native.
 */
describe('listOutputPaths, backed by planRender', () => {
  /** @type {string} */
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-paths-'));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  /**
   * Build a template from `{ templateRelPath: contents }` and return its dir.
   *
   * @param {Record<string, string>} files
   * @returns {string}
   */
  const template = (files) => {
    const dir = path.join(root, 'template');
    for (const [rel, body] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, body);
    }
    return dir;
  };

  it('lists what a render would write, with its content', async () => {
    const dir = template({
      '$if{on}/kept.md.hbs': 'kept {{name}}',
      '$if{off}/dropped.md.hbs': 'dropped',
      'always.md.hbs': 'always',
    });
    const out = await listOutputPaths(dir, { on: true, off: false, name: 'x' });
    assert.deepEqual(
      out.map((p) => [p.outputRel, p.content]),
      [
        ['always.md', 'always'],
        ['kept.md', 'kept x'],
      ]
    );
  });

  it('hands back native paths, whatever the engine uses internally', async () => {
    const dir = template({ '${dir}/x.md.hbs': 'x' });
    const [entry] = await listOutputPaths(dir, { dir: 'sub' });
    assert.equal(entry.outputRel, path.join('sub', 'x.md'));
    assert.equal(entry.templateRel, path.join('${dir}', 'x.md.hbs'));
  });

  it("throws the engine's own error for a path value the view lacks", async () => {
    // 0.1.x rendered a missing `${var}` empty; 0.2.0 refuses. The wrapper
    // adds nothing and hides nothing: the code is js-tmpl's.
    const dir = template({ '${dir}/${missing}name.md.hbs': 'x' });
    await assert.rejects(
      () => listOutputPaths(dir, { dir: 'sub' }),
      (err) =>
        err instanceof Error &&
        /** @type {any} */ (err).code === 'JSTMPL_PATH_MISSING_VAR'
    );
  });

  it("throws the engine's own error for a guard the view lacks", async () => {
    const dir = template({ '$if{absent}/x.md.hbs': 'x' });
    await assert.rejects(
      () => listOutputPaths(dir, {}),
      (err) =>
        err instanceof Error &&
        /** @type {any} */ (err).code === 'JSTMPL_GUARD_MISSING_VAR'
    );
  });

  it('requires a view, because a plan renders content', async () => {
    const dir = template({ 'x.md.hbs': 'x' });
    await assert.rejects(() => listOutputPaths(dir), TypeError);
    await assert.rejects(() => checkExistingFiles(dir, root), /resolved view/);
  });
});
