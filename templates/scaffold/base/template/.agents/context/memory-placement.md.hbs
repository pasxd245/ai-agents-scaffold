# Memory placement

> Where agent memories live, and how to choose between the two places they
> can go. Canonical — see [AGENTS.md](../AGENTS.md) for the authority model.

---

## Two memory systems

A repository scaffolded this way has two. They are **not interchangeable**,
and the common failure is writing to the wrong one without noticing.

| Location                                     | Holds                                | Travels with                        | Who sees it                          |
| -------------------------------------------- | ------------------------------------ | ----------------------------------- | ------------------------------------ |
| `.agents/memory/`                            | Project knowledge                    | git — machines, agents, contributors | Everyone on the repo, every harness  |
| The harness's own memory, outside the repo   | Habits local to one person + machine | Nothing                             | One install, on one machine          |

Claude Code's is at `~/.claude/projects/<project>/memory/` with a `MEMORY.md`
index. Other harnesses have their own, or none. The rule below does not depend
on which harness you use.

---

## What belongs where

**`.agents/memory/`** — anything the project needs:

- Stack and tooling decisions, and why the rejected option was rejected
- Architectural lessons learned the hard way
- Deferral rationales, with the trigger that would revisit them
- Incidents and their root causes
- Repo-specific quirks that would bite the next person

Format is set by [`memory/_TEMPLATE.md`](../memory/_TEMPLATE.md); filenames are
`YYYY-MM-DD-short-topic.md`.

**Harness memory** — only what genuinely should not travel:

- How one person likes to work, across all their repos
- Quirks of one harness that mean nothing to the others
- Machine-local paths and setup

> If another agent or a human contributor on this repo would benefit from
> seeing it, it does **not** belong in harness memory.

---

## The decision rule

Before saving, ask:

> _Would a different agent, or a human contributor, working on this repo next
> month benefit from seeing this?_

- **Yes** → `.agents/memory/`, using the template.
- **No — it is about how I personally work** → harness memory is fine.
- **Unsure** → `.agents/memory/`. A false positive costs a little shared
  knowledge nobody needed. A false negative costs the next contributor the
  context, and they will not know it existed.

---

## Recalling

- Project questions — what stack, what was deferred, what went wrong before —
  read `.agents/memory/` first.
- Preference questions — how does this person like work scoped — harness
  memory.
- **Both go stale.** A memory is what was true when it was written. Check
  `Review-by` first: past that date the finding is unverified, not wrong.
  Verify it against current code, then move the date or flag it. Nothing
  expires a memory automatically.

---

## When the two disagree

1. `.agents/memory/` wins. It is the shared source of truth.
2. Update or delete the harness-memory entry, so the contradiction does not
   come back.
3. If the disagreement reveals a decision that genuinely changed, that is not
   a stale memory — surface it to the human before acting.

---

## Extraction — harness memory into the repo

**If a harness-memory entry becomes load-bearing for the project — another
agent needs it, a `.agents/` file would cite it, or losing it on a machine
change would hurt — it MUST be extracted into `.agents/memory/`.**

This is an active rule, not an aspiration. Procedure:

1. **Re-frame** it with [`_TEMPLATE.md`](../memory/_TEMPLATE.md). Do not paste
   it across; a note written for one agent's private use rarely reads as
   project knowledge.
2. **Delete the original**, or reduce it to a one-line pointer. Stale
   duplicates are the failure mode this whole file exists to prevent.
3. Note the extraction in the new file's `Status`.

---

## Promotion

`.agents/memory/` entries may be promoted into `context/` (stable principles)
or `skills/` (reusable procedures), per
[reference/memory-and-promotion.md](../reference/memory-and-promotion.md).
Promotions are logged in [plan/promotions.md](../plan/promotions.md).

Harness memory has **no** promotion path. An entry is either local forever, or
extracted into `.agents/memory/` first — only then can it be promoted.
