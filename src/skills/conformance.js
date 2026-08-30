/**
 * Conformance scoring for SKILL.md files.
 *
 * Separate from {@link import('./validate.js').validateSkill} on purpose:
 * `validateSkill` reports hard spec violations that make a skill invalid,
 * while this module reports quality problems that make a skill *work badly*
 * without making it malformed.
 *
 * Warnings never block an install. A skill whose description is too vague to
 * trigger reliably is still a valid skill; the author just needs to know.
 */

/**
 * Frontmatter keys recognised by the agentskills.io spec and by Claude Code.
 * Anything else is likely a typo (`when-to-use` for `when_to_use`) and is
 * reported so it doesn't fail silently.
 */
const KNOWN_KEYS = new Set([
  'name',
  'description',
  'when_to_use',
  'compatibility',
  'metadata',
  'license',
  'version',
  'allowed-tools',
  'disable-model-invocation',
  'user-invocable',
  'argument-hint',
  'arguments',
  'context',
  'model',
]);

/** Claude Code truncates `description` + `when_to_use` at this width in the skill listing. */
const LISTING_CAP = 1536;

/** Recommended ceiling for the SKILL.md body, in tokens. */
const BODY_TOKEN_BUDGET = 5000;

/** Rough chars-per-token ratio; good enough to catch a body that is far over budget. */
const CHARS_PER_TOKEN = 4;

/**
 * Minimum description length in words. Sourced from the Skilldex conformance
 * spec, not from Anthropic's — a description shorter than this rarely carries
 * enough signal for the model to match a task against it.
 */
const MIN_DESC_WORDS = 30;

/** Phrases that signal a description says *when* to use the skill, not only what it does. */
const TRIGGER_HINTS =
  /\b(use (this|it|when|before|after|during|while)|when (you|the|a|an|asked)|whenever|triggers?|applies when|skip (for|when)|for (creating|reviewing|writing|running|debugging))\b/i;

/**
 * Weight subtracted from the score for each warning code. A warning may carry
 * its own `weight` to scale the penalty with severity — a description one word
 * under the recommendation should not cost the same as a five-word one.
 *
 * @type {Record<string, number>}
 */
const PENALTY = {
  'description-too-short': 20,
  'description-no-trigger': 15,
  'listing-cap-exceeded': 15,
  'body-over-budget': 15,
  'body-empty': 20,
  'unknown-frontmatter-key': 5,
};

/**
 * @typedef {object} ConformanceWarning
 * @property {string} code    - Stable identifier, e.g. `description-too-short`
 * @property {string} message - Human-readable description of the problem
 * @property {number} [weight] - 0-1 severity multiplier applied to the penalty
 */

/**
 * @typedef {object} ConformanceReport
 * @property {number} score - 0-100 local guidance score. The weights below are
 *   chosen rather than calibrated and the checks draw on several sources, so
 *   this orders skills roughly; it does not rate them against one published
 *   specification. The warnings are the substance.
 * @property {ConformanceWarning[]} warnings
 */

/**
 * Score a parsed SKILL.md for problems that make it work badly.
 *
 * @param {import('../utils/frontmatter.js').Frontmatter} frontmatter
 * @param {string} body - Markdown body below the frontmatter
 * @param {{ isRef?: boolean }} [options] - Skill-refs are pointers, so body and
 *   description checks don't apply to them.
 * @returns {ConformanceReport}
 */
export function scoreConformance(frontmatter, body, options = {}) {
  /** @type {ConformanceWarning[]} */
  const warnings = [];

  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [weight] - 0-1 severity multiplier
   */
  const warn = (code, message, weight = 1) =>
    warnings.push({ code, message, weight });

  const description = frontmatter?.description
    ? String(frontmatter.description)
    : '';
  const whenToUse = frontmatter?.when_to_use
    ? String(frontmatter.when_to_use)
    : '';

  if (!options.isRef && description) {
    const words = description.trim().split(/\s+/).length;
    if (words < MIN_DESC_WORDS) {
      warn(
        'description-too-short',
        `description is ${words} words; ${MIN_DESC_WORDS}+ helps the model match tasks to it reliably`,
        (MIN_DESC_WORDS - words) / MIN_DESC_WORDS
      );
    }
    if (!TRIGGER_HINTS.test(`${description} ${whenToUse}`)) {
      warn(
        'description-no-trigger',
        'description says what the skill does but not when to use it — add a trigger phrase, or a when_to_use field'
      );
    }
  }

  const listingLength = description.length + whenToUse.length;
  if (listingLength > LISTING_CAP) {
    warn(
      'listing-cap-exceeded',
      `description + when_to_use is ${listingLength} characters; the skill listing truncates at ${LISTING_CAP}`
    );
  }

  if (!options.isRef) {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      warn('body-empty', 'SKILL.md has frontmatter but no instructions');
    } else {
      const tokens = Math.round(trimmed.length / CHARS_PER_TOKEN);
      if (tokens > BODY_TOKEN_BUDGET) {
        warn(
          'body-over-budget',
          `body is ~${tokens} tokens; keep it under ${BODY_TOKEN_BUDGET} and move detail into references/`
        );
      }
    }
  }

  for (const key of Object.keys(frontmatter ?? {})) {
    if (!KNOWN_KEYS.has(key)) {
      warn('unknown-frontmatter-key', `unrecognised frontmatter key: ${key}`);
    }
  }

  const deducted = warnings.reduce(
    (sum, w) => sum + (PENALTY[w.code] ?? 5) * (w.weight ?? 1),
    0
  );
  const score = Math.max(0, Math.round(100 - deducted));

  return { score, warnings };
}
