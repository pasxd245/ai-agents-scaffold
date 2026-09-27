# What comes after Round 016: the open work, ranked

**Date**: 2026-09-28
**Agent**: Claude Code (Fable 5.1)
**Confidence**: Medium — the ranking is a judgement; the items and their
evidence are not
**Status**: New
**Source**: an analysis the author asked for after Rounds 015 and 016 merged
into `dev`, unreleased. Inputs: `memory/2026-09-16-review-pr-first-run.md`,
`memory/2026-09-16-pre-release-adversarial-review.md`,
`memory/2026-09-24-hbs-templates-render-prettier-dirty.md`,
`memory/2026-08-29-dogfood-my-dynamic-dashboard.md`, Round 013's backlog,
`plan/programs/cosf-pilot.md`, `docs/agents/plan/ecosystem-ideas.draft.md`,
and measurements taken the same day
**Review-by**: 2026-11-28 — two months; by then either a round has taken the
top items or the ranking needs redoing against what changed

## Problem

Two breaking rounds sit on `dev` with `package.json` still at 0.2.1, and the
open work is spread across four memory files, one closed round's backlog, a
program with no round, and a parking lot. The author asked what is worth
doing next, in what order, and why.

## Finding

Measured on 2026-09-28:

| Measure                   | Value                         | Why it matters                                    |
| ------------------------- | ----------------------------- | ------------------------------------------------- |
| `dev` ahead of `main`     | 22 commits, 2 breaking rounds | Unreleased; the longer it waits the harder to cut |
| npm downloads, last month | 212                           | The user base is the author; renames are cheap    |
| `src/` / tests            | 3.8k lines / 262 tests        | Small enough to refactor without fear             |
| CI                        | 1 OS, 1 Node version          | `toNative` has never run on Windows               |
| Advisories, dev deps only | 16 high, 4 moderate           | markdownlint and eslint chains; not at runtime    |
| `.agents/AGENTS.md`       | 97 of the 100-line budget     | A user has 2 lines before breaking its own rule   |

The open work falls into eight groups. Ranked by what it unblocks and how
much evidence stands behind it:

1. **Release v0.3.0.** Bump, changelog via git-cliff, and the three
   live-session checks Round 015 left unverified (Claude Code and Gemini CLI
   loading root `AGENTS.md` in a converged scratch repo). Those checks are
   also the first evidence for the "converged layout" the docs now describe;
   without them the "Two axes" section is a table copied from vendor docs.
2. **The hardening batch** from the 2026-09-16 adversarial review, untouched
   since, each item with a reproduction on file: `skill ref --skill all`
   stops at the first collision and leaves the destination half-written;
   the audit gate blocks only `high` and three evasive fixtures install
   clean; registry refs float on a branch with no SHA pinning and no
   recorded commit; `sync` never reports an orphaned file after a flag is
   turned off — sharper after Round 015, since converging leaves `GEMINI.md`
   behind; `validate -d <missing>` exits 0; unknown `values.yaml` keys are
   ignored (Round 015 refuses two retired keys; js-tmpl 0.2.0's strict config
   is the model for refusing all); `list` and `validate` disagree on names.
   One round, one test per item; 0.3.1 or 0.4.0 depending on whether the
   audit default changes.
3. **Seeded canon rots** (adversarial review, approach item 5). Proven the
   same day: this repo's `context/harness-behaviour.md` was wrong from
   2026-09-23 to 2026-09-28 while the template was right, and was fixed by a
   hand promotion. Every 0.1.x and 0.2.x repo still says Claude Code does
   not read `AGENTS.md`, and `sync` will never correct it. The largest
   product gap on the list, and a design question — a managed region inside
   template-owned `context/` facts, or an `_upstream/` copy — before any code.
4. **Test and CI gaps**, all cheap and each closing a class: a Windows and
   macOS matrix, Node 24 beside 22, a test that renders the base template
   and runs `format:check` over the output (closes the 2026-09-24 memory;
   four files still dirty), and an injectable fetch for `installSkill` so the
   remote screen is tested rather than reasoned.
5. **js-tmpl 0.2.x follow-ups**: `comparePlan` for a `sync --check` that
   exits non-zero on drift, for users' CI; `JsTmplError` codes as the model
   for a2scaffold's own stable exit codes. Small; fits inside item 2.
6. **CoSF phase 1.** The program has been open since 2026-09-24 with no
   round. A cold agent on a fixed task, with and without `.agents/`, numbers
   written down including the disappointing ones. Needs the author in the
   design; not an agent's to run alone.
7. **Older backlog with no pain yet**: the path-scoped rules emitter (design
   approved 2026-08-29, unbuilt), skill-ref refresh, `--values-file`,
   `skillsDir` in the rc, golden snapshots. Philosophy #1 says leave them.
8. **Approach items 1 and 2** — a ~20-line knowledge base; root `AGENTS.md`
   as canon rather than a stub. Architectural. Round 015 added evidence for
   the second; wait for CoSF phase 2 to measure cold-start cost before
   deciding either.

## Evidence

- `git log --oneline origin/main..origin/dev | wc -l` → 22 on 2026-09-28
- `https://api.npmjs.org/downloads/point/last-month/a2scaffold` → 212
- `pnpm audit --json` → 16 high, 4 moderate, all in devDependencies
- `.github/workflows/ci.yml` → `ubuntu-latest`, `node-version: '22'`
- `plan/promotions.md`, entry 2026-09-28 — the hand promotion that item 3
  rests on
- The reproductions behind item 2 are in
  `memory/2026-09-16-pre-release-adversarial-review.md` § Behaviour-level

## Recommendation

**Do**, in this order: Round 017 ships v0.3.0 with the three live checks;
Round 018 takes the hardening batch plus `sync --check` and exit codes; the CI
matrix and the render-and-format test land alongside as small commits;
Round 019 designs updatable canon and gets the author's decision before code;
CoSF phase 1 when the author can sit in.

**Don't**: start a feature round while two breaking rounds sit unreleased, or
decide the architectural items (8) on taste again — Round 13 already did that
once and the adversarial review named it.

## Promotion candidate?

- [ ] `context/` — no; this is a snapshot of a backlog, not a rule
- [ ] `skills/` — no
- [x] Not yet — it is an input to the next `plan/` round, and should be
      archived once Rounds 017–019 exist
