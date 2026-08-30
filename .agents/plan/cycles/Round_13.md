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

Landed on `feat/restructure-agent-instructions` in three commits, each green:

| Commit    | Scope                                                  |
| --------- | ------------------------------------------------------ |
| `765ac08` | Instruction-file model, philosophy, KB split, guardrails |
| `80c7a84` | `skill validate` conformance scoring                   |
| `fb6d5e7` | `skill audit` supply-chain screening                   |

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

Still open from the same test: `.claude/CLAUDE.md` and a new root `CLAUDE.md`
now coexist with nothing detecting the old location (backlog item 9), and
`skill ref --skill all` is not atomic — it wrote one ref, hit a name collision,
and exited 1 leaving the destination half-updated.

Governance note: canon was modified under the explicit-instruction exception —
warned, confirmed, and logged in
[promotions.md](../promotions.md).

## Check

- [x] `pnpm check` green at each commit — 99 tests
- [x] Template renders correctly for all four harnesses, and with
      `agents.agentsmd` both on and off
- [x] Every markdown link and `@` import in changed files resolves
- [x] Dry-run listing in [usage.md](../../../docs/usage.md) matches CLI output
- [x] Audit detects all four categories on a hostile fixture; the crawler skill
      flags medium-only, so signal-to-noise holds
- [ ] Not verified: whether the permission rules behave as intended in a live
      session. They are declarative and syntactically checked, but untested
      against a real Claude Code run.

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
3. **Root `AGENTS.md` for tools with no import support** — Copilot's stub
   restates content, which drifts. Decide whether re-scaffolding is enough or
   whether it needs a `sync` command.

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

4. **`a2scaffold sync`** — regenerate stubs from `.agents/` without a full
   scaffold. Prerequisite for items 1 and 3.
5. **Skill-ref refresh** — refs are generated once; nothing re-points them when
   the source moves.
6. **Golden snapshot tests per template** — currently each template change is
   verified by hand plus a dry-run diff.
7. **`--values-file` / `--values-dir` flags** — the only way to test a non-default
   `values.yaml` today is to edit it in place, which this round did repeatedly.

### Standing

11. **Re-run the practice survey** — due 2027-02-28, or earlier on a trigger
    listed in §4.1 of the baseline. Compare, score our volatility predictions,
    then write a *new* dated baseline; the 2026-08-29 one stays untouched.

### Release mechanics

8. **CHANGELOG for v0.2.0** — the instruction-file change is breaking for
   existing scaffolded projects.
9. **Migration note** — `.claude/CLAUDE.md` → `CLAUDE.md`, and the new root
   `AGENTS.md`. Consider a `migrate` command, or document the two moves.
10. **Decide the version bump** — breaking changes pre-1.0; per Q5 of the repo
    refactor plan, the bump is a human decision per release.
