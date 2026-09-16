# Dogfooding a 15-month-old scaffold: what the template still lacks

**Date**: 2026-08-29
**Agent**: Claude Code
**Confidence**: High for what was observed; Medium for what generalises from one repo
**Status**: New
**Source**: Read-only inspection of `my-dynamic-dashboard`, the first real
project scaffolded with `a2scaffold`. Full report was written to
`.agents/tmp/20260829-dogfood-my-dynamic-dashboard.md`, which is **gitignored** —
this file is the durable record. Round 13 cites the tmp path; that citation
will rot.
**Review-by**: 2027-02-28 — tracks the practice-survey re-run; the subject repo
keeps moving and these gaps may close themselves.

## Problem

The scaffold had never been checked against a repo that used it under real
load. Everything we knew about the template came from the template.

## Finding

At 174 rounds and ~80,000 lines under `.agents/`, the subject repo had
**invented by hand** most of what the template did not ship, and had
independently converged on decisions we made the same week.

**Convergence (the useful evidence)**: their `.agents/AGENTS.md` is 90 lines;
ours was cut to 88 the same day, from opposite directions. Their Load Order is
gated on task shape, as ours now is. Two independent arrivals at ~90 lines is
the strongest evidence we have that the budget is real and not a number copied
out of a vendor doc.

**Gaps still open after Round 13 shipped its fixes**:

- `decisions/` — nowhere in our model holds a cross-round commitment
  ("we agreed not to build X until Y"). Round-scoped decisions live in the
  round file, promoted knowledge in `context/`; this falls between them and is
  exactly the kind of promise agents drift away from.
- `_TEMPLATE.md` beside each writable directory. They adopted it in four
  places independently. We ship format guidance as prose, and a copyable file
  is more likely to be followed. Only `memory/_TEMPLATE.md` has landed.
- Multi-round plans: they chose `.agents/plan/{brainstorms,programs}/`, we
  chose `docs/agents/plan/`. Two answers, neither written down as a choice.
- `design/` — 10,955 lines of intent-before-code artefacts feeding the PDCA
  Plan phase. Domain-specific in their case; the _shape_ may generalise.

**Cold start was 878 lines** under their own Load Order — the same failure we
found in ourselves that morning, in a repo that never received our fix. The
weight was in `context/` (694 lines), not in `AGENTS.md`. Budget guidance
belongs in the template prose, not only in our copy of it.

## Evidence

- Subject: `/home/ubuntu/pf/my-dynamic-dashboard` (local, not vendored here)
- Counts: `plan/cycles/` 174 files / 57,733 lines; `memory/` 28 / 3,525;
  `context/` 6 / 694. Template skeleton is ~400 lines.
- Ran our own `skill validate` and `skill audit` against 7 skills written with
  no knowledge of either: conformance was well calibrated (6× 100/100), audit
  was not — three false-positive classes, all since fixed and regression-tested
  in `38594dc` and `967faa8`.
- Round 13 closed 7 of the findings; the ticked list is in
  `.agents/plan/cycles/Round_13.md`.

## Recommendation

**Do**: dogfood against a repo that has _aged_, not a fresh scaffold. Every
finding worth having came from wear — numbering that broke at 100, `cycles/`
growing unbounded, a stub carrying both the generated pointer and a
hand-written duplicate. None of it is visible at scaffold time.

**Do**: write findings somewhere tracked. This report went to `.agents/tmp/`,
which `.agents/.gitignore` excludes, and was cited as the record of a round.

**Don't**: hardcode our own repo's `context/` filenames into a template meant
for every repo. That bug shipped and this repo was the proof.

## Promotion candidate?

- [ ] `context/` — not yet; one subject repo is an observation, and philosophy
      §6 wants a pattern seen repeatedly before it becomes canon
- [ ] `skills/` — no reusable procedure here
- [x] Not yet — needs a second aged repo before the remaining gaps are canon

Decided in session on 2026-08-29 (human): `decisions/` ships as an opt-in
`values.yaml` flag rather than a base-template directory; multi-round plans
stay in `docs/agents/plan/` by default with the location exposed as a setting.
