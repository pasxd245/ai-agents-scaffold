# Breaking values-key changes land in one release while the tool is pre-1.0

**Date**: 2026-09-24
**Status**: Active
**Decided by**: Vien Pham
**Revisit when**: the package has a named external consumer, or 1.0 is tagged
— whichever comes first

## Context

Round 015 renames two values keys: `guardrails.claude` and `agents.codex` both
move into a new `harness.*` group. The question was whether to ship an alias
plus a deprecation warning in 0.3.0 and drop the old spellings in 0.4.0, or to
break in one release.

Forced now because the rename is the round's first implementation step, and
the answer changes how much code that step writes.

## Decision

Breaking values-key changes land in a single minor release. No alias, no
deprecation warning, no removal round. The migration story is one section in
`docs/usage.md` next to the existing "Upgrading from 0.1.x".

An old key must **fail loudly**, naming its replacement. A key that is
silently ignored is the one outcome worse than breaking, because the repo
looks scaffolded and is not.

## Alternatives rejected

| Option                                                | Why not                                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alias in 0.3.0, drop in 0.4.0                         | Costs alias resolution, a warning path, tests for both spellings, and a cleanup to remember. Measured 2026-09-23: 0–6 downloads a day, 203 in a month, and the only consumer we can name is this repo, overriding one line. The users it protects do not exist yet |
| Keep the old names, add `guardrails.gemini` alongside | Cheapest in code, but `guardrails` is documented as "harness-native permission rules" and `context.fileName` is file discovery. The name would be permanently wrong, and names are what the next harness gets added against                                        |
| Defer the rename until 1.0                            | Pre-1.0 is the only period when a rename is cheap. Deferring converts a cheap change into an expensive one and guarantees the wrong name ships in the version people actually adopt                                                                                |

## Consequences

- A 0.2.x `values.yaml` stops working at 0.3.0. That is intended and must be
  covered by a test asserting the failure names the new key.
- This repo's own `.a2scaffold/values.yaml` migrates in the same round.
- The project cannot claim semver-grade stability for values keys before 1.0,
  and should not imply it in the README.
- If an external consumer appears before 1.0, this decision is reopened —
  the reasoning above rests entirely on there not being one.
