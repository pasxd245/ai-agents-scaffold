import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { listTemplates, resolveTemplatePath } from '../src/templates/index.js';

const scaffoldDir = path.dirname(
  path.dirname(resolveTemplatePath('scaffold/base').templateDir)
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

  it('discovers nested scaffold templates', () => {
    const tempDir = fs.mkdtempSync(path.join(scaffoldDir, 'group-'));
    const groupName = path.basename(tempDir);
    const innerDir = path.join(tempDir, 'leaf');
    try {
      fs.mkdirSync(path.join(innerDir, 'template'), { recursive: true });
      fs.writeFileSync(
        path.join(innerDir, 'values.yaml'),
        'project:\n  name: nested\n'
      );

      const templates = listTemplates();
      assert.ok(templates.includes(`${groupName}/leaf`));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('discovers templates with no values.yaml (only template/)', () => {
    const tempDir = fs.mkdtempSync(path.join(scaffoldDir, 'minimal-'));
    const tplName = path.basename(tempDir);
    try {
      fs.mkdirSync(path.join(tempDir, 'template'));
      const templates = listTemplates();
      assert.ok(
        templates.includes(tplName),
        `expected listTemplates to include ${tplName}, got ${templates.join(', ')}`
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('resolveTemplatePath', () => {
  it('returns valid paths for "scaffold/base" template', () => {
    const paths = resolveTemplatePath('scaffold/base');
    assert.ok(paths.templateDir.endsWith('/templates/scaffold/base/template'));
    assert.ok(
      paths.valuesFile.endsWith('/templates/scaffold/base/values.yaml')
    );
    assert.ok(paths.partialsDir.endsWith('/templates/scaffold/base/partials'));
  });

  it('resolves the singular skill-ref template', () => {
    const paths = resolveTemplatePath('skill-ref');
    assert.ok(paths.templateDir.endsWith('/templates/skill-ref/template'));
    assert.ok(paths.valuesFile.endsWith('/templates/skill-ref/values.yaml'));
  });

  it('allows templates without a partials directory', () => {
    const tempDir = fs.mkdtempSync(path.join(scaffoldDir, 'test-template-'));

    try {
      fs.mkdirSync(path.join(tempDir, 'template'));
      fs.writeFileSync(
        path.join(tempDir, 'values.yaml'),
        'project:\n  name: test\n'
      );

      const paths = resolveTemplatePath(`scaffold/${path.basename(tempDir)}`);
      assert.equal(paths.templateDir, path.join(tempDir, 'template'));
      assert.equal(paths.valuesFile, path.join(tempDir, 'values.yaml'));
      assert.equal(paths.partialsDir, undefined);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('allows templates without values.yaml', () => {
    const tempDir = fs.mkdtempSync(path.join(scaffoldDir, 'test-noval-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'template'));
      const paths = resolveTemplatePath(`scaffold/${path.basename(tempDir)}`);
      assert.equal(paths.valuesFile, undefined);
      assert.equal(paths.valuesDir, undefined);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects values/ directory when present', () => {
    const tempDir = fs.mkdtempSync(path.join(scaffoldDir, 'test-valdir-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'template'));
      fs.mkdirSync(path.join(tempDir, 'values'));
      fs.writeFileSync(
        path.join(tempDir, 'values', 'project.yaml'),
        'name: from-dir\n'
      );
      const paths = resolveTemplatePath(`scaffold/${path.basename(tempDir)}`);
      assert.equal(paths.valuesDir, path.join(tempDir, 'values'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('throws for unknown template', () => {
    assert.throws(
      () => resolveTemplatePath('scaffold/nonexistent'),
      /Template "scaffold\/nonexistent" not found/
    );
  });

  it('error message lists available templates', () => {
    try {
      resolveTemplatePath('scaffold/nonexistent');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('base'));
    }
  });
});
