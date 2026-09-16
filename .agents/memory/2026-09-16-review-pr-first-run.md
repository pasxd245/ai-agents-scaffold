# First run of the review-pr skill: what it caught, what it cost, what is open

**Date**: 2026-09-16
**Agent**: Claude Code (the `review-pr` skill, run as four parallel passes
split by area: scaffold and CLI; skills and templates code; rendered
templates; docs and governance)
**Confidence**: High for the reproduced defects; Medium for the cost figures,
which are one run
**Status**: New
**Source**: dogfooding the skill on `feat/restructure-agent-instructions`
against `main` (42 commits) before the v0.2.0 PRs, the same day the skill
was written. Promotion of the skill to `templates/skills/` was deliberately
deferred until it had run; this is the first data point.
**Review-by**: 2026-12-01 (re-read after the skill has reviewed a few more PRs)

## Problem

The author's draft prompt used generic dimensions (OWASP, N+1, re-renders).
The pre-release adversarial review the same morning found five real defects,
none inside those dimensions. The skill replaced them with this repo's
failure modes. Did that tuning find anything the earlier passes missed?

## Finding

Yes. On a branch that had already been through a three-pass adversarial
review and two rounds of pre-review fixes, the skill reproduced 2 Blockers
and 15 Should-fix items, all Confirmed, none previously known:

- **Caller not updated**: `scaffold()` grew a `force` gate; its one internal
  caller (`skill ref`) did not pass it, so the documented `--force` refused
  every non-identical ref. The only test used a byte-identical file.
- **Argument order**: `sync` sliced argv from the command word, so a
  leading `--dry-run` was dropped and a preview wrote for real.
- **False report**: a byte-identical managed stub was rewritten and listed
  as "Updated in place". JSDoc, docs and `sync` all described the intended
  behaviour; only `scaffold()` diverged.
- **BOM** broke adopt, frontmatter parsing and the audit in three separate
  places, each anchored at offset 0.
- **Traversal**: a nested skill name with `..` installed outside `-d`.
- **Vacuous test**: the `node_modules` fixture was gitignored, so CI never
  had it and the exclusion assertion passed against nothing.
- **Claims outran code** in CONTRIBUTING, docs/usage.md (dry-run listing),
  docs/skills.md (rc path), docs/api.md (two tables), and both knowledge-base
  templates (guardrail asserted when the flag is off).

Every one of these sits in areas 1, 3, 4 or 5 of the skill's checklist.
The generic draft would have pointed the reviewer elsewhere.

Reviewer quality: no finding was rejected on verification. The two
"Blocker" labels were both defensible under the skill's rubric but differ a
lot in weight (a refused CLI flag versus one false line in CONTRIBUTING);
the rubric's "makes a documented claim false" clause is doing that. Worth
watching whether it inflates Blocker counts on later runs.

Cost: four parallel passes, about 630k tokens total, 6 to 10 minutes wall
each, 134 tool calls. Fixing the clear-cut items took 11 commits, each
green, all with regression tests that were shown to fail without the fix.

## Evidence

- Fix commits: `e9f3d07` `a9d6051` `ab1cd2f` `a7379ee` `066e309` `c051a8a`
  `64d2458` `9bc3fb3` `667c921`; skill itself `820afb2`.
- Tests: 228 before, 237 after; each fix commit re-run from `git archive`.
- Reproductions were kept under the session scratchpad only.

## Open findings, not fixed here

Need a design decision (Round 14 candidates):

1. **Audit screens by extension, not content.** An extensionless
   `scripts/run`, a `.txt`, or a file over 512 KB is `opaque/medium` and a
   registry install proceeds without `--force`. Candidate: sniff text by
   content (no NUL, or `#!`), and rate opaque executables `high`.
2. **Audit calibration**: U+200D (ZWJ, in compound emoji) is `high`;
   `\bexec\s*(`, `\.env\b` and "you are now" match `RegExp.exec`,
   `process.env.HOME` and ordinary prose. Each alone aborts a remote install.
3. **Crawler rc path**: `crawl4ai_recursive.py` reads `<cwd>/.a2scaffoldrc.json`
   and `~/.a2scaffoldrc.json`; the CLI reads `.a2scaffold/.a2scaffoldrc.*`
   and refuses the flat home form. The pool also disagrees with itself on
   what the rc holds.
4. **CRLF**: adopt and merge splice an LF block into a CRLF file; a title
   after two blank CRLF lines behind frontmatter is not found.

Canon under `.agents/`, human edit plus a `promotions.md` line:

1. `context/philosophy.md`: link to `../AGENTS.md#root-instruction-files`
   (section moved to `reference/root-files.md`); cites
   `templates/skills/planning/master-plan/`, which does not exist.
2. `context/conventions.md`: templates "under `templates/`" (now
   `templates/scaffold/`); `values.yaml` "(required)" (optional); `.prompt.md`
   "auto-loading" (Claude Code does not); "require `--force`" (stubs take
   `--adopt`).
3. `context/harness-behaviour.md`: header date 2026-08-29 behind its own
   "Verified 2026-09-16" row; same in the template.
4. `AGENTS.md` drifts from the render: `reference/` indented four spaces,
   two "Where to look" rows dropped.
5. `prompts/reflect-agents.prompt.md`: this repo's copy still names another
   project's files; re-seed from the template.
6. `promotions.md` has no entry for `context/conventions.md`,
   `skills/create-template`, `reference/mechanisms.md`, `reference/root-files.md`.

Nits left as they were: `--adopt` worded three ways; README tree
incomplete at its own depth; docs/skills.md audit sample names a line the
audit does not flag; stale comments in `src/cli/commands/scaffold.js`;
refusal heading reads as past tense; `classifyConflicts` re-walks the tree
per file; two tests point at a missing `base-output` fixture; a symlinked
source directory fails with an empty detail; prettier skips the rendered
knowledge base; no test renders `decisions` and `programs` together.

## Recommendation

**Do**: run `/review-pr <base> <area>` per area on any branch over ~10
commits; one pass over 42 commits would have been too shallow. Keep the
"Confirmed or Plausible" rule; it is what made every finding actionable.
**Don't**: treat one run as proof the checklist is right. Two of the open
items (audit calibration, CRLF) are things the checklist named and the
code still has, so the list is at least pointing at real ground.

## Promotion candidate?

- [ ] `context/` — no
- [ ] `skills/` in the template pool — **not yet**; one run. The generic core
      (preflight, verdicts, report shape, "no blockers is valid") looks
      portable; the six-area checklist is this repo's. A template copy would
      need a "repo-specific checks" slot the scaffolded repo fills in.
- [x] Not yet — needs more validation
