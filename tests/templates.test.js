import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listTemplates, resolveTemplatePath } from '../src/templates.js';

describe('listTemplates', () => {
  it('returns an array containing "base"', () => {
    const templates = listTemplates();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.includes('base'));
  });

  it('returns sorted template names', () => {
    const templates = listTemplates();
    const sorted = [...templates].sort();
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
