# Governance — long-form reference

> Companion to [AGENTS.md](AGENTS.md), which is imported into every session.
> This file is **not** auto-loaded — it holds the detail that only matters
> when you are actually writing a memory file, proposing a promotion, or
> authoring a skill.
>
> **Read this before** writing to `.agents/memory/`, proposing a promotion to
> `context/` or `skills/`, authoring a `SKILL.md`, or adding anything under
> `docs/agents/`.

---

## Memory File Format (Recommended)

**Filename**: `memory/YYYY-MM-DD-short-topic.md` or `memory/agent-name-topic.md`

```markdown
# [Short Descriptive Title]

**Date**: YYYY-MM-DD
**Agent**: [tool name]
**Confidence**: High | Medium | Low
**Status**: New | Needs Review | Promoted | Archived

## Problem

Brief description of issue or question

## Finding

What you discovered (concise)

## Evidence

- Files: `src/path/to/file.py`
- Commits, tests, or links

## Recommendation

**Do**: Bullet list of actionable patterns
**Don't**: Bullet list of anti-patterns

## Promotion Candidate?

[ ] context/ – Stable pattern, broadly applicable
[ ] skills/ – Reusable procedure/checklist
[ ] Not yet – Needs more validation
```

**Status lifecycle:**

- `New` → Agent just created this
- `Needs Review` → Outdated, conflicting, or requires validation
- `Promoted` → Moved to context/ or skills/
- `Archived` → Historical reference only

---

---

## Evolution Model

```text
1. Agent captures insight → memory/
2. Human reviews periodically
3. Valid insights promoted → context/ or skills/
4. Promotion logged in plan/promotions.md
```

**Human feedback loop**: See `plan/PDCA.md` for systematic review methodology.

**Promotion criteria:**

- **To `context/`**: Stable pattern, validated 3+ times, broadly applicable
- **To `skills/`**: Reusable procedure with clear triggers and steps

---

### Skills Format ([Agent Skills spec](https://agentskills.io/specification))

Each skill is a directory under `skills/` containing a `SKILL.md` file
with YAML frontmatter:

```text
skills/<skill-name>/
  SKILL.md          # Required: frontmatter + instructions
  scripts/          # Optional: executable code
  references/       # Optional: additional docs
  assets/           # Optional: templates, data files
```

`SKILL.md` must include:

```markdown
---
name: <skill-name>
description: What this skill does and when to use it.
---

## Trigger

This skill activates whenever...

## Procedure

1. Step one
2. Step two
```

The `name` field must match the directory name (kebab-case, lowercase).

**Promotion log format** (in `plan/promotions.md`):

```markdown
## YYYY-MM-DD: [Topic] → [Destination]

**Source**: memory/[filename]
**Rationale**: [1-2 sentences]
**Promoted by**: [Human name]
```

**Principle**: Stability > Speed. Promotion requires validation.

---

---

## External Knowledge Base (`docs/agents/`)

The `docs/agents/` directory is a **shared KB between humans and AI agents**
for durable, reference-grade documentation that lives alongside the code.

Unlike `.agents/` (which is agent-operational — context, memory, skills,
plans), `docs/agents/` is **human-facing reading material that agents also
consume** when context is needed beyond `.agents/`.

```text
docs/agents/
  workflows/                       # End-to-end workflows this repo supports
    <name>.workflow.md             # One file per supported workflow
  plan/                            # Co-planning docs (human + AI brainstorm)
    <yyyyMMdd>-<name>.plan.md      # Master plans, dated & named
```

**Planning docs — two locations, different roles:**

| Location               | Role                                                | Lifecycle                       |
| ---------------------- | --------------------------------------------------- | ------------------------------- |
| `docs/agents/plan/`    | Co-planning (brainstorm, strategy, open questions)  | Long-lived; revised in place    |
| `.agents/plan/cycles/` | Per-phase implementation verification (PDCA rounds) | Append-only; one file per round |

When a plan in `docs/agents/plan/` kicks off work, each executed phase
records a verification cycle in `.agents/plan/cycles/Round_XX.md`.

**Load policy:**

- Agents SHOULD read files in `docs/agents/` that are relevant to the task
  (e.g. read `docs/agents/workflows/skill.workflow.md` before modifying
  skill-related code).
- Not auto-loaded — consult on demand.
- Authority order: `.agents/context/` > `docs/agents/` > `.agents/memory/`.
  If a conflict arises, canonical context wins; flag the mismatch in
  `.agents/memory/`.

**Write policy:**

- Humans own `docs/agents/`. Agents MAY propose new files or edits, but
  must confirm with the human before writing (same rule as `.agents/context/`).
- Workflow files describe _what the repo supports_, not internal agent
  guidance — keep prose readable for human contributors.

---
