# Round 13: Align the scaffold with 2026 agent practice

**Status**: Review
**Date started**: 2026-08-29
**Date completed**: —

## Goal

Restructure the agent instruction files around a single knowledge base, then
close the gaps a survey of current practice found between what `a2scaffold`
ships and what the field has settled on. Everything here is groundwork for
v0.2.0.

Research backing:
[20260829-agent-practice-baseline.plan.md](../../../docs/agents/plan/20260829-agent-practice-baseline.plan.md)
— 24 primary and secondary sources, captured as a **baseline to re-measure
against** in ~6 months rather than a one-off report. Key inputs:
the AGENTS.md spec (Agentic AI Foundation / Linux Foundation), Claude Code's
memory and permissions documentation, Anthropic's context-engineering guidance,
OWASP Top 10 for Agentic Applications 2026, and Snyk's ToxicSkills audit.

## Plan

- [x] Move `CLAUDE.md` to the repo root and settle the root-file model
- [x] Add a canonical philosophy doc and summarise it in each stub
- [x] Put the auto-loaded knowledge base on a context budget
- [x] Make the authority table enforceable rather than advisory
- [x] Turn `skill validate` into a conformance scorer
- [x] Add supply-chain screening for skills
- [x] Re-aim the README on the governance model
- [ ] Emit path-scoped rules from `.agents/context/` — unblocked 2026-08-29
      (optional `paths:` frontmatter approved); emitter not built
- [x] Cut `AGENTS.md` to <100 lines and fix what the Load Order mandates

## Do

Landed on `feat/restructure-agent-instructions`, 51 commits, each green.
Grouped by area rather than by date, because that is how a reviewer reads it:

| Area                                   | Commits                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| Instruction-file model, KB, guardrails | `765ac08` `d28aff4` `967faa8` `80b399c` `096ef3a` `8f18a00`             |
| Skill conformance and supply chain     | `80c7a84` `fb6d5e7` `38594dc` `0fc5c54` `a2111ce`                       |
| Non-destructive scaffold and adoption  | `ac5c006` `eff7752` `74b0bb8` `b3ff47d` `6568095` `89e35be`             |
| `sync`                                 | `78680ba`                                                               |
| Release prep, 2026-09-15               | `56d728e` `a1da44e` `fb5cf93` `348e525` `7e3a85e` + round record + bump |
| Pre-release review fixes, 2026-09-16   | `66b1641` `e28bff7` `5747ad5` `e68b58a` `1069b0b` `0e1e6d4` `438127f`    |
| `review-pr` skill and its first run    | `820afb2` + 10 fix commits, listed in the memory entry below              |
| Pre-review fixes                       | `85bcf5c` `68e8474`                                                     |
| Round record and research baseline     | `cfcb5e8` `b83d57e`                                                     |

The first three rows were the plan. `sync` and the two review commits were
found on the way; see the sections below.

### The root-file model changed twice

First attempt made root `AGENTS.md` canonical with `CLAUDE.md` importing it —
the shape Claude Code's own docs prescribe. Rejected by the human: it makes
`CLAUDE.md` depend on a file meant for a different harness.

**Settled model**: `.agents/AGENTS.md` is the heart. All four root files are
peer stubs pointing at it, none importing another, each reaching it in one hop.
Root `AGENTS.md` is a stub for Codex and the AGENTS.md convention, no more
privileged than `CLAUDE.md`.

Also rejected en route: refusing an `agents.agentsmd` flag on the grounds that
disabling it would strand the bridges. Wrong — `.agents/AGENTS.md` is generated
unconditionally, so the stubs simply retarget. The flag exists, defaulting on.

### Context budget — two passes

First pass split the 315-line knowledge base into a ~190-line core plus
[`reference/memory-and-promotion.md`](../../reference/memory-and-promotion.md), capped by a test.

Second pass measured what the Load Order *actually mandated* and found the core
was only 19% of it: `context/` ("read all recursively") and `prompts/`
("auto-loaded") added 868 more lines, for ~1,067 total. The prompt claim was
also wrong — Claude Code does not auto-load `.agents/prompts/`; those files were
being read because our own doc said MUST.

Result: `AGENTS.md` cut to 88 lines, topic docs moved to
[`reference/`](../../reference/) each behind an explicit trigger, and the Load
Order narrowed to this file plus `architecture.md` and `conventions.md`.
**Mandated cold start: 1,067 → 232 lines.**

The `## Role & Mindset` section was dropped as duplicating `philosophy.md`; its
one non-duplicated rule (Transparency section last in README) moved to
`context/conventions.md`.

### Enforcement

`.claude/settings.json` now carries permission rules backing the authority
table. `.gitignore` was excluding that file; it now excludes
`.claude/settings.local.json` instead, so the rules actually reach the team.

### Follow-up session — 2026-08-29 (backlog burn-down)

Uncommitted at time of writing; `pnpm check` green, 134 tests (was 126).

- **`templates/skills/a2scaffold/`** — the built-in pool advertised
  `skill add <name>` and shipped nothing, while `context/philosophy.md` cited
  `templates/skills/planning/master-plan/` as a worked example of a path that
  does not exist. First occupant is a skill that teaches an agent to drive the
  CLI instead of hand-writing `.agents/`. A test holds every pool skill to
  100/100 conformance and a clean audit.
- **`docs/agents/` left the scaffold.** The template shipped a 50-line
  `reference/docs-agents.md` governing a directory it never creates, linked
  from the KB table. Redrawn on audience — `.agents/` is what an agent must
  read to do the next task; `docs/agents/` is what a human reads to understand
  the project — and demoted to a recommendation in `docs/usage.md`.
- **Opt-in `plan.decisions` and `plan.programs`**, plus a general `plan/DoD.md`,
  a copyable `plan/cycles/_TEMPLATE.md` with a `**Part of**` lineage header,
  and `prompts/compact-content.prompt.md` (which `PDCA.md` told users to run
  without shipping it).
- **Dogfood findings rescued** from gitignored `.agents/tmp/` into
  `memory/2026-08-29-dogfood-my-dynamic-dashboard.md`.

### Adoption — found by scaffolding a repo we did not scaffold (2026-08-30)

Tested against a copy of `hg_p-01`: 389 files, never scaffolded, a hand-written
56-line `AGENTS.md`, `.claude/CLAUDE.md`, and seven of its own skills.

What held: dry-run matched the real run; the CLI refused with exit 1 naming only
genuine conflicts; conformance scored seven stranger skills sensibly (their
`master-plan` 100/100, five terse speckit skills 70–71, all true positives); the
audit produced **zero findings and zero false positives**; and `skill ref`
refused to replace a real skill with a pointer even under `--force`.

What broke: `--force` destroyed all 56 lines of their `AGENTS.md`.
`mergeManagedRegion` needs markers on **both** sides, so the feature built for
this case could not cover the one moment every adopter passes through — the
first scaffold. The dogfood report predicted it at High severity and we shipped
the fix for the wrong half.

`adoptManagedRegion` now inserts the generated block below the author's title
and keeps everything else, gated on `--force`. Verified on the same repo: zero
lines lost, title preserved, and the second run takes the ordinary merge path.
The pre-flight list now separates *adopted* from *overwritten*, because
"would be overwritten" had stopped being true for half of it.

Turning the same tool on **this** repo found two more:

- Adoption duplicates content when the existing file was generated by an older
  version *before markers existed* — it faithfully preserves a stale copy of
  the generated block, so the pointer ends up stated twice. Correct for a
  hand-written file, wrong for a previously-generated one, and it cannot tell
  them apart. Decision: leave the tool alone, hand-place markers in our four
  stubs. Other migrating repos will hit the same thing.
- **The generated managed region was not formatter-stable.**
  `<!-- a2scaffold:start -->` was followed directly by a blockquote, and
  prettier wants a blank line there — so prettier would add it and the next
  scaffold would strip it, forever. Fixed in all four stub templates, with a
  test that renders each stub and asserts it already equals what prettier
  would write. Verified the test fails when the fix is reverted.

  Nearly missed: the first check said the rendered output was clean, but it
  ran on files in `/tmp`, where prettier used its defaults instead of this
  repo's config. Check formatter output where the config actually applies.

Still open from the same test: `.claude/CLAUDE.md` and a new root `CLAUDE.md`
now coexist with nothing detecting the old location (backlog item 9), and
`skill ref --skill all` is not atomic — it wrote one ref, hit a name collision,
and exited 1 leaving the destination half-updated.

Governance note: canon was modified under the explicit-instruction exception —
warned, confirmed, and logged in
[promotions.md](../promotions.md).

### `sync` — 2026-08-30

Backlog item 4, pulled forward because adoption exposed the gap: with real
curated canon, refreshing a stub meant `--force`, and `--force` also replaces
`.agents/` wholesale. `sync` separates **managed** files (a fenced region the
template owns; only the region is replaced) from **seeded** files (written
once, then the human's; created when absent, never touched when present). No
`--force`, no conflict list. Enforcement files are the one seeded exception:
`.claude/settings.json` is compared and reported, never overwritten. Both
commands now read project values from the `--output` target, not the caller.

### Pre-review loop — 2026-08-30 to 2026-09-15

Two review passes were commissioned before opening the PR, each written as a
standalone document, each verified against the code before anything changed.
The documents themselves are working papers and were not committed; what they
established is recorded here and in the two commit messages.

First pass, resolved in `85bcf5c`: three P1s (`$ifn{}` bypassing conflict
detection, `sync --output` reading the caller's values, symlinks invisible to
the audit) and eight P2s across safety, governance and docs. Two things the
review did not name were found while fixing: `mergeRenderedTree` trusted the
CLI preflight completely, so any prediction drift was silent data loss — it now
builds its own plan and throws `ScaffoldRefusal` before writing — and the
`--force` prompt listed every canon file as a conflict when one had changed.

Second pass, resolved in `68e8474`: markers indented four spaces still counted
as a region (an indented code block, and a real data-loss case), adoption could
not tell "no markers" from "broken markers" and added a third pair, a symlinked
`SKILL.md` installed as a skill with no `SKILL.md`, `ScaffoldRefusal` was
documented but not exported, and the enforcement check was verbatim while the
wording said semantic. The last was resolved by narrowing the claim, not
widening the code.

Left open by both passes, on purpose: `sync` has no migration story for seeded
files that change upstream, and the branch is one PR where a reviewer would
prefer five.

## Check

- [x] `pnpm check` green at each commit — 99 tests at `fb6d5e7`, 219 at
      `68e8474`
- [x] Template renders correctly for all four harnesses, and with
      `agents.agentsmd` both on and off
- [x] Every markdown link and `@` import in changed files resolves
- [x] Dry-run listing in [usage.md](../../../docs/usage.md) matches CLI output
- [x] Audit detects all five categories on a hostile fixture; the crawler skill
      flags medium-only, so signal-to-noise holds
- [x] Output-path prediction pinned against the installed renderer, `$ifn{}`
      and error cases included
- [x] Every finding in both review passes reproduced on the prior commit
      before it was changed, and every accepted fix carries a regression test
- [x] Adoption verified on a real unscaffolded repo: zero lines lost, second
      run merges
- [x] `sync` is idempotent and a dry run writes nothing
- [x] `review-pr` skill run on this branch in four area passes before the
      dev PR: 2 Blockers and 15 Should-fix reproduced, 11 fixed with
      regression tests shown to fail without the fix; the rest recorded in
      [`memory/2026-09-16-review-pr-first-run.md`](../../memory/2026-09-16-review-pr-first-run.md)
      as Round 14 candidates and canon edits for the human
- [ ] Not verified: whether the permission rules behave as intended in a live
      session. They are declarative and syntactically checked, but untested
      against a real Claude Code run. One data point since: an agent editing
      this file under the `Edit(/.agents/plan/**)` rule was let through in an
      auto-approve mode, which is the mode doing what it says, not the rule
      failing — but it means the rule protects only sessions that ask.
- [ ] Not verified: `sync` against a repo scaffolded by v0.1.0 in the field.
      Tested on this repo and on scratch copies only.

### Corrections found during the round

| Assumption                                     | Reality                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `Write(path)` permission rules work            | Accepted but **never consulted**; file paths need `Edit(path)`                   |
| `@` imports reduce context cost                | They load at launch and count in full                                            |
| `deny` is the right verb for protecting canon  | `ask` is — `deny` cannot be overridden, breaking the warn-and-confirm exception   |
| Our authority rules protect `.agents/`         | They are prose; instruction files are context an agent can ignore                |

### Blocked

**Path-scoped rules** (`.claude/rules/` emitted from `.agents/context/`) needs a
`paths:` glob per context file. The glob cannot be derived — it has to be
authored, which means adding frontmatter to canonical human-owned files. That is
a governance change and needs a human decision before any code.

**Resolved 2026-08-29**: optional `paths:` frontmatter approved. A context file
without it is not emitted as a scoped rule, so existing repos are unaffected.
The emitter is unbuilt but no longer blocked.

## Act

**Learnings**:

- A survey is only worth the cost if it can be re-run and diffed. The findings
  were captured as a dated baseline with volatility ratings and a re-run
  protocol, not as prose — see §4 of the baseline doc.
- Instruction files are context, not configuration. Anything that must hold
  belongs in a hook or a permission rule. This is now stated in the KB.
- Everything auto-loaded is charged to every session. Detail that only matters
  sometimes belongs behind an on-demand read.
- Measure the whole cold start, not the file in front of you. `AGENTS.md` was
  the obvious target and the smallest part of the cost; the expensive part was
  what it told agents to read next.
- A claim about tooling behaviour ("prompts are auto-loaded") went unverified
  for months and was false. Claims about harness behaviour need a source.
- The emitter half of this tool is commodity — `rulesync`, `ai-rules-sync` and
  `agent_sync` all do it. The authority model, promotion path and verification
  cycles are what nothing else does.
- Verify harness behaviour against primary docs before encoding it. Three of the
  four corrections above would have shipped as silent bugs.

**Promotions**:

- [x] → context/ : `philosophy.md` — principles that decide close calls
- [x] → context/ : `harness-behaviour.md` — import cost, `Edit()` vs `Write()`,
      `ask` vs `deny`, skill tiers. Dated and sourced, with re-verify triggers,
      because every one of these is someone else's product behaviour.

---

## Backlog before v0.2.0

Ordered by dependency, not priority. Each is meant to be independently
landable.

### Needs a decision

1. ~~**Path-scoped rules emitter — the governance question**~~ — decided
   2026-08-29: `paths:` frontmatter on `.agents/context/` files is **optional**.
   A file without it is simply not emitted as a scoped rule, so nothing breaks
   for existing repos. The emitter itself is still to build; it moved to
   *Ready to build* below.
2. ~~**Memory provenance and staleness**~~ — done. `Source` and `Review-by` are
   in `memory/_TEMPLATE.md`, with guidance on setting the date from what the
   finding depends on rather than a fixed interval; `context/memory-placement.md`
   covers the two-systems question.
3. ~~**Root `AGENTS.md` for tools with no import support**~~ — answered by
   `sync` (2026-08-30): the Copilot stub's restated block is a managed region,
   so `sync` refreshes it without touching anything the author wrote.

### Found by dogfooding `my-dynamic-dashboard` (2026-08-29)

Durable record: [`memory/2026-08-29-dogfood-my-dynamic-dashboard.md`](../../memory/2026-08-29-dogfood-my-dynamic-dashboard.md).
The original long-form report was written to `.agents/tmp/`, which is
gitignored — citing it here was a mistake this file used to make.

- [x] Load Order named *our* `context/` filenames in a template meant for every
      repo. Now gated on task relevance instead.
- [x] `.agents/governance.md` collided with their `context/governance.md`.
      Renamed to `reference/memory-and-promotion.md`, named for its trigger.
- [x] Audit false positives: scoped `Bash(git log *)` scored as unscoped;
      `except subprocess.CalledProcessError` flagged as execution;
      `urllib.parse` flagged as network. All three regression-tested.
- [x] **`installSkill` copied `__pycache__` and other junk.** `fs.cpSync` takes
      what is on disk, not what is tracked. Now filtered.
- [x] Promote `context/memory-placement.md` — generalised from their version,
      shipped with a `memory/_TEMPLATE.md` it depends on.
- [x] Managed-region markers in generated stubs. While building it, found that
      **conflict detection never saw any `$if{}`-gated file** — `CLAUDE.md`,
      root `AGENTS.md`, `GEMINI.md`, copilot and `settings.json` were silently
      overwritten with no warning and no `--force`. Raw template paths were
      compared against the output dir, so the marker segment never matched.
      Output paths are now resolved against the view; dry-run is accurate for
      the first time as a side effect.
- [x] `decisions/` directory for cross-round commitments. Shipped as the
      opt-in `plan.decisions` flag rather than base-template surface — the flag
      moves the directory, the authority table and the permission rules
      together.
- [x] `plan/cycles/` numbering breaks at 100. Now three digits.
- [x] Compaction guidance for `plan/cycles/` — when, how, and what to drop.

### Ready to build

3b. **Path-scoped rules emitter** — the frontmatter convention is agreed (see
    above); what remains is reading `paths:` and emitting `.claude/rules/`.

4. ~~**`a2scaffold sync`**~~ — built 2026-08-30 (`78680ba`). What it does not
   do, recorded in the review loop above: carry an upstream change to a seeded
   file into an existing repo. That migration story is the next decision.
5. **Skill-ref refresh** — refs are generated once; nothing re-points them when
   the source moves.
6. **Golden snapshot tests per template** — currently each template change is
   verified by hand plus a dry-run diff.
7. **`--values-file` / `--values-dir` flags** — the only way to test a non-default
   `values.yaml` today is to edit it in place, which this round did repeatedly.
7b. **`validate` warning for grouped skills in a harness dir** — when `-d`
    resolves to `.claude`, `.codex`, `.gemini` or `.github` and a discovered
    name contains `/`, warn `nested-in-harness-dir`. Evidence: one live sighting
    (2026-08-29). Needs a hard-coded list of harness names, so it ships only if
    a second repo hits it; until then the a2scaffold skill checks by eye.

7c. **`skillsDir` in the rc file — v0.2.x, TBD.** Requested 2026-09-15 for a
    repo that keeps skills at `<root>/skills`: a default for `-d` so the flag
    is not typed on every call. Shape if built: one key, read by
    `parseSkillArgs` as the default for `-d`; the flag always wins. Reopens
    the "type-paths are not rc-configurable" decision in
    `docs/agents/plan/ecosystem-ideas.draft.md`, so it needs a human yes
    first. Not in v0.2.0.

### Found by the pre-release adversarial review (2026-09-16)

Three independent passes — premise, CLI as a stranger, security — before the
tag. Data-loss and messaging defects were fixed the same day. Round 14 takes
the v0.2.1 bug fixes only; the approach questions and the hardening batch
below wait for a round of their own. Durable record, in order:
[`memory/2026-09-16-pre-release-adversarial-review.md`](../../memory/2026-09-16-pre-release-adversarial-review.md).

- [x] `--adopt` de-indented content; CRLF markers unrecognised (`66b1641`)
- [x] `process.env` rendered into templates (`e28bff7`)
- [x] `--dry-run` hid conflicts; `--force` did not name replaced files (`5747ad5`)
- [x] Audit and permission-layer claims reworded to what ships (`e68b58a`)
- [ ] Approach: KB budget, second AGENTS.md, Edit-only enforcement, opt-in
      PDCA, seeded-canon updates, naming — decide before Round 14 builds
- [ ] Hardening batch: ref atomicity and nested warning, orphan report in
      `sync`, exit codes, list/validate naming, audit gate on any finding,
      registry SHA pinning

### Standing

11. **Re-run the practice survey** — due 2027-02-28, or earlier on a trigger
    listed in §4.1 of the baseline. Compare, score our volatility predictions,
    then write a *new* dated baseline; the 2026-08-29 one stays untouched.

### Release mechanics

8. **CHANGELOG for v0.2.0** — the instruction-file change is breaking for
   existing scaffolded projects.
   _2026-09-15_: left to `release.yml`, which regenerates the file with
   git-cliff at tag time. Merge the PR with a merge commit; a squash drops the
   `!` marker from `765ac08` and collapses the log to one line.
9. **Migration note** — `.claude/CLAUDE.md` → `CLAUDE.md`, and the new root
   `AGENTS.md`. Consider a `migrate` command, or document the two moves.
   _2026-09-15_: documented as "Upgrading from 0.1.x" in `docs/usage.md`
   (`348e525`). No `migrate` command: nobody has needed one yet, and each
   step touches a file the user may have edited.
10. **Decide the version bump** — breaking changes pre-1.0; per Q5 of the repo
    refactor plan, the bump is a human decision per release.
    _2026-09-15_: **v0.2.0**, decided in session. `765ac08` carries a
    `BREAKING CHANGE:` footer and `--force` changed meaning; pre-1.0 SemVer
    puts that on the minor. A 0.1.1 would mislabel a layout change.
11. **Root-level `skills/` layouts** — a real repo kept its skills at
    `<root>/skills`. Decided 2026-09-15: adopt, do not migrate. `-d .` already
    covered validate/audit; `skill ref --from .` produced a pointer anchored
    above the repo and is fixed (`56d728e`). Record:
    [`memory/2026-09-15-root-level-skills-adopt-not-migrate.md`](../../memory/2026-09-15-root-level-skills-adopt-not-migrate.md).
