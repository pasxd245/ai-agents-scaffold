/**
 * Values keys that no longer exist, and what replaced them.
 *
 * Pre-1.0 a rename lands in one release with no alias — see
 * `.agents/decisions/2026-09-24-no-deprecation-window-pre-1.0.md`. The one
 * outcome worse than breaking is a key that is silently ignored: the repo
 * looks scaffolded and is not. So an old key is refused, and the refusal
 * names its replacement.
 */

/** @type {ReadonlyArray<{ key: string, replacement: string, since: string }>} */
export const RETIRED_KEYS = Object.freeze([
  { key: 'guardrails.claude', replacement: 'harness.claude', since: '0.3.0' },
  { key: 'agents.codex', replacement: 'harness.codex', since: '0.3.0' },
]);

/**
 * Whether `dotted` names a value present in `obj`, including one set to
 * `false` or `null` — presence is the question, not truthiness.
 *
 * @param {Record<string, any>} obj
 * @param {string} dotted
 * @returns {boolean}
 */
function has(obj, dotted) {
  /** @type {any} */
  let cur = obj;
  for (const part of dotted.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(part in cur)) return false;
    cur = cur[part];
  }
  return true;
}

/**
 * Throw if `values` uses a retired key.
 *
 * @param {Record<string, any>} values - Project values or API overrides
 * @param {string} [source] - Where they came from, for the message
 */
export function assertNoRetiredKeys(values, source = '.a2scaffold/values.*') {
  const found = RETIRED_KEYS.filter(({ key }) => has(values, key));
  if (found.length === 0) return;
  const lines = found.map(
    ({ key, replacement, since }) =>
      `  - \`${key}\` was renamed to \`${replacement}\` in ${since}`
  );
  throw new Error(
    `Retired values key${found.length > 1 ? 's' : ''} in ${source}:\n` +
      lines.join('\n') +
      '\nRename the key; the old name is refused rather than ignored.'
  );
}
