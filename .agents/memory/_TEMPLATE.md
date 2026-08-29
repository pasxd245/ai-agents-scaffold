# [Short descriptive title]

**Date**: YYYY-MM-DD
**Agent**: [tool name]
**Confidence**: High | Medium | Low
**Status**: New | Needs Review | Promoted | Archived
**Source**: [where this came from — a round, an incident, an extraction from
harness memory]
**Review-by**: [YYYY-MM-DD, or `n/a` if it cannot go stale]

> Copy this file to `YYYY-MM-DD-short-topic.md` and fill it in. See
> [context/memory-placement.md](../context/memory-placement.md) for whether a
> finding belongs here at all.

## Problem

What question or failure prompted this.

## Finding

What you discovered, in as few sentences as it takes.

## Evidence

- Files: `path/to/file`
- Commits, test output, or links

Without evidence this is an opinion, and opinions do not get promoted.

## Recommendation

**Do**: what to do next time.
**Don't**: the anti-pattern this replaces.

## Promotion candidate?

- [ ] `context/` — stable, broadly applicable, seen more than once
- [ ] `skills/` — a reusable procedure with a clear trigger
- [ ] Not yet — needs more validation

## Staleness

`Review-by` is a date past which nobody should act on this without checking.
Set it from what the finding depends on, not from a default interval:

- Depends on a provider's behaviour, an external API, or a version — **months**
- Depends on this repo's own code — **`n/a`**, it fails loudly when wrong
- A judgement call that could be revisited — **the date you would want to
  revisit it**

Past the date the memory is not wrong, it is **unverified**. Check it, then
either push the date out or set `Status: Needs Review`. Forgetting and
freshness are unsolved at the tooling level; this is manual on purpose.

---

**Status lifecycle**: `New` → `Needs Review` (stale, conflicting, or
unverified) → `Promoted` (moved into canon, logged in
[plan/promotions.md](../plan/promotions.md)) → `Archived` (historical only).

Agents must not delete a memory that looks wrong. Set `Status: Needs Review`
and say why.
