# Root-level `skills/` layouts: adopt in place, do not migrate

**Date**: 2026-09-15
**Agent**: Claude Code
**Confidence**: High
**Status**: New
**Source**: v0.2.0 release planning, prompted by a repo that keeps its skills at
`<root>/skills/` with no `.agents/`. Verified against the code and a live
end-to-end run.
**Review-by**: n/a

## Problem

A repo has `skills/<name>/SKILL.md` at its top level, the layout of most
published skill collections. Should `a2scaffold` move those into
`.agents/skills/`, or work with them where they are?

## Finding

Adopt. Every skill command already reads `<dir>/skills/` and `-d` names
`<dir>`, so `skill validate -d .` and `skill audit -d .` covered the layout
before this was written down — the gap was documentation and a test, not code.
Migration is a copy the user can ask for (`skill add ./skills/<name>`), never a
default.

One command did not survive the layout: `skill ref --from .` anchored its
pointer at the _parent_ of the source dir and embedded the repo's folder name,
producing `../../../<repo-folder>/skills/<name>`. That resolved on the author's
machine and broke on any clone under another name. The anchor is now the
deepest directory containing both source and destination, which is
byte-identical for the sibling layout the scaffold generates.

Two things the tool still cannot see, which the a2scaffold skill now tells the
agent to check by eye: a grouped skill projected into a harness dir is
spec-valid and never loaded, and `--skill all` is not atomic.

## Evidence

- Files: `src/skills/ref.js` (`commonAncestor`), `tests/skills.test.js`
  ("anchors the pointer inside the project…"), `tests/cli.test.js`
  ("skills/ outside .agents"), `docs/skills.md` ("Skills kept outside
  `.agents/`", "What validate and audit do not check")
- Commits: `56d728e`, `a1da44e`, `fb5cf93`
- Live run: pointer `../../../skills/demo` validated before and after renaming
  the repo folder.

## Recommendation

**Do**: describe what a flag already does before adding a synonym for it.
`-d` meant "directory that holds `skills/`" in every code path; three
different help strings hid that.
**Don't**: add `--skills-dir`, an rc path key, or fallback discovery of a bare
`skills/` dir. Each is a second way to say the same thing, and the rc decision
in `docs/agents/plan/ecosystem-ideas.draft.md` still stands.

## Promotion candidate?

- [x] `context/` — `context/skill-refs.md` was updated in the same commit
      under human authorisation (see `plan/promotions.md`, 2026-09-15). The
      adopt-not-migrate rule itself is a candidate for `context/philosophy.md`
      if a second layout question lands the same way.
- [ ] `skills/` — already in the a2scaffold skill ("Reviewing every skill in a
      repo").
- [ ] Not yet
