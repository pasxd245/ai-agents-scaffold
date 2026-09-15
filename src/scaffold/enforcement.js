/**
 * Enforcement drift.
 *
 * `.claude/settings.json` is seeded, but a required `ask` rule that has gone
 * missing is canon the harness no longer guards, so sync reports it. Byte
 * comparison would flag every reformat and every rule the user added, and a
 * warning that is usually wrong gets skipped; so the question is whether each
 * required rule is present **verbatim** — same string, same list.
 *
 * Verbatim is a deliberate limit and the report says so. Deciding whether a
 * broader user rule subsumes a required one is the harness's grammar, and
 * getting it subtly wrong would turn a warning into false reassurance.
 */

/**
 * Compare one enforcement file and list the rules it is missing.
 *
 * @param {string} rel - Output-relative path, POSIX-separated
 * @param {string} existing - The repository's copy
 * @param {string} incoming - The freshly rendered copy
 * @returns {string[]} required rules not present verbatim in `existing`; empty
 *   when the file carries every rule the template asks for, as written
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
 * Rules in `incoming`'s permission lists that `existing` does not carry as the
 * same string in the same list.
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
