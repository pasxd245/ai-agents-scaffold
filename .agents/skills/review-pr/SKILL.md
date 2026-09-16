---
name: review-pr
description: Strict, evidence-based pre-review of the current branch against a base ref, tuned to this repo's real risks (path and marker handling, template leaks, docs that overstate the code, .agents/ governance). Use before opening a PR from a feature branch to dev, or when asked to review a branch, a diff, or a set of changes; runs the quality gate itself and reports "no blockers" when that is the honest result.
metadata:
  author: a2scaffold
  version: '1.0'
---

## Trigger

Activate this skill when the user asks to review a branch, a PR, a diff, or
"the changes" before merging, or invokes `/review-pr`. The optional argument is
a base ref (default `main`) followed by an optional focus area, for example
`/review-pr dev src/scaffold` or `/review-pr main docs`.

Do **not** activate it for a single file the user is editing right now, or for
a design question. Those are ordinary conversation.

## Stance

You are a principal engineer reviewing this branch before a human does. The
bar is high, but a finding you cannot back with evidence is noise, not
rigour. **"No blockers found" is a valid result.** Padding the review with
speculative findings to look thorough is a failure of the review.

Every finding carries one of two verdicts:

- **Confirmed**: reproduced with the CLI in a scratch directory, or a test
  written that fails on this branch, or the defect is visible in the code
  without any assumption about runtime state.
- **Plausible**: reasoned from the code, not reproduced. Say what would
  confirm it.

## Procedure

### 1. Preflight

1. Resolve the base ref (default `main`). If the argument names a focus area,
   restrict steps 2 and 3 to paths under it, but still run step 4 in full.
2. `git diff <base>...HEAD --stat`, then the full diff. Read each changed file
   **whole**, not just the hunks, and the callers of every changed exported
   function. A diff-only read misses the caller that now passes the wrong
   shape.
3. Run `pnpm check`. Quote the real output in the report. If it fails, that is
   the first finding.
4. When a defect looks likely, reproduce it: scaffold into a scratch
   directory with `node bin/a2scaffold -o <dir>` and exercise the path. Never
   run a reproduction against the working tree.

### 2. What to look for in this repo

Work through the six areas in order. Skip an area with one line saying why it
does not apply to this diff.

1. **Correctness at the edges the code actually has.** Path joins and
   symlinks; marker and frontmatter regexes against CRLF, BOM, indentation
   and a missing trailing newline; idempotence of a second run; anything that
   can lose user content silently (`--force`, `--adopt`, managed regions,
   `sync`). A "content kept" message that is not true is a data-loss defect.
2. **Leaks.** What reaches a template view (the process environment never does), what
   is written into a committed file, what `skill add` copies from disk, what
   the audit lets through. Any new network access or new production
   dependency is a finding by itself: both need a stated decision.
3. **Claims versus behaviour.** `README.md`, `docs/`, `--help`, the
   `.agents/` knowledge base and the templates must describe what the code
   does now. A stale claim, an example that names a template or skill that
   does not exist, or a guarantee the code cannot honour is a defect, not a
   nit. Check the dry-run listing in `docs/usage.md` against real output.
4. **Governance.** Edits under `.agents/AGENTS.md`, `context/`, `reference/`,
   `prompts/` or `skills/` need a matching entry in `plan/promotions.md`.
   `.agents/AGENTS.md` stays under 100 lines. Template and this repo's own
   `.agents/` copy should change together when the same text lives in both.
   Each commit in the range should be independently green; spot-check one.
5. **Tests.** New behaviour has a test that fails without the change. Fixtures
   under `tests/fixtures` still match what `templates/` renders. A bug fix
   carries a regression test on the exact input that broke.
6. **Maintainability.** Naming and structure match the surrounding module.
   Do not propose abstractions, patterns or dependencies the code does not
   yet need; two production deps is a design decision here, not a gap.

Out of scope unless the diff adds them: web security categories, database
performance, UI rendering. This is a Node CLI with no network path.

### 3. Report

Write the findings first, then the summary. The summary is derived from the
findings, never written before them.

```markdown
## Findings

Most severe first. Omit a tier with nothing in it.

- **[path:line] Title** · Blocker | Should fix | Nit · Confirmed | Plausible
  - Issue: one sentence.
  - Evidence: the snippet, or the reproduction command and its output.
  - Fix: the concrete change; a snippet when it is shorter than the prose.

## Quality gate

`pnpm check`: pass, or the failing output verbatim.

## Summary

- Verdict: Ready | Ready with fixes | Needs rework
- Risk: High if any Confirmed data-loss or secret-exposure finding;
  Medium if any Blocker; Low otherwise.
- Areas skipped and why, one line each.
```

Severity means: **Blocker** loses data, exposes a secret, breaks a documented
command, or makes a documented claim false. **Should fix** is a real defect a
user is unlikely to hit in the first hour, or a missing regression test.
**Nit** is anything the author may ignore without consequence.

### 4. After the report

Do not fix anything unless asked. If the user asks for fixes, apply them one
finding per commit, each landing green, and write a memory entry under
`.agents/memory/` only if a finding reveals a pattern seen more than once.
