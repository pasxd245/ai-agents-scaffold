# Promotion Log

> Append-only log of memory entries promoted to `context/` or `skills/`.
> See [PDCA.md](PDCA.md) for methodology and [AGENTS.md](../AGENTS.md) for promotion criteria.

---

<!-- Append new entries below this line using the format:

## YYYY-MM-DD: [Topic] → [Destination]

**Source**: memory/[filename]
**Rationale**: [1-2 sentences]
**Promoted by**: [Human name]

-->

## 2026-02-28: js-tmpl Integration Patterns → context/

**Source**: Round_01 Act phase learnings
**Rationale**: Verified patterns for using js-tmpl's API, partials, path resolution, and values merging — foundational knowledge for all future development.
**Promoted by**: Vien Pham

## 2026-02-28: Template Creation Checklist → skills/

**Source**: Round_01 Act phase + CONTRIBUTING.md
**Rationale**: Step-by-step reusable procedure for adding new templates, validated during base template creation.
**Promoted by**: Vien Pham

## 2026-03-05: Release Pipeline (actual) → context/architecture.md

**Source**: `.github/workflows/release.yml` + Round_03 correction note
**Rationale**: Round_03 documented an initial workflow design that was refactored before v0.0.1 was tagged. Updated `context/architecture.md` to reflect the actual pipeline (OIDC, PR-based changelog, dist-tag logic). Also appended a correction table to Round_03 and created `memory/2026-03-05-release-workflow-refactor.md`.
**Promoted by**: Vien Pham

## 2026-03-19: Prompt Conventions → context/conventions.md

**Source**: reflect-agents prompt validation and .prompt.md adoption
**Rationale**: Documented the `.prompt.md` extension and YAML frontmatter convention after establishing it across all three prompt files.
**Promoted by**: Vien Pham

## 2026-04-06: Optional Partials for js-tmpl 0.0.1 → context/

**Source**: Published `@nci-gis/js-tmpl@0.0.1` package behavior review
**Rationale**: Corrected authoritative guidance that still claimed `partials/` was mandatory. The published package skips partial registration when `partialsDir` is omitted, so runtime validation and template guidance were updated to make `partials/` optional.
**Promoted by**: Human-confirmed agent update

## 2026-04-06: Skill-Ref Pattern → context/skill-refs.md

**Source**: Round_04 Act phase — skill ref implementation
**Rationale**: Documented the skill-ref pattern (lightweight SKILL.md pointers with `metadata.type: skill-ref`), including directory layout, path computation, passthrough behavior, and conflict rules.
**Promoted by**: Human-confirmed agent update

## 2026-08-29: Project Philosophy → context/philosophy.md

**Source**: Round_13 — derived from `ecosystem-ideas.draft.md`, the repo
refactor plan, and existing `context/conventions.md`
**Rationale**: The principles that decide close calls were scattered across
planning docs and implicit in code review. Collected into canonical context and
summarised in every root instruction stub, so agents load them each session.
**Promoted by**: Vien Pham

## 2026-08-29: Governance long-form split → governance.md

**Source**: Round_13 — context-budget work
**Rationale**: `.agents/AGENTS.md` is imported into every session and had grown
to 315 lines; imports load at launch and count in full against the context
window, and adherence drops as instruction files grow. Memory format, promotion
criteria, skill authoring and the `docs/agents/` policy moved to an on-demand
reference. No content was dropped.
**Promoted by**: Vien Pham

## 2026-08-29: Memory Placement Rule → context/memory-placement.md

**Source**: Dogfooding `my-dynamic-dashboard` — their `context/memory-placement.md`,
codified there in Round_05 after three project memories were saved to harness
memory and had to be migrated.
**Rationale**: Two memory systems exist the moment a harness with its own memory
is used, and nothing in the scaffold said which was which. Their version was
validated by 15 months of use; generalised here (harness-neutral, project
examples removed) and shipped with the `memory/_TEMPLATE.md` it depends on.
Closes a v0.2.0 open item that our own research pass had only identified, not
answered.
**Promoted by**: Vien Pham

## 2026-08-29: Harness Behaviour Facts → context/harness-behaviour.md

**Source**: Round_13 — facts gathered during the practice survey and, in three
cases, corrections found only by reading the primary docs.
**Rationale**: The scaffold's layout, line budgets and permission rules are all
downstream of how the harnesses actually load and enforce files, and those
facts were scattered inline across `AGENTS.md`. Collected into dated, sourced
canon with re-verify triggers — they are someone else's product behaviour and
will change without notice. Three assumptions had already shaped decisions
before anyone checked them.
**Promoted by**: Vien Pham

## 2026-08-29: Skill Pool, Round Template and Opt-in `decisions/`

**Source**: Backlog review of Round 13 plus
`memory/2026-08-29-dogfood-my-dynamic-dashboard.md`.
**Rationale**: Four changes, authorised in session by the human after an
explicit warning that canon would be modified.

1. **`templates/skills/a2scaffold/`** — the built-in pool advertised
   `skill add <name>` and shipped nothing, and `context/philosophy.md` cites
   `templates/skills/planning/master-plan/` as a worked example of a path that
   does not exist. The pool now has its first occupant: a skill that teaches an
   agent to drive the CLI rather than hand-write `.agents/` content, which is
   the drift the tool exists to remove. Guarded by a test that holds every pool
   skill to 100/100 conformance and a clean audit.
2. **`plan/cycles/_TEMPLATE.md`** — the round format was prose inside
   `PDCA.md`, against the rule `reference/memory-and-promotion.md` states for
   the memory format: two copies drift, and the copyable one wins. `PDCA.md`
   now points at it.
3. **Three-digit round references** — `096ef3a` moved numbering to
   `Round_NNN` but left `Round_XX` in `reference/docs-agents.md` and
   `skills/master-plan/SKILL.md`. Corrected.
4. **`plan.decisions` flag** — opt-in `.agents/decisions/` for cross-round
   commitments, off by default. The flag moves the directory, the knowledge
   base's map and authority table, and the `.claude/settings.json` permission
   rules together; a test asserts all three, in both states.

**Not done, and why**: `plan/DoD.md` was not promoted into the template. Our
own copy has been stale since Round 04 and duplicates the PDCA Check phase —
evidence against shipping it, not for.
**Promoted by**: Vien Pham (authorised in session; drafted by Claude Code)

## 2026-08-29: The `.agents/` vs `docs/agents/` Line

**Source**: Human design call in session, prompted by
`memory/2026-08-29-dogfood-my-dynamic-dashboard.md` §2.3 — two repos had put
multi-round plans in two different places and neither had written down why.
**Rationale**: The split was being drawn on **ownership**, which does not cut
cleanly — `context/` is human-written and agent-read. Redrawn on **audience**:

> `.agents/` is what an agent must read to do the next task.
> `docs/agents/` is what a human reads to understand the project.

An agent may draft either; the audience decides where it lands. Consequences:

1. **`reference/docs-agents.md` removed from the template**, with its row in
   the knowledge-base table. The scaffold was shipping 50 lines of policy for
   a directory it never creates — the same "hardcoded our own repo's shape into
   a template meant for every repo" bug the dogfood report caught elsewhere.
   `docs/agents/` is now a documented recommendation in `docs/usage.md`.
   This repo keeps its own copy, because this repo uses the convention.
2. **`plan.programs` flag** — opt-in `.agents/plan/programs/` for multi-round
   work, which is agent-audience by the test above. `brainstorms/` was
   considered and rejected: exploratory thinking is read once by a person, and
   graduates to a program or a plan doc the moment it matters.
3. **`**Part of**` header** on the round template — the single link from a
   round up to its program or plan doc. Minimal on purpose; the fuller
   `Inherits`/`Feeds` lineage was deferred until a round actually needs it.
4. **`plan/DoD.md` shipped after all**, general only. The earlier decision not
   to ship it confused the file with our copy of it: ours rotted because it
   accumulated `## Round 04 — Skill Ref: Specific Criteria`, not because a
   standing bar is a bad idea. The shipped file says so in its own header.

**Promoted by**: Vien Pham (design call in session; drafted by Claude Code)

## 2026-08-29: Pool Promotion, and Two Miscalibrated Gates

**Source**: Human review of skill reusability, plus what dogfooding the move
surfaced.
**Rationale**: `templates/` is in `package.json`'s `files` array and
`.agents/skills/` is not, so **`templates/skills/` is the only thing that
ships**. Three generic skills were contributor-only by accident of location.

- `planning/master-plan`, `repo-explainer` and `research` moved into the pool;
  `create-template` stays repo-only, being a procedure for adding templates to
  this repo. `master-plan` sits under `planning/` so the path
  `context/philosophy.md` cites as a worked example is now real.
- The pool is canonical and this repo installs from it with `skill add`, the
  same path a user takes. A test asserts the installed copies are byte-identical
  to the pool, so drift fails CI.
- All four skills are projected into `.claude/skills/` and `.github/skills/`.
  Only `create-template` had been — the other three sat in `.agents/skills/`
  where no harness could reach them.

**Two of our own gates were wrong, and moving the skills is what showed it**:

1. **`skill validate` and `skill audit` did not recurse.** `skill list` did, and
   `skill add group/name` is documented, so a nested skill was reported as a
   directory missing its `SKILL.md` — a high-severity audit finding for a
   healthy skill. Both now use `discoverSkills`.
2. **The conformance trigger regex rejected `Use before …`.** `master-plan`
   scored 85 for a description that names its trigger in its first three words.
   Widened to accept `use before|after|during|while` and `skip for|when`, with
   a calibration test. Same class as the audit false positives from dogfooding:
   a heuristic that pushes authors to reword good content to satisfy a regex.

The pool gate now requires 100/100 and no high-severity finding, and every
medium finding must be **declared in the test with a reason** — `research`
documents crawl4ai, so its reference file necessarily contains network calls.
An undeclared finding fails.

**Promoted by**: Vien Pham (assessment confirmed in session; drafted by Claude Code)

## 2026-08-29: The Title and the Philosophy Summary Belong to the Author

**Source**: Human question — whether a project-specific stub title
("# AI-Cowork — the owner's daily work & life base") is better than the
generated "# CLAUDE.md — <project>".
**Rationale**: Yes, and it already worked — the H1 sits outside the managed
region in all four stubs. It was undocumented and untested, so it was one
careless edit from breaking. Now documented in `docs/usage.md` and locked by a
test.

The same review found a real defect: the **philosophy summary was inside the
managed region** while `context/philosophy.md` instructs the reader to replace
its placeholder principles. Any project that followed that instruction would
have had its real principles silently reverted on the next re-scaffold — this
repo's own `CLAUDE.md` carries seven real principles against the template's five
placeholders, and would have lost them. The summary moved outside the block,
with a comment in the partial saying it is seeded once and then owned by the
author.

Not done: regenerating this repo's four root files, which still carry no
managed-region markers at all. Deferred to `a2scaffold sync` (backlog item 4)
rather than hand-patched.
**Promoted by**: Vien Pham (design call in session; drafted by Claude Code)

## 2026-08-29: Pool Skills Re-anchored, and a Regression I Introduced

**Source**: Human review — "do those skills carry repo-specific info, and are
they still effective if we modify them?"
**Rationale**: Yes, and two references were already **wrong in this repo**, not
merely non-portable: `repo-explainer` told the agent to read `bin/cli.js` (the
entry point is `bin/a2scaffold`) and `master-plan` used `src/skills.js` as an
example (split up long ago). A stale pointer in a skill is worse than a vague
one — it reads as authoritative.

**The correction is re-anchoring, not generalising.** Stripping specifics to
gain portability produces the vague skill our own conformance scorer exists to
penalise: "run the tests" is a weaker instruction than "run `pnpm test`". Four
kinds of specific, four treatments:

| Kind                                                              | Treatment                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| This repo's toolchain (`pnpm test`, `src/index.js`)               | Became a discovery instruction — where to look, in what order, "do not guess" |
| What the scaffold guarantees (`.agents/plan/cycles/`, `context/`) | Kept verbatim; a pool skill may lean on the scaffold's own contract           |
| Illustrative examples (diagrams, phase titles)                    | Kept concrete, marked as placeholders, and corrected                          |
| Unverifiable history (commits `1d34b14..da8aad5` on `dev`)        | Deleted                                                                       |

**Regression, mine**: nesting `master-plan` under `planning/` broke two
relative links that were correct one level up. That exposed a structural rule
rather than a typo — `installSkill` copies verbatim, so a single file serves
both `templates/skills/<name>/` and `.agents/skills/<name>/` at whatever depth
the user installs it. **No parent-relative link can resolve in both**, so pool
skills now use backticked paths, enforced by a test.

Two gaps that let it through, both closed:

- `.markdownlint-cli2.jsonc` ignored `templates/**`, so moving skills into the
  pool silently removed them from link linting. Narrowed to
  `templates/scaffold/**` — rendered templates contain Handlebars and cannot be
  linted; pool skills are plain markdown. Linted files: 39 → 45.
- The pool test checked conformance and audit but not link integrity. It now
  also fails on any parent-relative link.

**Promoted by**: Vien Pham (review and direction in session; drafted by Claude Code)

## 2026-08-29: A Skills Directory Is One Level — and the Round Format Is One Format

**Source**: Human review — "is nested `.claude/skills/planning/master-plan/`
still valid, and does master-plan's output match the round template?" Both
answers were no.

### 1. Nested skills are undiscoverable

`skill ref` had projected `.claude/skills/planning/master-plan/SKILL.md`.
Claude Code discovers `<skills-dir>/<skill-name>/SKILL.md` and nothing deeper,
so the skill was silently unreachable in this repo.

**Verified empirically in a live session**: while nested, `master-plan` was
absent from the session's skill list; flattened, it appeared immediately,
without a restart. The docs agree — the only nesting Claude Code supports is a
separate `.claude/` directory elsewhere in the tree (`apps/web:deploy`), which
is a different mechanism, and namespacing exists only for plugins.

The nastiest part: the file stayed **spec-valid** throughout. agentskills.io
requires `name` to match the parent directory, which `master-plan` inside
`planning/` satisfies. So `skill validate` reported 100/100 on a skill no
harness could find. Validity and discoverability are different properties and
we were only checking one.

Recorded in `context/harness-behaviour.md` as dated, sourced canon — the file
exists for exactly this class of fact. `master-plan` is flat again, and a test
now fails on any grouped pool skill.

This was my error, introduced earlier the same day to make a worked example in
`context/philosophy.md` literally true. **`philosophy.md` still cites
`templates/skills/planning/master-plan/` as an example path, and that path
cannot exist for a projectable skill.** Flagged for human review rather than
edited; canon is not mine to correct.

### 2. Two round formats

`master-plan` step 4 emitted `# Round NNN — <goal>` / `## Invariants` /
`## Phases`, while `plan/cycles/_TEMPLATE.md` expects
`Status`/`Part of`/`Goal`/`Plan`/`Do`/`Check`/`Act`. A round written by the
skill had no `Status` for the PDCA lifecycle to track, no `Check` for the DoD's
"record what you could not verify", and no `Part of` for the lineage header.

The skill now copies the template and puts invariants and the phase table under
`## Plan`, leaving `Do`/`Check`/`Act` for execution. Same rule that produced
`_TEMPLATE.md` in the first place: two copies of a format drift, and the
copyable one wins. I created the second copy the same day I wrote that rule.

**Promoted by**: Vien Pham (review and direction in session; drafted by Claude Code)

## 2026-08-30: PR pre-review fixes → `.agents/` canon (authorised write)

**Source**: `PR-review.md`, findings on the authority/PDCA contradiction and
the `--force` conflation, verified against the code before acting.

**Rationale**: The generated authority table forbade the `Do`/`Check` writes
the generated PDCA guide asks for, and the PDCA compaction procedure required
deleting round files the same document calls append-only. An agent reading the
higher-authority root file had to refuse the workflow the lower-level guide
prescribed. Both are now stated once: `plan/` allows appending to
`promotions.md` and editing `Do`/`Check` of an active round, and compaction is
named as the append-only exception a human authorises. Fixed at the template
first (`templates/scaffold/base/template/.agents/`), then applied here, so the
scaffold and its own dogfood do not diverge.

Three files touched under the read-only path: `AGENTS.md` (authority table),
`plan/PDCA.md` (compaction exception), and `skills/a2scaffold/SKILL.md`
(reinstalled from the pool after the `--adopt`/`--force` split).

**Promoted by**: Vien Pham (authorised in session after warning; drafted by Claude Code)

## 2026-09-15: v0.2.0 release prep → `.agents/` canon (authorised write)

**Source**: the v0.2.0 release plan, approved in session. Prompted by a real
case: a repo that keeps its skills at `<root>/skills` rather than
`.agents/skills`.

**Rationale**: `skill ref` anchored its pointer at the _parent_ of the source
agents dir and embedded that dir's basename in `skillPath`. When the source dir
is the project root (`--from .`), the pointer became
`../../<repo-folder>/skills/<name>`: correct on the author's machine, broken on
any clone under another folder name. The anchor is now the deepest directory
containing both source and destination, which is byte-identical for the
sibling layout the tool generates and portable for the root-level one.
`context/skill-refs.md` stated the old formula, so it is updated to the new one
in the same commit; the field meanings are unchanged.

Touched under the read-only path: `context/skill-refs.md` (path computation),
and `skills/a2scaffold/SKILL.md` (reinstalled from the pool after it gained a
whole-repo skill review procedure, the `-d .` layout note, and a correction:
per-repo values live in `.a2scaffold/values.*`, not in the rc file).

**Promoted by**: Vien Pham (plan approved in session; drafted by Claude Code)

## 2026-09-16: pre-release review → `.agents/` canon (authorised write)

**Source**: an adversarial review of v0.2.0 run in session (three independent
passes: premise, CLI, security). Durable record:
`memory/2026-09-16-pre-release-adversarial-review.md`.

**Rationale**: `AGENTS.md` claimed "a permission layer is not [ignorable]".
The layer this tool ships is an `ask` rule on the `Edit` tool, interactive
only; Bash, Write and git bypass it, and in this very session canon under
`.agents/` was edited through a shell with no prompt. The sentence was false
for the layer we ship, and a reader who trusted it would under-review exactly
the inputs that carry risk. Reworded at the template first, then here, same
line count so the knowledge-base budget test holds.

Touched under the read-only path: `AGENTS.md` (authority paragraph).

**Promoted by**: Vien Pham (review requested in session; drafted by Claude Code)
