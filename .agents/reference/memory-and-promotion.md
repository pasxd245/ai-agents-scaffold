# Memory and promotion

> **Read this when**: writing a file into `.agents/memory/`, proposing a
> promotion into canon, or being asked by a human to change something under
> `.agents/`.
>
> Named for its trigger, not for "governance" — a repo is free to keep its own
> canonical governance policy in `context/` without colliding with this file.

---

## Memory file format

**Filename**: `memory/YYYY-MM-DD-short-topic.md`

The format lives in [`memory/_TEMPLATE.md`](../memory/_TEMPLATE.md) — copy that
file rather than reproducing it here. Two copies of a format drift, and the
copyable one wins.

Which memory system a finding belongs in at all is decided by
[`context/memory-placement.md`](../context/memory-placement.md).

**Status lifecycle**: `New` → `Needs Review` (stale, conflicting, or
unverified) → `Promoted` (moved into canon and logged) → `Archived`
(historical only).

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

**Promotion log format** (in `plan/promotions.md`):

```markdown
## YYYY-MM-DD: [Topic] → [Destination]

**Source**: memory/[filename]
**Rationale**: [1-2 sentences]
**Promoted by**: [Human name]
```

**Principle**: Stability > Speed. Promotion requires validation.

---

## Exception: explicit human instructions

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
