import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { renderDirectory } from '@nci-gis/js-tmpl';

import {
  listOutputPaths,
  resolveOutputPath,
} from '../src/scaffold/output-paths.js';

/**
 * `resolveOutputPath` predicts what a render will write. Conflict detection
 * and the managed-region merge both trust that prediction, and a file the
 * prediction misses is a file the merge overwrites without `--force` — so a
 * divergence from the renderer is a data-loss bug, not a display bug.
 *
 * We cannot call js-tmpl's path engine directly (its `exports` map publishes
 * only `resolveConfig` and `renderDirectory`), so these tests compare our
 * prediction against what the installed renderer *actually does* on disk.
 * If js-tmpl's path semantics change under us, this is what fails.
 */
describe('output-path prediction matches the renderer', () => {
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

  /**
   * Everything the renderer writes, output-relative and sorted.
   *
   * @param {string} templateDir
   * @param {Record<string, any>} view
   * @returns {Promise<string[]>}
   */
  const rendered = async (templateDir, view) => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-paths-out-'));
    try {
      await renderDirectory({ templateDir, outDir, extname: '.hbs', view });
      /** @type {string[]} */
      const out = [];
      /** @param {string} rel */
      const walk = (rel) => {
        const abs = path.join(outDir, rel);
        if (fs.statSync(abs).isDirectory()) {
          for (const name of fs.readdirSync(abs)) {
            walk(rel ? path.join(rel, name) : name);
          }
          return;
        }
        out.push(rel);
      };
      walk('');
      return out.sort();
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  };

  /**
   * @param {string} templateDir
   * @param {Record<string, any>} view
   * @returns {string[]}
   */
  const predicted = (templateDir, view) =>
    listOutputPaths(templateDir, view)
      .map((p) => p.outputRel)
      .sort();

  it('agrees on $if, both ways', async () => {
    const dir = template({
      '$if{on}/kept.md.hbs': 'kept',
      '$if{off}/dropped.md.hbs': 'dropped',
      'always.md.hbs': 'always',
    });
    for (const view of [
      { on: true, off: false },
      { on: false, off: true },
    ]) {
      assert.deepEqual(predicted(dir, view), await rendered(dir, view));
    }
  });

  it('agrees on $ifn, which inverts $if', async () => {
    const dir = template({
      '$ifn{feature}/config.md.hbs': 'config',
      'always.md.hbs': 'always',
    });
    for (const view of [{ feature: false }, { feature: true }]) {
      assert.deepEqual(predicted(dir, view), await rendered(dir, view));
    }
  });

  it('agrees on nested and dotted formulas', async () => {
    const dir = template({
      '$if{a.b}/$ifn{a.c}/deep.md.hbs': 'deep',
    });
    for (const view of [
      { a: { b: true, c: false } },
      { a: { b: true, c: true } },
      { a: { b: false, c: false } },
    ]) {
      assert.deepEqual(predicted(dir, view), await rendered(dir, view));
    }
  });

  it('agrees on ${...} interpolation, including a missing value', async () => {
    const dir = template({ '${dir}/${missing}name.md.hbs': 'x' });
    const view = { dir: 'sub' };
    assert.deepEqual(predicted(dir, view), await rendered(dir, view));
  });

  it('rejects a formula naming a variable the view does not define', async () => {
    const dir = template({ '$if{absent}/x.md.hbs': 'x' });
    await assert.rejects(() => rendered(dir, {}), /undefined view variable/);
    assert.throws(() => predicted(dir, {}), /undefined view variable/);
  });

  it('rejects a formula that is not a whole segment', async () => {
    const dir = template({ 'pre$if{on}post/x.md.hbs': 'x' });
    await assert.rejects(() => rendered(dir, { on: true }), /whole segments/);
    assert.throws(() => predicted(dir, { on: true }), /whole segments/);
  });

  it('rejects a formula in filename position', () => {
    // The renderer classifies `$if{on}.hbs` as malformed rather than as a
    // filename formula, because the extension makes it a partial match. Our
    // mirror has to reach the same verdict for the same reason.
    assert.throws(
      () => resolveOutputPath(path.join('d', '$if{on}.hbs'), { on: true }),
      /whole segments/
    );
    // A bare formula filename is the case the filename rule itself covers.
    assert.throws(
      () => resolveOutputPath(path.join('d', '$if{on}'), { on: true }),
      /not allowed in a filename/
    );
  });

  it('treats present-but-falsy as false, not as absent', async () => {
    const dir = template({ '$if{v}/x.md.hbs': 'x' });
    for (const v of [0, '', null]) {
      assert.deepEqual(predicted(dir, { v }), await rendered(dir, { v }));
    }
  });

  it('leaves paths raw when no view is given', () => {
    const dir = template({ '$if{on}/x.md.hbs': 'x' });
    assert.deepEqual(listOutputPaths(dir), [
      {
        templateRel: path.join('$if{on}', 'x.md.hbs'),
        outputRel: path.join('$if{on}', 'x.md'),
      },
    ]);
  });
});
