# Release Workflow Refactored Before v0.0.1

**Date**: 2026-03-05
**Agent**: claude-sonnet-4-6
**Confidence**: High
**Status**: New

## Problem

Round_03 documented a release workflow using `orhun/git-cliff-action@v4`, `NPM_TOKEN` secret,
and a bot commit to push `CHANGELOG.md` directly to main. Before the first tag was created,
the workflow was refactored significantly.

## Finding

The actual `.github/workflows/release.yml` differs from what Round_03 documented:

- **git-cliff**: now installed via `taiki-e/install-action@v2` (pinned to `git-cliff@2.6.1`)
  and called as a CLI, rather than using `orhun/git-cliff-action@v4`
- **npm auth**: uses OIDC (`id-token: write` permission + `--provenance` flag) — no `NPM_TOKEN` secret required
- **CHANGELOG delivery**: `peter-evans/create-pull-request@v6` opens a PR to `main` rather than
  a bot committing directly
- **Tag pattern**: `v*` (not `v*.*.*`)
- **New steps added**: version safety check (tag vs package.json), dist-tag computation
  (`latest` vs `next`), build step

## Evidence

- `.github/workflows/release.yml` (current state as of 2026-03-05)
- Round_03 correction note (appended 2026-03-05)
- `context/architecture.md` Release Pipeline section updated

## Recommendation

**Do**:
- Use OIDC for npm provenance publishing — no token management overhead
- Pin git-cliff version in `taiki-e/install-action` for reproducible changelogs
- Deliver `CHANGELOG.md` via PR to maintain human review step before merging to main
- Always run a version safety check before publishing

**Don't**:
- Use bot commits directly to main for automated changelog updates (bypasses review)
- Store `NPM_TOKEN` when OIDC provenance is available

## Promotion Candidate?

- [ ] context/ – Stable pattern, broadly applicable
- [x] Not yet – Needs validation after first real release completes successfully
