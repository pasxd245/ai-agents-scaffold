import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { listTemplates, resolveTemplatePath } from '../src/templates.js';

const templatesRoot = path.join(
  path.dirname(path.dirname(resolveTemplatePath('base').templateDir))
);

describe('listTemplates', () => {
  it('returns an array containing "base"', () => {
    const templates = listTemplates();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.includes('base'));
  });

  it('returns sorted template names', () => {
    const templates = listTemplates();
    const sorted = [...templates].sort((left, right) =>
      left.localeCompare(right)
    );
    assert.deepEqual(templates, sorted);
  });
});

describe('resolveTemplatePath', () => {
  it('returns valid paths for "base" template', () => {
    const paths = resolveTemplatePath('base');
    assert.ok(paths.templateDir.endsWith('/templates/base/template'));
    assert.ok(paths.valuesFile.endsWith('/templates/base/values.yaml'));
    assert.ok(paths.partialsDir.endsWith('/templates/base/partials'));
  });

  it('allows templates without a partials directory', () => {
    const tempDir = fs.mkdtempSync(path.join(templatesRoot, 'test-template-'));

    try {
      fs.mkdirSync(path.join(tempDir, 'template'));
      fs.writeFileSync(
        path.join(tempDir, 'values.yaml'),
        'project:\n  name: test\n'
      );

      const paths = resolveTemplatePath(path.basename(tempDir));
      assert.equal(paths.templateDir, path.join(tempDir, 'template'));
      assert.equal(paths.valuesFile, path.join(tempDir, 'values.yaml'));
      assert.equal(paths.partialsDir, undefined);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('throws for unknown template', () => {
    assert.throws(
      () => resolveTemplatePath('nonexistent'),
      /Template "nonexistent" not found/
    );
  });

  it('error message lists available templates', () => {
    try {
      resolveTemplatePath('nonexistent');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('base'));
    }
  });
});
