import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as a2scaffold from '../src/index.js';

/**
 * The package root is the only import path a consumer has — `exports` in
 * package.json publishes nothing else — so a name that `docs/api.md` tells
 * callers to use has to be here or the docs are wrong. `ScaffoldRefusal` was
 * documented as catchable and not exported, which left `instanceof` with
 * nothing to check against.
 */
describe('package root exports', () => {
  const documented = [
    // scaffold
    'scaffold',
    'ScaffoldRefusal',
    'sync',
    'checkExistingFiles',
    'classifyConflicts',
    'resolveScaffoldConfig',
    'listOutputPaths',
    'hasManagedRegion',
    'classifyRegion',
    // templates
    'listTemplates',
    'resolveTemplatePath',
    // skills
    'validateSkill',
    'scoreConformance',
    'auditSkill',
    'listSkills',
    'installSkill',
    'parseSkillSource',
    'isSkillRef',
    'discoverSkills',
    'installSkillRef',
  ];

  it('exposes every documented name', () => {
    for (const name of documented) {
      assert.ok(name in a2scaffold, `missing export: ${name}`);
    }
  });

  it('exposes nothing the API guide does not describe', () => {
    // A new export is a new contract; add it to the list and to docs/api.md
    // in the same change.
    assert.deepEqual(Object.keys(a2scaffold).sort(), [...documented].sort());
  });

  it('exports a ScaffoldRefusal that instanceof can check', () => {
    const err = new a2scaffold.ScaffoldRefusal(['AGENTS.md'], []);
    assert.ok(err instanceof a2scaffold.ScaffoldRefusal);
    assert.ok(err instanceof Error);
    assert.deepEqual(err.needsAdopt, ['AGENTS.md']);
    assert.deepEqual(err.needsForce, []);
  });
});
