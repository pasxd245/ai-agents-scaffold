# AGENTS.md — Agent Knowledge Base

> The heart. Every harness stub points here, so this file is loaded into every
> session and competes with the task for context. **Keep it under 100 lines.**
> Detail belongs behind a trigger, not here.

---

## Load first

1. **This file.**
2. `context/architecture.md` and `context/conventions.md` — how the code is
   built and the standards it follows.
3. Anything else in `context/` your task touches (see the map).

Everything else is **on demand**: read it when its trigger fires, not before.
That includes `prompts/`, which are invoked deliberately rather than loaded at
startup.

**Conflict resolution**: `context/` is authoritative over everything else.

---

## Directory map

```text
.agents/
  AGENTS.md      # This file — loaded every session
  governance.md  # Memory format, promotion, authorised changes
  reference/     # Topic docs, each with its own trigger
  context/       # Canonical knowledge (human-curated, authoritative)
  memory/        # Agent-generated learnings (drafts)
  prompts/       # Scanning & generation prompts — invoked, not auto-loaded
  skills/        # Reusable procedures (Agent Skills spec)
  plan/          # PDCA.md, promotions.md, cycles/
```

---

## Authority

| Path                                                                          | Agents may                        |
| ----------------------------------------------------------------------------- | --------------------------------- |
| `AGENTS.md`, `governance.md`, `reference/`, `context/`, `prompts/`, `skills/` | ❌ READ ONLY                      |
| `memory/`                                                                     | ✅ READ + WRITE                   |
| `plan/`                                                                       | ⚠️ APPEND-ONLY to `promotions.md` |

Backed by permission rules in `.claude/settings.json` that make Claude Code
**ask** before any edit under `.agents/`. Instruction files are context an
agent can ignore; a permission layer is not.

**A human may still authorise a change** — warn first, wait for confirmation,
log it in `plan/promotions.md`. Procedure: [governance.md](governance.md).

**If a discovery contradicts `context/`**: do not edit it. Write the finding to
`memory/` and flag it for human review.

**If `memory/` looks outdated**: do not delete it. Add
`**Status**: Needs Review` to its header.

---

## Write policy

Agents MAY:

- ✅ Capture reusable insights in `memory/`
- ✅ Suggest promotions to `context/` or `skills/`, inside a memory file

Agents MUST NOT:

- ❌ Store secrets, credentials, or personal data
- ❌ Write to any read-only path above without explicit human instruction
- ❌ Generate speculative rules without concrete evidence

---

## Where to look for more

| Read this                                            | When                                                 |
| ---------------------------------------------------- | ---------------------------------------------------- |
| [governance.md](governance.md)                       | Writing a memory file, or proposing a promotion      |
| [reference/root-files.md](reference/root-files.md)   | Editing `CLAUDE.md`, `AGENTS.md` or any harness stub |
| [reference/mechanisms.md](reference/mechanisms.md)   | Choosing between a rule, skill, hook or sub-agent    |
| [reference/skills.md](reference/skills.md)           | Authoring or fixing a `SKILL.md`                     |
| [reference/docs-agents.md](reference/docs-agents.md) | Adding anything under `docs/agents/`                 |
| [context/philosophy.md](context/philosophy.md)       | A judgement call the rules above do not cover        |
| [plan/PDCA.md](plan/PDCA.md)                         | Opening or closing a round                           |
