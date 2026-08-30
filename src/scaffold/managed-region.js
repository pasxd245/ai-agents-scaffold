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
const START_LINE_RE = /^[ \t]*<!--\s*a2scaffold:start[^>]*-->[ \t]*$/;
const END_LINE_RE = /^[ \t]*<!--\s*a2scaffold:end[^>]*-->[ \t]*$/;

/** A fence opener: ``` or ~~~ (three or more), indented up to three spaces. */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Locate the file's one managed region, or report that it has none.
 *
 * Own-line matching is not enough on its own. A fenced Markdown example that
 * *shows* what a generated stub looks like puts real markers on real lines:
 *
 * ````markdown
 * ```markdown
 * <!-- a2scaffold:start -->
 * example
 * <!-- a2scaffold:end -->
 * ```
 * ````
 *
 * Treating that as a managed region would let a merge overwrite the author's
 * example — the one thing the region exists to prevent. So markers inside a
 * fenced code block do not count.
 *
 * This fails closed. Zero markers, duplicates, a pair the wrong way round, a
 * start with no end — all of them return `null` rather than a best guess, and
 * the caller falls back to its ordinary rules, which refuse to destroy
 * anything without an explicit permission. Being unsure is a reason to leave
 * a file alone, not a reason to pick a boundary.
 *
 * @param {string} text
 * @returns {{ start: number, end: number } | null} offsets into `text`, where
 *   `end` is just past the closing marker
 */
function findRegion(text) {
  /** @type {number[]} */
  const starts = [];
  /** @type {number[]} */
  const ends = [];

  /** @type {string | null} */
  let fence = null;
  let offset = 0;

  for (const line of text.split('\n')) {
    const opener = FENCE_RE.exec(line);
    if (fence === null) {
      if (opener) {
        fence = opener[1];
      } else if (START_LINE_RE.test(line)) {
        starts.push(offset);
      } else if (END_LINE_RE.test(line)) {
        ends.push(offset + line.replace(/\r$/, '').length);
      }
    } else if (
      opener &&
      opener[1][0] === fence[0] &&
      opener[1].length >= fence.length &&
      line.slice(opener[0].length).trim() === ''
    ) {
      fence = null;
    }
    offset += line.length + 1;
  }

  if (starts.length !== 1 || ends.length !== 1) return null;
  if (ends[0] <= starts[0]) return null;
  return { start: starts[0], end: ends[0] };
}

/**
 * Whether a file carries exactly one complete, correctly ordered managed
 * region outside any fenced code block.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function hasManagedRegion(text) {
  return findRegion(text) !== null;
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
  const source = findRegion(incoming);
  const target = findRegion(existing);
  if (!source || !target) return null;

  return (
    existing.slice(0, target.start) +
    incoming.slice(source.start, source.end) +
    existing.slice(target.end)
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
  const source = findRegion(incoming);
  if (!source) return null;
  if (findRegion(existing)) return null;

  const generated = incoming.slice(source.start, source.end);

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
