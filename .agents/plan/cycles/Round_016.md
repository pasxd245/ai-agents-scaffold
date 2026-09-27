# Round 016: Adopt js-tmpl 0.2.0 and drop the path mirror, for v0.3.0

**Status**: In Progress
**Part of**: standalone — stacked on Round 015's branch because both are
v0.3.0 and both are breaking; the author decided on 2026-09-28 that the two
land together and the release is a later conversation.
**Date started**: 2026-09-28
**Date completed**: —

## Goal

`src/scaffold/output-paths.js` is 192 lines that re-implement js-tmpl's path
rules because 0.1.x exported only `resolveConfig` and `renderDirectory`. A
pinned test kept the mirror honest, and on 0.2.0 that test fails: `${missing}`
in a template path now throws instead of rendering empty, so the mirror is
wrong for the very engine it mirrors. js-tmpl 0.2.0 exports `planRender` —
the engine's decisions as data, without writing — and the round that added it
prototyped this repo on top: mirror 192 → 34 lines, no staging directories,
conflict detection on rendered content, net −203 lines.

Take 0.2.0, take `planRender`, delete the mirror. The cost is the Node floor:
0.2.0 requires Node 22 (20 reached end of life in April 2026), so this is
breaking for a2scaffold too and goes in v0.3.0 with Round 015.

Source of record: js-tmpl's `.agents/plan/cycles/Round_08.md` (the prototype,
kept locally as `a2scaffold-planRender-prototype.patch`) and the 0.2.0
release notes. The patch no longer applies — Round 014 and Round 015 moved
`src/scaffold/index.js` and the tests — so it is the map, not the diff.

## What 0.2.0 changes under us

Verified 2026-09-27 by running this suite against 0.2.0 on Node 22: 250 / 251
before Round 015, 265 / 266 after. The one failure is the mirror's
`${missing}` rule.

- **`${missing}` throws** `JSTMPL_PATH_MISSING_VAR`; a path value must render
  exactly one segment, or nest with `/` where every part names something.
- **Config discovery is CLI-only.** `resolveConfig` no longer looks for a
  `js-tmpl.config.*`; the `cwd` we pass to keep it out of the user's project
  is now a comment about a thing that does not happen.
- **Strict config**: unknown keys and wrong types throw. Everything we pass is
  known.
- **`planRender(cfg) → [{ relPath, target, content }]`**, `/`-separated on
  every OS, sorted by target, every error collected into one throw.
- **Node ≥ 22.**

## Plan

Each step independently landable, each green.

- [x] **Take 0.2.0 and Node 22.** `@nci-gis/js-tmpl@^0.2.0`; `engines.node`
      `>=22`; both workflows on Node 22; README, CONTRIBUTING and `usage.md`
      say 22; "Upgrading from 0.2.x" gains the floor. The mirror's `${var}`
      rule changes to throw on a missing value, so its pinned test stays
      green — a one-commit stopgap so the bump lands on its own.
- [x] **Replace the mirror with `planRender`.** `listOutputPaths` becomes a
      thin async wrapper returning `{ templateRel, outputRel, content }`;
      `resolveOutputPath` goes. `scaffold()` and `sync()` iterate the plan
      instead of rendering into `mkdtemp` and walking it. `checkExistingFiles`
      and `classifyConflicts` compare the **rendered** content — their own
      comment called the old check a prediction — and become async. A view
      is required: `planRender` renders content, so a path-only partial view
      cannot work, and the docs already said to pass the resolved one.
      Targets come back `/`-separated and are converted to native at the
      boundary, once.
- [x] **Docs follow the API.** `api.md`: async signatures, `view` required,
      `content` in the listing, `resolveOutputPath` gone.
- [x] **Test seam, not mocks.** `tests/output-paths.test.js` stops pinning a
      mirror and pins the wrapper: conditional inclusion, the missing-value
      error carries js-tmpl's code, targets are native paths.

## Non-goals

- `comparePlan` / `--check`. Sync already has a richer report than
  added/changed; adopting `comparePlan` for its disk preflight is a separate
  question.
- `JsTmplError` codes in a2scaffold's own errors. Worth doing, not here.
- Bumping to 0.3.0 or tagging. Deferred by the author on 2026-09-28.

## Do

**2026-09-28.** Two commits on `feat/js-tmpl-0.2`, stacked on Round 015's
branch, each green on Node 22.

1. **Bump** (`0ab8235`). `@nci-gis/js-tmpl@^0.2.0`, `engines.node >=22`,
   both workflows on 22, three doc mentions, and an "Upgrading from 0.2.x"
   item. The mirror's `${var}` rule flipped to throw on a missing value so
   the pinned test stayed green: a one-commit stopgap, as planned.
2. **planRender** (`30d9b2c`). `output-paths.js` 192 → 69 lines, none of them
   a path rule; the staging directories in `scaffold()` and `sync()` are gone;
   `checkExistingFiles` and `classifyConflicts` compare rendered content and
   are async; `resolveOutputPath` removed; `api.md` and the ambient types
   follow. The old pinned test became five tests of the wrapper's contract.
   Steps 2, 3 and 4 of the plan landed together because the API change, its
   docs and its tests are one change — splitting them would have left a
   commit whose docs described the next commit.

Against the prototype's numbers: it reported `src/` net −203 with 4 tests
failing; here `src/` is net −180 across the four files and the suite is
green, because the tests were rewritten rather than left behind.

**Deviation**: a view is now **required** by `listOutputPaths`,
`checkExistingFiles` and `classifyConflicts`, where the plan said "converted
at the boundary" and nothing about the no-view mode. The old no-view mode
returned raw `$if{…}` paths, which is exactly the list that once missed every
gated stub; a plan renders content, so there is no partial answer to give.
The docs already told callers to pass the resolved view. Refusing is the
explicit-over-implicit call.

**Not possible as written**: the Check item "through the CLI". The CLI takes
built-in template names only (`--use base`), so a scratch template with
`${missing}` cannot reach it. Verified at the API instead: the error is
js-tmpl's, with code `JSTMPL_PATH_MISSING_VAR` and the template path in the
message.

## Check

- [x] `pnpm check` green at each commit, on Node 22 — 267 at `0ab8235`, 262 at `30d9b2c` (the mirror's tests retired)
- [x] `src/scaffold/output-paths.js` contains no path rule of its own
- [x] No `mkdtemp` left in `scaffold()` or `sync()` — `grep` clean, `node:os` no longer imported
- [x] `--dry-run` and the refusal on a repo with existing files report the
      same split as before (the suite's re-scaffold and sync cases) — every
      existing case passes unchanged except the two that asserted the
      no-view mode
- [x] A template with `${missing}` in a path fails with `JSTMPL_PATH_MISSING_VAR`
      naming the template path — at the API; the CLI cannot load a scratch
      template (see Do)
- [ ] CI green on Node 22
- [x] `/review-pr dev` on the stacked branch before the `dev` PR — run
      2026-09-28 together with Round 015's; findings recorded there

## Act

**Learnings**:

- ...

**Promotions**:

- [ ] → `memory/` : what the consumer-prototype loop taught (js-tmpl Round 08
      already records its half)
