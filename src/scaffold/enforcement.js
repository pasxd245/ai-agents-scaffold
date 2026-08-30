/**
 * Enforcement drift.
 *
 * `.claude/settings.json` is seeded like the rest of the scaffold, but falling
 * behind it has a cost a stale doc does not: an `ask` rule protecting a new
 * directory is canon the harness is no longer guarding. So sync reports it.
 *
 * Reporting it on *any* byte difference does not work. The file is the user's
 * to extend — their own rules, their own key order, whatever their formatter
 * does to it — and every one of those differences would raise the same
 * "behind the template" warning, forever, on a file that is missing nothing.
 * A warning that is usually wrong is a warning people learn to skip past,
 * which is exactly the protection the message claims to be defending.
 *
 * So the question asked here is the one the message actually means: is every
 * rule the template requires still present? Additions are fine. Formatting is
 * fine. A missing rule is the finding.
 */

/**
 * Compare one enforcement file and list the rules it is missing.
 *
 * @param {string} rel - Output-relative path, POSIX-separated
 * @param {string} existing - The repository's copy
 * @param {string} incoming - The freshly rendered copy
 * @returns {string[]} required rules absent from `existing`; empty when the
 *   file carries everything the template asks for
 */
export function missingEnforcement(rel, existing, incoming) {
  if (rel === '.claude/settings.json') {
    return missingClaudePermissions(existing, incoming);
  }
  // An enforcement file with no semantic reader falls back to bytes: better a
  // noisy report than a silent gap in something registered as protection.
  return existing === incoming ? [] : ['file differs from the template'];
}

/**
 * Rules in `incoming`'s permission lists that `existing` does not carry.
 *
 * @param {string} existing
 * @param {string} incoming
 * @returns {string[]}
 */
function missingClaudePermissions(existing, incoming) {
  const required = parse(incoming);
  const present = parse(existing);

  if (!required) return [];
  if (!present) {
    return ['file is not valid JSON, so its rules could not be checked'];
  }

  /** @type {string[]} */
  const missing = [];
  for (const list of ['deny', 'ask', 'allow']) {
    const have = new Set(rules(present, list));
    for (const rule of rules(required, list)) {
      if (!have.has(rule)) missing.push(`permissions.${list}: ${rule}`);
    }
  }
  return missing;
}

/**
 * @param {string} text
 * @returns {Record<string, any> | null}
 */
function parse(text) {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, any>} settings
 * @param {string} list - `deny`, `ask` or `allow`
 * @returns {string[]}
 */
function rules(settings, list) {
  const value = settings.permissions?.[list];
  return Array.isArray(value) ? value.map(String) : [];
}
