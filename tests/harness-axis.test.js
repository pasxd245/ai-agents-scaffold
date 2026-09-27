import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { scaffold, resolveScaffoldConfig } from '../src/scaffold/index.js';

const TEMPLATE = 'scaffold/base';

/**
 * Two axes: `agents.*` decides which root instruction file is written,
 * `harness.*` decides which harness directory exists with its native config.
 * They used to be one group of flags, so "no GEMINI.md, but keep .gemini/"
 * could not be said. The converged layout — root AGENTS.md as the one
 * instruction file — depends on saying it.
 */
describe('the two axes', () => {
  /** @param {Record<string, any>} overrides */
  const render = async (overrides) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-axis-'));
    await scaffold({ templateName: TEMPLATE, outputDir: dir, overrides });
    return dir;
  };
  const exists = (/** @type {string} */ dir, /** @type {string} */ rel) =>
    fs.existsSync(path.join(dir, rel));

  it('pins the converged Claude layout', async () => {
    // No CLAUDE.md, a root AGENTS.md that imports the knowledge base, and
    // the permission rules still in place: nothing kept this working before.
    const dir = await render({
      agents: { claude: false, agentsmd: true },
      harness: { claude: true },
    });
    try {
      assert.ok(!exists(dir, 'CLAUDE.md'));
      const agentsMd = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
      assert.match(agentsMd, /^@\.agents\/AGENTS\.md$/m);
      const settings = JSON.parse(
        fs.readFileSync(path.join(dir, '.claude/settings.json'), 'utf8')
      );
      assert.ok(settings.permissions.ask.includes('Edit(/.agents/context/**)'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('pins the converged Gemini layout', async () => {
    // Gemini CLI reads root AGENTS.md only when told to, and the telling is
    // project-level, so the tool can write it: no GEMINI.md, but a
    // .gemini/settings.json that lists AGENTS.md.
    const dir = await render({
      agents: { gemini: false, agentsmd: true },
      harness: { gemini: true },
    });
    try {
      assert.ok(!exists(dir, 'GEMINI.md'));
      const settings = JSON.parse(
        fs.readFileSync(path.join(dir, '.gemini/settings.json'), 'utf8')
      );
      assert.deepEqual(settings.context.fileName, ['AGENTS.md', 'GEMINI.md']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes the stub without the directory, and the directory without the stub', async () => {
    const stubOnly = await render({
      agents: { gemini: true },
      harness: { gemini: false, codex: false },
    });
    const dirOnly = await render({
      agents: { gemini: false },
      harness: { gemini: true, codex: true },
    });
    try {
      assert.ok(exists(stubOnly, 'GEMINI.md'));
      assert.ok(!exists(stubOnly, '.gemini'));
      assert.ok(!exists(stubOnly, '.codex'));
      assert.ok(!exists(dirOnly, 'GEMINI.md'));
      assert.ok(exists(dirOnly, '.gemini/settings.json'));
      assert.ok(exists(dirOnly, '.codex/.gitkeep'));
    } finally {
      for (const d of [stubOnly, dirOnly]) {
        fs.rmSync(d, { recursive: true, force: true });
      }
    }
  });

  it('keeps the defaults: CLAUDE.md on, .claude/ on, .gemini/ and .codex/ off', async () => {
    const dir = await render({});
    try {
      assert.ok(exists(dir, 'CLAUDE.md'));
      assert.ok(exists(dir, '.claude/settings.json'));
      assert.ok(!exists(dir, '.gemini'));
      assert.ok(!exists(dir, '.codex'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('retired values keys', () => {
  // A 0.2.x values file has to fail, and fail naming the new key. A key
  // that is silently ignored leaves a repo looking scaffolded when it is not.
  const attempt = (/** @type {Record<string, any>} */ overrides) => () =>
    resolveScaffoldConfig({
      templateName: TEMPLATE,
      outputDir: '.',
      overrides,
    });

  it('refuses guardrails.claude and names harness.claude', () => {
    assert.throws(
      attempt({ guardrails: { claude: true } }),
      /`guardrails\.claude` was renamed to `harness\.claude`/
    );
  });

  it('refuses agents.codex and names harness.codex', () => {
    assert.throws(
      attempt({ agents: { codex: false } }),
      /`agents\.codex` was renamed to `harness\.codex`/
    );
  });

  it('refuses a retired key set to false, not only a truthy one', () => {
    // `guardrails.claude: false` was the documented way to opt out. Ignoring
    // it would turn an opt-out into a silent opt-in.
    assert.throws(
      attempt({ guardrails: { claude: false } }),
      /harness\.claude/
    );
  });

  it('names every retired key in one message', () => {
    assert.throws(
      attempt({ guardrails: { claude: true }, agents: { codex: true } }),
      (err) =>
        err instanceof Error &&
        err.message.includes('harness.claude') &&
        err.message.includes('harness.codex')
    );
  });

  it('accepts the new keys', () => {
    assert.doesNotThrow(attempt({ harness: { claude: false, codex: true } }));
  });
});
