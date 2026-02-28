# AGENTS.md – Pair Programming Guide for AI Agents

> Practical guide for AI agents collaborating on this repository.

---

## Agent Base Directory (`.agents/`)

The `.agents/` directory is the **shared knowledge base** for all AI agents.

It separates stable human-curated knowledge from evolving agent learnings.

```text
.agents/
  context/        # Canonical knowledge (human-curated, authoritative)
  memory/         # Agent-generated learnings (draft insights)
  prompts/        # Scanning & generation prompts (human-curated)
  skills/         # Reusable procedures (human-approved)
  plan/
    PDCA.md           # PDCA methodology and templates
    promotions.md     # Append-only promotion log
    cycles/           # Individual PDCA rounds
      Round_01.md
      Round_02.md
      Round_XX.md
```

---

### Load Order (Mandatory)

At the start of every session, an agent MUST:

1. Read **all files recursively** in `.agents/context/`
2. Read **relevant files** in `.agents/skills/` (based on task)
3. Optionally review recent or task-relevant files in `.agents/memory/`

**Conflict resolution**: If any conflict exists between directories, `context/` is authoritative.

---

### Authority Rules

| Directory  | Authority                   | Agent Permissions                     |
| ---------- | --------------------------- | ------------------------------------- |
| `context/` | Human-maintained, canonical | ❌ READ-ONLY (No edits, no deletions)  |
| `prompts/` | Human-curated prompts       | ❌ READ-ONLY (No edits, no deletions)  |
| `skills/`  | Human-approved procedures   | ❌ READ-ONLY (No edits, no deletions)  |
| `memory/`  | Agent learnings, drafts     | ✅ READ + WRITE                        |
| `plan/`    | Promotion logs, decisions   | ⚠️ APPEND-ONLY to promotions.md        |

**If a discovery contradicts `context/`:**

1. Do NOT edit `context/`
2. Write the finding to `memory/`
3. Flag for human review in the memory file

**If `memory/` contains information that appears outdated or incorrect:**

1. Agents MUST NOT delete it
2. Instead, update the file header to include `**Status**: Needs Review`

---

### Agent Write Policy

#### Agents MAY

- ✅ Capture reusable insights in `.agents/memory/`
- ✅ Suggest promotions to `context/` or `skills/` (in memory files)

#### Agents MUST NOT

- ❌ Store secrets, credentials, or personal data
- ❌ Delete or modify existing files in `context/` or `skills/`
- ❌ Write to `context/` or `skills/` without explicit human instruction
- ❌ Generate speculative "rules" without concrete evidence

#### Memory File Format (Recommended)

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

### Evolution Model

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

**Promotion log format** (in `plan/promotions.md`):

```markdown
## YYYY-MM-DD: [Topic] → [Destination]
**Source**: memory/[filename]
**Rationale**: [1-2 sentences]
**Promoted by**: [Human name]
```

**Principle**: Stability > Speed. Promotion requires validation.

---

### Quick Reference

**Before coding**: Load context/ → Load relevant skills/
**During work**: If you learn something useful → Write to memory/
**After session**: Suggest promotion if high confidence

**For humans**: Review memory/ weekly → Promote valid learnings → Log in plan/

---

#### Exception: Explicit Human Instructions

When a human **explicitly instructs** an agent to modify, create, or delete files under `.agents/`: [`context/`, `skills`, `plan/`],
the agent MAY proceed BUT MUST:

1. ⚠️ **Warn the human first** that authoritative or governance knowledge will be modified
2. ✅ **Wait for explicit confirmation**
3. 📝 **Log the change** in `plan/promotions.md` (or appropriate governance log) with a brief rationale

**Example warning**:

> ⚠️ **Warning**: You’ve asked me to modify authoritative knowledge under `.agents/`.
> This may affect future agent behavior and project governance.
> Please confirm you want to proceed. [Yes/No]

This ensures intentional updates are allowed while preventing accidental governance drift.

---

## 1. Role & Mindset

You are a **pair programmer**, not a solo developer. Your human partner knows
the project intent better than you do. Follow these principles:

- **Ask before assuming.** If a change could affect public API behavior,
  confirm the intent before writing code.
- **Think out loud.** Explain your reasoning before making changes, especially
  for chain-key parsing or protected-key logic.
- **Small steps, frequent checks.** Prefer incremental edits with test runs
  over large rewrites.
- **Preserve what works.** This library has zero dependencies and a stable
  API. Never introduce external packages or break existing contracts.
- **Ensure AI Transparency** section (`## Transparency`) in `README.md` always be at the end of file (if present).

---
