/**
 * Harness config drift.
 *
 * `.claude/settings.json` and `.gemini/settings.json` are seeded, but a
 * required entry that has gone missing is a gap with a cost: an `ask` rule
 * gone is canon the harness no longer guards, `AGENTS.md` gone from
 * `context.fileName` is a harness that no longer reads the instructions. So
 * sync reports it. Byte comparison would flag every reformat and every
 * setting the user added, and a warning that is usually wrong gets skipped;
 * so the question is whether each required entry is present **verbatim** —
 * same string, same list.
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
  if (rel === '.gemini/settings.json') {
    return missingGeminiContext(existing, incoming);
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
 * Names in `incoming`'s `context.fileName` that `existing` does not list.
 *
 * Gemini CLI accepts a string or an array there, and setting it replaces the
 * default (`GEMINI.md`) rather than adding to it — which is why the template
 * lists both names, and why a list that lost `AGENTS.md` is worth a report.
 *
 * @param {string} existing
 * @param {string} incoming
 * @returns {string[]}
 */
function missingGeminiContext(existing, incoming) {
  const required = parse(incoming);
  const present = parse(existing);

  if (!required) return [];
  if (!present) {
    return [
      'file is not valid JSON, so its context files could not be checked',
    ];
  }

  const have = new Set(fileNames(present));
  return fileNames(required)
    .filter((name) => !have.has(name))
    .map((name) => `context.fileName: ${name}`);
}

/**
 * @param {Record<string, any>} settings
 * @returns {string[]}
 */
function fileNames(settings) {
  const value = settings.context?.fileName;
  if (Array.isArray(value)) return value.map(String);
  return typeof value === 'string' ? [value] : [];
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
