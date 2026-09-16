# The `docs/agents/` knowledge base

> **Read this when**: adding or editing anything under `docs/agents/` —
> a workflow doc, a co-planning doc, or a research baseline.

---

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
records a verification cycle in `.agents/plan/cycles/Round_NNN.md`.

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
