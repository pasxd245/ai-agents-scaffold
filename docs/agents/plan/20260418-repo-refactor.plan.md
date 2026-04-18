# Master Plan — Repo Refactor (Long-term Strategy)

- **Date**: 2026-04-18
- **Status**: Draft — co-planning
- **Owner**: Vien Pham (human) + AI agent
- **Scope**: Whole-repo restructure + tooling baseline + docs uplift
- **Package version at start**: `0.0.2` (pre-1.0 — breaking changes OK)

> Co-planning doc. This lives in `docs/agents/plan/` for brainstorming &
> human curation. Once a phase ships, the verification cycle is logged in
> `.agents/plan/cycles/Round_XX.md` (see [.agents/AGENTS.md](../../../.agents/AGENTS.md)).

---

## 1. Goals (Why)

| #   | Goal                                                | Signal of success                                                           |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| G1  | Clean, navigable `src/` layout scaling past 4 files | Each top-level concern has its own folder; `index.js` re-exports public API |
| G2  | CLI entry decoupled from implementation             | `bin/a2scaffold` is a thin launcher; CLI logic lives in `src/cli/`          |
| G3  | Consistent code style, caught in CI                 | Lint + format run on push; no style nits in review                          |
| G4  | Consistent markdown style                           | Lint + format pass on all `.md`; no MD060/MD013 noise                       |
| G5  | Guardrails before commit                            | Husky hooks run lint/format/test locally                                    |
| G6  | Discoverable docs that don't rot                    | ToC-driven; each concern has a workflow doc                                 |
| G7  | Type-safety without a build step                    | JSDoc + `tsc --noEmit` passes in CI; editor hovers show types               |

### Non-goals

- Rewriting features / changing behavior
- Adding TypeScript (consider later as a separate plan)
- Publishing 1.0 (versioning strategy is a follow-up decision)

---

## 2. Current State

```text
bin/
  cli.js                # CLI entry (400+ LOC, parses + dispatches)
src/
  index.js              # Re-exports public API
  safety.js             # Path safety helpers
  scaffold.js           # Template rendering
  skills.js             # Skill + skill-ref management (~495 LOC, growing)
  templates.js          # Template discovery
tests/*.test.js         # node:test
templates/<name>/       # Bundled templates
docs/                   # User-facing docs + agent workflows
.agents/                # Agent-operational knowledge
```

**Pain points observed:**

- `src/skills.js` conflates install / validate / ref / discovery (~495 LOC)
- `bin/cli.js` grows one function per subcommand — will compound
- No lint/format config — style drift already visible (see recent PRs)
- No pre-commit hook → tests easy to skip
- No markdown linter — hit MD060 warnings live today

---

## 3. Target State

```text
bin/
  a2scaffold            # ← thin launcher (shebang, imports src/cli)
src/
  index.js              # public API only (re-exports)
  cli/
    index.js            # arg parsing + dispatch
    commands/
      scaffold.js
      skill-add.js
      skill-list.js
      skill-validate.js
      skill-ref.js
    help.js
  scaffold/
    index.js            # scaffold()
    render.js           # handlebars rendering
    conflicts.js        # checkExistingFiles
  skills/
    index.js            # public skills API re-exports
    install.js          # installSkill + installFromLocal/GitHub
    validate.js         # validateSkill (+ ref-chain validation)
    list.js             # listSkills / discoverSkills
    ref.js              # installSkillRef + conflict rules
    parse-source.js     # parseSkillSource
  templates/
    index.js            # listTemplates / resolveTemplatePath
  utils/
    safety.js           # path safety (moved)
    download.js         # git sparse-checkout helper
    frontmatter.js      # parseFrontmatter (shared)
```

**Public API surface (unchanged)** — `src/index.js` still exports the same
names; only internals move. Consumers of the programmatic API are not
broken.

---

## 4. Tooling Baseline

| Concern    | Proposed tool                                                | Alt considered   | Rationale                                         |
| ---------- | ------------------------------------------------------------ | ---------------- | ------------------------------------------------- |
| JS format  | Prettier                                                     | dprint           | Ubiquitous, zero-config for our code              |
| JS lint    | ESLint (flat config, `eslint:recommended` + `n/recommended`) | Biome            | Flat config is stable; biome still young for node |
| MD lint    | markdownlint-cli2                                            | remark-lint      | Simpler rule set, plays with IDE                  |
| MD format  | Prettier (same config)                                       | —                | Keep one formatter                                |
| Git hooks  | Husky + lint-staged                                          | simple-git-hooks | Industry default, pnpm-friendly                   |
| Commit msg | (optional) commitlint conventional                           | —                | Defer unless we want enforced semver              |

**Scripts to add to `package.json`:**

```jsonc
{
  "scripts": {
    "lint": "eslint . && markdownlint-cli2 '**/*.md' '#node_modules' '#templates/**'",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "node --test tests/*.test.js",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test",
    "prepare": "husky",
  },
}
```

---

## 5. Phased Roadmap

Each phase is a **landable PR** — green CI, no partial states on main.

### Phase 0 — Prep (no code moves)

- Add `docs/agents/plan/` convention to [.agents/AGENTS.md](../../../.agents/AGENTS.md) & [docs/ToC.md](../../ToC.md)
- Land this plan doc
- Decide open questions (§7) before coding

### Phase 1 — Tooling baseline

- Add Prettier + ESLint flat config (format existing code in same PR — "big diff, once")
- Add markdownlint + run across docs, fix warnings
- Add Husky + **lint-staged** pre-commit — runs on **changed files only**
  (user retains accountability for what they commit)
- CI runs the **full** `pnpm check` (lint + format:check + typecheck + tests)
  as the final quality gate — pre-commit is a convenience, not a gate
- **Deliverable**: `pnpm check` passes on a clean checkout; CI enforces it

### Phase 1.5 — Type-check baseline (JSDoc + `checkJs`)

- Add `tsconfig.json` with:
  - `allowJs: true`, `checkJs: true`, `noEmit: true`
  - `strict: true`, `module: "nodenext"`, `moduleResolution: "nodenext"`
  - `target: "es2022"`, `resolveJsonModule: true`
- Add dev dep: `typescript` (latest)
- Add `pnpm typecheck` script (`tsc --noEmit`); wire into `pnpm check` and CI
- Resolve whatever `tsc` flags on the existing code — likely a handful of
  implicit-any fixes in [src/skills.js](../../../src/skills.js)
- **Do not** mass-annotate. Only fix what blocks the green run
- Document the rule: **new code / touched code must add JSDoc** for exported
  functions (`@param`, `@returns`, `@throws`)
- **Deliverable**: `pnpm typecheck` green in CI; IDE hovers show inferred types

### Phase 2 — `bin/a2scaffold` rename

- Add `bin/a2scaffold` with shebang, importing from new `src/cli/` (stub)
- **Delete** `bin/cli.js` (no alias, no grace period — pre-1.0, no downstream depends on that path)
- Update `package.json#bin` entry
- Update all docs + README
- **Deliverable**: `npx a2scaffold` works via the new binary name

### Phase 3 — Split `src/cli/`

- Extract each subcommand to its own file under `src/cli/commands/`
- `src/cli/index.js` = arg parse + dispatch only
- No behavior change; tests still pass unchanged
- **Deliverable**: `bin/a2scaffold` imports `src/cli/index.js` directly; no inline logic in `bin/`

### Phase 4 — Split `src/skills/`

- Split `src/skills.js` along the boundaries listed in §3
- `src/skills/index.js` re-exports what `src/index.js` needs
- Shared `parseFrontmatter` → `src/utils/frontmatter.js`
- **Annotate JSDoc** for every moved function (`@param`, `@returns`, `@throws`)
- **Deliverable**: identical public API; internal files ≤ ~150 LOC each; typecheck green

### Phase 5 — Split `src/scaffold/` + `src/templates/` + `src/utils/`

- Same pattern: split by concern, re-export from folder `index.js`
- Move `safety.js` → `src/utils/safety.js`
- Extract GitHub clone helper → `src/utils/download.js`
- **Annotate JSDoc** as files move (same rule as Phase 4)
- **Deliverable**: final target layout achieved; typecheck green

### Phase 6 — Docs uplift

- Workflow docs for every command (already have: scaffold, skill)
- Add `docs/agents/workflows/template.workflow.md`, `ref.workflow.md` if split warrants
- Refresh [docs/api.md](../../api.md) to match new import paths (if any surfaced)
- **Deliverable**: ToC matches reality; no dead links

### Phase 7 — Ref-chain validator (the pending feature)

- Implement skill-ref chain validation in `src/skills/validate.js`
  (cycle detection, max depth, terminal must be raw + valid)
- Noted in [skill.workflow.md](../workflows/skill.workflow.md) as "planned"
- **Deliverable**: `a2scaffold skill validate` catches broken refs

---

## 6. Risks & Mitigations

| Risk                                          | Mitigation                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Import path churn breaks downstream consumers | Keep `src/index.js` export stable; any removal is breaking — user decides the version bump |
| "Big diff" format PR obscures real changes    | Land format-only commit **separately** inside Phase 1; review via "hide whitespace"        |
| Husky slows down commits                      | `lint-staged` touches only changed files; no pre-push full-suite hook — CI is the gate     |
| Tests depend on file layout                   | Audit `tests/*.test.js` early for hardcoded paths; fix in the same phase as the move       |
| Multi-phase refactor drags on                 | Every phase must be independently landable; no "WIP" merges to main                        |

---

## 7. Decisions (resolved 2026-04-18)

| #   | Decision                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | **Drop** `bin/cli.js` immediately in Phase 2 (no alias, no grace period)                                                           |
| Q2  | **Prettier** for JS + Markdown formatting                                                                                          |
| Q3  | ESLint flat config with `eslint:recommended` + `n/recommended` only. Skip `eslint-plugin-unicorn` unless repeated review nits show |
| Q4  | **Shift-left**: `lint-staged` pre-commit on changed files only (user accountability). **CI runs the full quality gate**            |
| Q5  | Follow SemVer. Version bumps are a **per-release human decision** — the plan will not pre-assign bumps per phase                   |
| Q6  | **Adopt JSDoc + `tsconfig.json` now** (Phase 1.5): `allowJs`, `checkJs`, `noEmit`, `strict`. No build step. Gradual annotation     |

---

## 8. Verification (per phase)

Each phase, after landing:

1. Create a cycle file: `.agents/plan/cycles/Round_XX.md`
2. Record: goal, diff summary, tests run, issues found, follow-ups
3. If a finding contradicts this plan → update plan (mark delta) before next phase

---

## 9. Change log for this plan

| Date       | Change                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| 2026-04-18 | Initial draft                                                                   |
| 2026-04-18 | Resolved Q1–Q6 (§7). Phase 2: drop `bin/cli.js`. Pre-commit shift-left; CI gate |
| 2026-04-18 | Flipped Q6 → adopt JSDoc + `checkJs` now. Added Phase 1.5. New goal G7          |
