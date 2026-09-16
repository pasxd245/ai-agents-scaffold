# PDCA Methodology — Skill Generation Lifecycle

> Plan-Do-Check-Act framework for iteratively building, deploying, and
> refining AI agent skills across this project.

---

## Purpose

PDCA (Plan-Do-Check-Act) provides a structured, repeatable cycle for
evolving this project. Each initiative (feature, refactor, investigation)
is tracked as a **round** so that decisions, outcomes, and learnings
are captured and reviewable.

---

## Cycle Template

Each round follows four phases:

### Plan

- Define the **goal** (what and why)
- List concrete **steps** to achieve the goal
- Identify **risks** and unknowns
- Status: `Planning`

### Do

- Execute the steps
- Log progress, blockers, and deviations from the plan
- Status: `In Progress`

### Check

- Verify outcomes against the goal
- Run tests, review output, gather feedback
- Document what worked and what didn't
- Status: `Review`

### Act

- Promote validated learnings to `.agents/context/` or `.agents/skills/`
- Log promotions in `promotions.md`
- Archive the round
- Status: `Complete`

---

## Naming Convention

Rounds live in `.agents/plan/cycles/` and follow this pattern:

```text
cycles/
  Round_001.md   — First initiative
  Round_002.md   — Second initiative
  Round_XXX.md   — Subsequent rounds
```

Use **zero-padded three-digit** numbering. Two digits breaks at round 100:
the files then sort `Round_10, Round_100, Round_101, …, Round_11`, and every
tool that lists them lies about the order. A real project reached 174 rounds
and hit exactly this.

Three digits buys 999. If a project reaches that, renumbering is a compaction
problem (below), not a naming one.

Each file uses the round template below.

---

## Compaction

`cycles/` grows without bound — one file per round, and rounds do not stop.
Left alone it becomes the largest thing in `.agents/`, and none of it is
loaded at session start, so the cost is not context but navigation: nobody
can find the round that mattered.

**When to compact**: when the count passes roughly 20, or when you stop being
able to answer "which round decided X?" without grepping.

**How**: [`prompts/compact-content.prompt.md`](../prompts/compact-content.prompt.md)
drives the condensing. The steps below are what it has to preserve.

1. Write `ROUNDS_<first>-<last>_compacted.md` — per round, keep the goal in a
   line, what shipped, the decisions worth remembering, and the learnings.
2. Drop the parts that do not survive the round: checklists, file-by-file
   ledgers, "tests pass" restatements, LOC tables.
3. Delete the original `Round_NNN.md` files in the same commit, and say in
   the compacted file's header that `git log -- .agents/plan/cycles/` recovers
   any of them. This is the documented exception to append-only below, so it
   needs a human's say-so — an agent proposes the compaction, never performs
   it unasked.
4. Keep going from the next number. Do not renumber.

Compaction is lossy on purpose. The full record stays in git; what survives
into the file is what a reader six months out actually needs.

---

## Round Template

The format lives in [`cycles/_TEMPLATE.md`](cycles/_TEMPLATE.md) — copy that
file rather than reproducing it here. Two copies of a format drift, and the
copyable one wins.

---

## Governance

- **Rounds are append-only** — do not delete or rewrite history. Compaction is
  the one exception, and it is a human's to authorise: a closed range may be
  replaced by a single compacted record in one commit, never piecemeal, and
  never while a round in the range is still active
- **Promotions** from Act phase are logged in [promotions.md](promotions.md)
- **Promotion criteria** are defined in [AGENTS.md](../AGENTS.md)
- Agents may update the `Do` and `Check` sections of active rounds
- Only humans may move a round to `Complete` status
