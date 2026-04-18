import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

/**
 * Sparse-clone a GitHub repo into a temp directory and invoke a callback
 * with the cloned path. Cleans up the temp dir when done.
 *
 * Uses `git clone --depth 1 --filter=blob:none --sparse`; only the
 * requested sub-path is materialized. The callback's return value is
 * returned to the caller.
 *
 * @template T
 * @param {{ owner: string, repo: string, ref?: string, subPath?: string }} opts
 * @param {(clonedDir: string) => T} callback - Invoked with the path to the
 *   cloned root (or sub-path, when `subPath` is given)
 * @returns {T}
 */
export function sparseCloneGitHub(opts, callback) {
  const { owner, repo, ref, subPath } = opts;
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  const tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'a2scaffold-dl-'));

  try {
    const cloneArgs = [
      'clone',
      '--depth',
      '1',
      '--filter=blob:none',
      '--sparse',
    ];
    if (ref) {
      cloneArgs.push('--branch', ref);
    }
    cloneArgs.push(repoUrl, tmpDir);

    execFileSync('git', cloneArgs, { stdio: 'pipe' });

    if (subPath) {
      execFileSync('git', ['sparse-checkout', 'set', subPath], {
        cwd: tmpDir,
        stdio: 'pipe',
      });
    }

    const resolvedDir = subPath ? path.join(tmpDir, subPath) : tmpDir;

    if (!fs.existsSync(resolvedDir)) {
      throw new Error(`Path "${subPath}" not found in ${owner}/${repo}`);
    }

    return callback(resolvedDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
