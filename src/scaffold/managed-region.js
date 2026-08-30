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

/**
 * Adopt an existing file that predates the tool.
 *
 * The merge above needs a managed region on *both* sides, so it cannot help
 * the one moment every adopter passes through: the first scaffold of a repo
 * that already has a hand-written `AGENTS.md` or `CLAUDE.md`. Before this,
 * `--force` deleted that file's content outright.
 *
 * Adoption inserts the generated block into the file and leaves everything
 * else exactly where it was. The author's content ends up below the end
 * marker, which is where user content belongs anyway, and the file carries
 * markers from then on — so every later run takes the ordinary merge path.
 *
 * Returns `null` when adoption does not apply, so the caller can fall back to
 * its normal rules:
 * - the incoming render has no managed region (`.agents/` canon), or
 * - the existing file already has one (that is `mergeManagedRegion`'s job).
 *
 * @param {string} existing - Current file contents, written by a human
 * @param {string} incoming - Freshly rendered contents
 * @returns {string | null} adopted contents, or null if not adoptable
 */
export function adoptManagedRegion(existing, incoming) {
  if (!hasManagedRegion(incoming)) return null;
  if (hasManagedRegion(existing)) return null;

  const endMatch = incoming.match(END_RE);
  if (!endMatch) return null;
  const start = incoming.search(START_RE);
  const end = incoming.search(END_RE) + endMatch[0].length;
  const generated = incoming.slice(start, end);

  const at = insertionPoint(existing);
  const before = existing.slice(0, at).replace(/\s*$/, '');
  const after = existing.slice(at).replace(/^\s*/, '');

  return [
    before,
    before ? '\n\n' : '',
    generated,
    after ? `\n\n${after}` : '\n',
  ].join('');
}

/**
 * Where the generated block goes in a file the tool did not write.
 *
 * Below the title, so the file still opens with the author's own heading —
 * the same reason the rendered stubs keep their `# ` line outside the region.
 * Frontmatter, if any, stays first; some harnesses require it there.
 *
 * @param {string} text
 * @returns {number} character offset to insert at
 */
function insertionPoint(text) {
  let offset = 0;

  const frontmatter = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/);
  if (frontmatter) offset = frontmatter[0].length;

  const heading = text
    .slice(offset)
    .match(/^[ \t]*\r?\n*(#[ \t][^\n]*)(\r?\n|$)/);
  if (heading) offset += heading[0].length;

  return offset;
}
