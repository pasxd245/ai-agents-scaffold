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
//
// At most three leading spaces, the same bound the fence parser below uses.
// Four spaces or a tab is an indented code block in CommonMark, and a marker
// inside one is an example, not a region — a merge was found replacing exactly
// such an example, with no flag asked for, because the old pattern accepted
// any amount of indentation.
const START_LINE_RE = /^ {0,3}<!--\s*a2scaffold:start[^>]*-->[ \t]*$/;
const END_LINE_RE = /^ {0,3}<!--\s*a2scaffold:end[^>]*-->[ \t]*$/;

/** A fence opener: ``` or ~~~ (three or more), indented up to three spaces. */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * What a file's markers amount to.
 *
 * - `none` — no marker outside a code block. The file predates the tool, or
 *   is canon that never had a region; adoption is the only thing that applies.
 * - `valid` — exactly one start followed by exactly one end. The only state a
 *   merge is allowed to act on.
 * - `ambiguous` — markers are present but do not form one region: a pair
 *   duplicated, an end before a start, a start with no end. Nothing applies.
 *   Adopting would add a second block to a file that already has a broken
 *   one, and merging would have to guess a boundary. The file is reported
 *   for a human to repair.
 *
 * The three are kept apart because the first and third used to share a
 * `null`, and adoption read that `null` as "marker-less" — so `--adopt` on a
 * file with duplicated markers reported success and left a third pair behind.
 *
 * @typedef {{ kind: 'none' }
 *   | { kind: 'valid', start: number, end: number }
 *   | { kind: 'ambiguous', reason: string }} RegionState
 */

/**
 * Classify the file's markers; see {@link RegionState}.
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
 * fenced code block do not count, and neither do markers indented four spaces
 * or more, which CommonMark reads as an indented code block.
 *
 * @param {string} text
 * @returns {RegionState} offsets, when `valid`, index into `text`, with `end`
 *   just past the closing marker
 */
export function classifyRegion(text) {
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

  if (starts.length === 0 && ends.length === 0) return { kind: 'none' };
  if (starts.length > 1 || ends.length > 1) {
    return { kind: 'ambiguous', reason: 'more than one marker pair' };
  }
  if (starts.length !== ends.length) {
    return {
      kind: 'ambiguous',
      reason: starts.length
        ? 'start marker with no end'
        : 'end marker with no start',
    };
  }
  if (ends[0] <= starts[0]) {
    return { kind: 'ambiguous', reason: 'end marker before start marker' };
  }
  return { kind: 'valid', start: starts[0], end: ends[0] };
}

/**
 * Offsets of the one valid region, or `null` for anything else.
 *
 * This fails closed. Zero markers, duplicates, a pair the wrong way round, a
 * start with no end — all of them return `null` rather than a best guess, and
 * the caller falls back to its ordinary rules, which refuse to destroy
 * anything without an explicit permission. Being unsure is a reason to leave
 * a file alone, not a reason to pick a boundary.
 *
 * @param {string} text
 * @returns {{ start: number, end: number } | null}
 */
function findRegion(text) {
  const state = classifyRegion(text);
  return state.kind === 'valid' ? { start: state.start, end: state.end } : null;
}

/**
 * Whether a file carries exactly one complete, correctly ordered managed
 * region outside any code block.
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
 * - the incoming render has no managed region (`.agents/` canon),
 * - the existing file already has one (that is `mergeManagedRegion`'s job), or
 * - the existing file has markers that do not form a region. Inserting a
 *   block next to a broken pair would leave the file just as unmergeable and
 *   harder to repair, so an `ambiguous` file is never adopted — only reported.
 *
 * @param {string} existing - Current file contents, written by a human
 * @param {string} incoming - Freshly rendered contents
 * @returns {string | null} adopted contents, or null if not adoptable
 */
export function adoptManagedRegion(existing, incoming) {
  const source = findRegion(incoming);
  if (!source) return null;
  if (classifyRegion(existing).kind !== 'none') return null;

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
