import fs from 'node:fs';
import path from 'node:path';

import { BUILTIN_SKILLS_DIR } from '../templates/index.js';
import { parseSkillSource } from './parse-source.js';

/** @typedef {import('../config/rc.js').A2ScaffoldRc} A2ScaffoldRc */
/** @typedef {import('../config/rc.js').RegistryConfig} RegistryConfig */

/**
 * @typedef {{ type: 'local', localPath: string }} LocalSource
 * @typedef {{ type: 'github', owner: string, repo: string, skillPath: string, ref: string }} GitHubSource
 * @typedef {LocalSource | GitHubSource} ResolvedSource
 */

/**
 * Whether a source string is an explicit local filesystem path.
 *
 * @param {string} source
 */
function isExplicitLocalPath(source) {
  return (
    source.startsWith('./') ||
    source.startsWith('../') ||
    source.startsWith('/')
  );
}

/**
 * Whether a source string is an explicit GitHub URL.
 *
 * @param {string} source
 */
function isGitHubUrl(source) {
  return /^https?:\/\/github\.com\//.test(source);
}

/**
 * Translate a `github:owner/repo` shorthand into `owner/repo` parts.
 *
 * @param {string} url
 * @returns {{ owner: string, repo: string } | null}
 */
function parseGitHubShorthand(url) {
  const match = url.match(/^github:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * @param {RegistryConfig} registry
 * @param {string} skillName
 * @returns {GitHubSource}
 */
function registryToSource(registry, skillName) {
  const parsed = parseGitHubShorthand(registry.url);
  if (!parsed) {
    throw new Error(
      `Registry url "${registry.url}" is not a supported form. ` +
        'Expected "github:<owner>/<repo>".'
    );
  }
  const subPath = registry.path
    ? `${registry.path.replace(/\/+$/, '')}/${skillName}`
    : skillName;
  return {
    type: 'github',
    owner: parsed.owner,
    repo: parsed.repo,
    skillPath: subPath,
    ref: registry.ref ?? '',
  };
}

/**
 * Resolve a `skill add` source to a concrete fetch plan.
 *
 * Resolution order:
 *   1. Explicit local path (./, ../, /) → filesystem
 *   2. Explicit GitHub URL → parsed via parseSkillSource
 *   3. `--from <registry>` set → registry lookup (rc-defined)
 *   4. Bare/nested name → built-in local skill pool (templates/skills/)
 *   5. Otherwise: fail with a hint
 *
 * Note: bare GitHub shorthand (`owner/repo[/path]`) is intentionally NOT
 * accepted here — use `--from <registry>` for network resolution instead.
 *
 * @param {string} source
 * @param {{ from?: string, rc: A2ScaffoldRc }} options
 * @returns {ResolvedSource}
 */
export function resolveSkillSource(source, { from, rc }) {
  if (isExplicitLocalPath(source) || isGitHubUrl(source)) {
    return parseSkillSource(source);
  }

  if (from) {
    const registry = rc.registries?.[from];
    if (!registry) {
      const known = Object.keys(rc.registries ?? {});
      const hint = known.length
        ? `Known registries: ${known.join(', ')}`
        : 'No registries are configured. Add one to .a2scaffoldrc.json under "registries".';
      throw new Error(`Unknown registry "${from}". ${hint}`);
    }
    return registryToSource(registry, source);
  }

  const localPath = path.join(BUILTIN_SKILLS_DIR, source);
  if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
    return { type: 'local', localPath };
  }

  const known = Object.keys(rc.registries ?? {});
  const registryHint = known.length
    ? `\n  Or fetch from a registry: a2scaffold skill add ${source} --from ${known[0]}`
    : '';
  throw new Error(
    `Skill "${source}" not found in local pool (templates/skills/).${registryHint}`
  );
}
