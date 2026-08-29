# Round 13: Align the scaffold with 2026 agent practice

**Status**: Review
**Date started**: 2026-08-29
**Date completed**: —

## Goal

Restructure the agent instruction files around a single knowledge base, then
close the gaps a survey of current practice found between what `a2scaffold`
ships and what the field has settled on. Everything here is groundwork for
v0.2.0.

Research backing: [`docs/agents/plan/`](../../../docs/agents/plan/) — field
report published as an artifact, 24 primary and secondary sources. Key inputs:
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
- [ ] Emit path-scoped rules from `.agents/context/` — **blocked, see Check**

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

### Context budget

The knowledge base was 315 lines and is imported into every session. Split into
a ~190-line core plus [`governance.md`](../../governance.md) read on demand.
Auto-loaded files are now capped by a test, which immediately caught its own
regression when a later edit pushed the core to 202 lines.

### Enforcement

`.claude/settings.json` now carries permission rules backing the authority
table. `.gitignore` was excluding that file; it now excludes
`.claude/settings.local.json` instead, so the rules actually reach the team.

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

## Act

**Learnings**:

- Instruction files are context, not configuration. Anything that must hold
  belongs in a hook or a permission rule. This is now stated in the KB.
- Everything auto-loaded is charged to every session. Detail that only matters
  sometimes belongs behind an on-demand read.
- The emitter half of this tool is commodity — `rulesync`, `ai-rules-sync` and
  `agent_sync` all do it. The authority model, promotion path and verification
  cycles are what nothing else does.
- Verify harness behaviour against primary docs before encoding it. Three of the
  four corrections above would have shipped as silent bugs.

**Promotions**:

- [x] → context/ : `philosophy.md` — principles that decide close calls
- [ ] → context/ : harness-behaviour facts (import cost, `Edit()` vs `Write()`,
      `ask` vs `deny`). Currently inline in `AGENTS.md`; may deserve a
      `context/harness.md` if it grows.

---

## Backlog before v0.2.0

Ordered by dependency, not priority. Each is meant to be independently
landable.

### Needs a decision

1. **Path-scoped rules emitter** — see Blocked above. Requires agreeing a
   frontmatter convention for `.agents/context/`.
2. **Memory provenance and staleness** — add `Source` and `Review-by` to the
   memory file format, and document how `.agents/memory/` relates to Claude
   Code's own machine-local auto memory. Users currently have two memory
   systems and no guidance on which is which.
3. **Root `AGENTS.md` for tools with no import support** — Copilot's stub
   restates content, which drifts. Decide whether re-scaffolding is enough or
   whether it needs a `sync` command.

### Ready to build

4. **`a2scaffold sync`** — regenerate stubs from `.agents/` without a full
   scaffold. Prerequisite for items 1 and 3.
5. **Skill-ref refresh** — refs are generated once; nothing re-points them when
   the source moves.
6. **Golden snapshot tests per template** — currently each template change is
   verified by hand plus a dry-run diff.
7. **`--values-file` / `--values-dir` flags** — the only way to test a non-default
   `values.yaml` today is to edit it in place, which this round did repeatedly.

### Release mechanics

8. **CHANGELOG for v0.2.0** — the instruction-file change is breaking for
   existing scaffolded projects.
9. **Migration note** — `.claude/CLAUDE.md` → `CLAUDE.md`, and the new root
   `AGENTS.md`. Consider a `migrate` command, or document the two moves.
10. **Decide the version bump** — breaking changes pre-1.0; per Q5 of the repo
    refactor plan, the bump is a human decision per release.
