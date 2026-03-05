# Round 03: Release Readiness — CI/CD Pipeline + Documentation

**Status**: Complete
**Date started**: 2026-03-03
**Date completed**: 2026-03-03

## Goal

Prepare the repository for its first public release (v0.0.1). This includes
automated release infrastructure (GitHub Actions + git-cliff) and detailed
user-facing documentation (`docs/usage.md`, `docs/api.md`).

## Plan

- [x] Assess release readiness (tests, packaging, npm name availability)
- [x] Set up CI workflow — tests on push/PR to main and dev
- [x] Set up release workflow — tag push → tests → changelog → GitHub Release → npm publish
- [x] Configure git-cliff for conventional commit changelog generation
- [x] Create `docs/usage.md` — detailed CLI usage guide
- [x] Create `docs/api.md` — programmatic API reference for all 4 exports
- [x] Update README.md with links to new docs
- [x] Update `architecture.md` to reflect new CI/CD and docs structure
- [x] Complete Round_02 Act phase

## Do

### 2026-03-03

- Ran full release readiness audit:
  - 19/19 tests passing, 522 LOC, clean `pnpm pack` (21 files)
  - Verified `a2scaffold` npm name is available
  - Set `package.json` version to `0.0.1`
- Created `.github/workflows/ci.yml` — lightweight CI on push/PR to main + dev
- Created `.github/workflows/release.yml` — full release pipeline:
  - Checkout with full history → pnpm install → tests
  - git-cliff generates release notes (latest tag) for GitHub Release
  - npm publish with `NPM_TOKEN` secret
  - git-cliff generates full CHANGELOG.md → bot commits to main
- Created `cliff.toml` — conventional commits config with type-based grouping,
  skips `chore(release)` and `chore(deps)`, links issues to GitHub
- Created `docs/usage.md` — installation, all options table, common workflows
  (scaffold, dry-run, list, force, use), file conflict handling, output tree,
  exit codes
- Created `docs/api.md` — full reference for `scaffold()`, `listTemplates()`,
  `resolveTemplatePath()`, `checkExistingFiles()` with parameters, return types,
  examples, and deep-merge behavior explanation
- Added Documentation section to README.md linking to both docs
- Updated `architecture.md` with CI/CD pipeline and docs in module map
- Completed Round_02 Act phase and marked Complete

## Check

- [x] `pnpm test` — 19 tests pass, 0 failures
- [x] CI workflow triggers on push/PR to main and dev branches
- [x] Release workflow triggers on `v*.*.*` tag push
- [x] git-cliff config parses conventional commits correctly
- [x] `docs/usage.md` covers all CLI flags and common workflows
- [x] `docs/api.md` documents all 4 exported functions with accurate signatures
- [x] README.md links to docs resolve correctly
- [x] `architecture.md` reflects current project structure

## Act

**Learnings**:

- git-cliff's `orhun/git-cliff-action@v4` supports both `--latest` (for release
  notes) and full generation (for CHANGELOG.md) — use two separate steps
- The release workflow needs `fetch-depth: 0` for git-cliff to see all tags/history
- Bot commits to main from the release workflow require `permissions: contents: write`
- Separating CI (test-only) from Release (test + publish) keeps PR feedback fast

**Promotions**:

- [ ] → context/ : CI/CD pipeline patterns (needs validation after first real release)

---

### 2026-03-05 — Correction note (appended post-completion)

The release workflow described in the Do section above reflected the **initial** implementation.
It was subsequently refactored before v0.0.1 was tagged. Key differences from what was documented:

| Aspect | As documented in Do | Actual current state |
| --- | --- | --- |
| git-cliff install | `orhun/git-cliff-action@v4` | `taiki-e/install-action@v2` (git-cliff@2.6.1) |
| npm auth | `NPM_TOKEN` secret | OIDC (`id-token: write` + `--provenance`) |
| CHANGELOG commit | Bot commits directly to main | `peter-evans/create-pull-request@v6` opens a PR to main |
| Tag pattern | `v*.*.*` | `v*` |
| `pnpm test` | `pnpm test` | `pnpm test --if-present` |
| Build step | absent | `pnpm run build --if-present` added |
| Version safety check | absent | added (tag vs package.json version guard) |
| Dist-tag computation | absent | added (`latest` vs `next` based on hyphen in version) |

`context/architecture.md` (Release Pipeline section) updated to reflect the actual pipeline.
