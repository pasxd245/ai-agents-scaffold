# Programs

> A program is work that spans several rounds. It exists so a cold agent
> picking up round 5 of 9 can tell what it is executing and why.

Rounds in `../cycles/` are the unit of execution. A program is the unit above
them: the goal that outlives any one round, the phase order, and the gate each
phase has to clear.

## When to open one

When the work will not fit in one round **and** the phases depend on each
other. Independent work does not need a program — it needs several rounds.

## Relationship to everything else

```text
docs/agents/plan/  →  programs/  →  cycles/Round_NNN.md  →  promotions.md
  (human plans)       (what we      (one round of              (what became
                       are running)   execution)                 canon)
```

Each round names its program in its `**Part of**` header. That header is the
only link between the two, so a round without it is an orphan.

## Format

Copy [`_TEMPLATE.md`](_TEMPLATE.md), named `<short-name>.md`.
