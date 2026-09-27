import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { loadRc } from '../src/config/rc.js';

describe('loadRc', () => {
  let home;
  let project;
  let savedHome;

  beforeEach(() => {
    // `os.homedir()` reads HOME on POSIX, so an empty one keeps the
    // developer's own ~/.a2scaffold out of the assertions.
    savedHome = process.env.HOME;
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-rc-home-'));
    project = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-rc-project-'));
    process.env.HOME = home;
  });

  afterEach(() => {
    process.env.HOME = savedHome;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(project, { recursive: true, force: true });
  });

  it('carries keys the CLI does not read, instead of dropping them', () => {
    // The file has other readers. `mergeRc` used to build its result from
    // scratch and copy only `registries`, so a project rc holding `tmpDir`
    // and `research` and nothing else was read and discarded in full.
    fs.mkdirSync(path.join(project, '.a2scaffold'));
    fs.writeFileSync(
      path.join(project, '.a2scaffold', '.a2scaffoldrc.json'),
      JSON.stringify({
        tmpDir: '.agents/tmp',
        research: { crawler: { maxDepth: 2 } },
      })
    );

    const rc = loadRc(project);
    assert.equal(rc.tmpDir, '.agents/tmp');
    assert.deepEqual(rc.research, { crawler: { maxDepth: 2 } });
    assert.ok(!('registries' in rc), 'no registries means no registries key');
  });

  it('lets the project override the user for a top-level key', () => {
    fs.mkdirSync(path.join(home, '.a2scaffold'));
    fs.writeFileSync(
      path.join(home, '.a2scaffold', '.a2scaffoldrc.json'),
      JSON.stringify({ tmpDir: 'from-user', registries: { a: { url: 'u' } } })
    );
    fs.writeFileSync(
      path.join(project, '.a2scaffoldrc.json'),
      JSON.stringify({
        tmpDir: 'from-project',
        registries: { b: { url: 'p' } },
      })
    );

    const rc = loadRc(project);
    assert.equal(rc.tmpDir, 'from-project');
    assert.deepEqual(Object.keys(rc.registries).sort(), ['a', 'b']);
  });

  it('refuses a project that has both rc forms', () => {
    fs.mkdirSync(path.join(project, '.a2scaffold'));
    fs.writeFileSync(
      path.join(project, '.a2scaffold', '.a2scaffoldrc.json'),
      '{}'
    );
    fs.writeFileSync(path.join(project, '.a2scaffoldrc.json'), '{}');
    assert.throws(() => loadRc(project), /Keep only one/);
  });
});
