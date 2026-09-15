/**
 * Managed regions.
 *
 * Generated stubs fence their generated content between two markers. A
 * re-scaffold or sync replaces only the fenced region; everything outside it
 * is the author's. The markers are HTML comments, so they are invisible in
 * rendered markdown and cost nothing at read time.
 */

/** Opening marker. Trailing prose after the tag is allowed and ignored. */
export const REGION_START = '<!-- a2scaffold:start -->';

/** Closing marker. */
export const REGION_END = '<!-- a2scaffold:end -->';

// A marker counts only on its own line, indented at most three spaces — the
// same bound as the fence parser. Four spaces or a tab is an indented code
// block in CommonMark, and a marker inside one is an example, not a region.
const START_LINE_RE = /^ {0,3}<!--\s*a2scaffold:start[^>]*-->[ \t]*$/;
const END_LINE_RE = /^ {0,3}<!--\s*a2scaffold:end[^>]*-->[ \t]*$/;

/** A fence opener: ``` or ~~~ (three or more), indented up to three spaces. */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * What a file's markers amount to.
 *
 * - `none` — no marker outside a code block. Adoptable.
 * - `valid` — exactly one start followed by one end. The only state a merge
 *   acts on.
 * - `ambiguous` — markers that do not form one region. Reported, never
 *   adopted or merged: inserting beside a broken pair makes repair harder, and
 *   merging would have to guess a boundary.
 *
 * @typedef {{ kind: 'none' }
 *   | { kind: 'valid', start: number, end: number }
 *   | { kind: 'ambiguous', reason: string }} RegionState
 */

/**
 * Classify the file's markers; see {@link RegionState}.
 *
 * Markers inside a fenced (``` or ~~~) or indented code block do not count.
 * A doc that shows the markers as an example must not read as a region, or a
 * merge would overwrite the example.
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
 * Offsets of the one valid region, or `null` for anything else. Fails closed:
 * being unsure is a reason to leave a file alone, not to pick a boundary.
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
 * Adopt an existing file that predates the tool: insert the generated block
 * below its title and keep everything else. The file carries markers from
 * then on, so later runs take the ordinary merge path.
 *
 * Returns `null` when adoption does not apply: the incoming render has no
 * region (`.agents/` canon), or the existing file's markers are anything but
 * `none` — a valid region is `mergeManagedRegion`'s job, and an ambiguous one
 * is reported rather than added to.
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
 * Where the generated block goes in a file the tool did not write: after
 * frontmatter, if any, and below the title, so the file still opens with the
 * author's own heading.
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
