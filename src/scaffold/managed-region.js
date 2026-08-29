/**
 * Managed regions.
 *
 * A generated stub is meant to be edited. People add harness-specific notes
 * below it, and re-running the scaffold used to overwrite the file wholesale
 * and take those edits with it — observed in a real project whose `CLAUDE.md`
 * had accumulated a generated block and hand-written sections side by side.
 *
 * So generated content is fenced. On a re-scaffold only the fenced region is
 * replaced; everything outside it is the author's and survives untouched.
 *
 * The markers are HTML comments: invisible in rendered markdown, and stripped
 * by harnesses that strip comments before injecting the file, so they cost
 * nothing at read time.
 */

/** Opening marker. Trailing prose after the tag is allowed and ignored. */
export const REGION_START = '<!-- a2scaffold:start -->';

/** Closing marker. */
export const REGION_END = '<!-- a2scaffold:end -->';

// A marker must occupy its own line. Documentation that mentions the markers
// inline — `<!-- a2scaffold:start -->` inside backticks, as this repo's own
// reference docs do — must not turn that file into a managed one, or a merge
// would splice it at the wrong boundaries.
const START_RE = /^[ \t]*<!--\s*a2scaffold:start[^>]*-->[ \t]*$/m;
const END_RE = /^[ \t]*<!--\s*a2scaffold:end[^>]*-->[ \t]*$/m;

/**
 * Whether a file carries a complete, correctly ordered managed region.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function hasManagedRegion(text) {
  const start = text.search(START_RE);
  if (start === -1) return false;
  const end = text.search(END_RE);
  return end > start;
}

/**
 * Replace the managed region of `existing` with the one from `incoming`.
 *
 * Returns `null` when the merge cannot be done safely — either side missing a
 * region — so the caller can fall back to its normal overwrite rules rather
 * than guessing.
 *
 * @param {string} existing - Current file contents, with the author's edits
 * @param {string} incoming - Freshly rendered contents
 * @returns {string | null} merged contents, or null if not mergeable
 */
export function mergeManagedRegion(existing, incoming) {
  if (!hasManagedRegion(existing) || !hasManagedRegion(incoming)) return null;

  const incomingStart = incoming.search(START_RE);
  const incomingEndMatch = incoming.match(END_RE);
  if (!incomingEndMatch) return null;
  const incomingEnd = incoming.search(END_RE) + incomingEndMatch[0].length;
  const generated = incoming.slice(incomingStart, incomingEnd);

  const existingStart = existing.search(START_RE);
  const existingEndMatch = existing.match(END_RE);
  if (!existingEndMatch) return null;
  const existingEnd = existing.search(END_RE) + existingEndMatch[0].length;

  return (
    existing.slice(0, existingStart) + generated + existing.slice(existingEnd)
  );
}
