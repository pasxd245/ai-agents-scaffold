# `a2scaffold` — Ecosystem Ideas (Draft)

- **Status**: Draft — idea inventory, not commitments
- **Owner**: Vien Pham (personal tool; share if useful)

> **Read this first.** `a2scaffold` is a personal tool right now. It may
> grow into something others use, but no horizons, vision statements, or
> 1.0 promises bind us. This file collects ideas that _might_ matter.
> An idea earns a real plan doc only when daily use proves the need —
> not before.

---

## Current hypothesis (one sentence, replaceable)

> A single CLI that scaffolds `.agents/` governance + composable skills
> into any repo is more useful than copy-pasting `AGENTS.md` snippets,
> at least for me.

Falsifiable by: a month of personal use. If I never run `skill add` after
the initial scaffold, the skill-as-installable-unit thesis is wrong and
this becomes "just a template generator."

---

## v0.1.0 cut

1. Resolve template directory structure (see §1)
2. Finish `skill-ref`
3. `.a2scaffoldrc.json` with **local-first** skill resolution + named
   trusted repos as opt-in fallback (see §2)
4. Tag `v0.1.0`. Dogfood for a month. Let pain dictate v0.2.0.

Everything below v0.1.0 is parking lot.

---

## 1. Template directory structure

```text
templates/scaffold/base/                       # default for `gen`
templates/scaffold/shared/research-setup/      # invoked as: --use shared/research-setup
templates/skill-ref/                           # single template (template/ + values.yaml directly here)
templates/skills/<name>/                       # local install pool — `skill add <name>` resolves here
```

Canonical layout (locked):

- `scaffold/` — **type** containing scaffold-generator templates for
  the `gen` command. Multiple entries (default: `base`). Names may be
  nested paths.
- `skill-ref/` — **single template** (not a type). One special-purpose
  template; lives flat. Promote to a type only if a second skill-ref
  variant ever appears.
- `skills/` — **pool** containing locally-installable skills. Target
  of `skill add <name>`.

Notes:

- Sub-dir template names are first-class for `scaffold/` and `skills/`.
  `--use shared/research-setup` resolves to
  `templates/scaffold/shared/research-setup/`. No grouping schema, no
  manifest required — paths _are_ the grouping.
- For skills, install destination mirrors source path:
  `skill add planning/master-plan` →
  `.agents/skills/planning/master-plan/`. Bare names still work
  (`skill add foo` → `templates/skills/foo/`).
- Type-paths are **not** configurable in rc. Canonical paths only;
  revisit if a real need surfaces.
- If `--use` points at a directory that isn't itself a template (no
  marker file), error clearly with a list of available children.

## 2. `.a2scaffoldrc.json` — local-first, explicit registries

```jsonc
{
  "registries": {
    "main": { "url": "github:pasxd245/a2scaffold-skills", "path": "skills/" },
    "private": { "url": "github:org/private-skills", "ref": "v1" },
  },
}
```

Resolution rules:

- `skill add foo` → **local pool (`templates/skills/`) only**. Fail
  fast with a hint listing available registries if not found.
- `skill add foo --from main` → that registry only.
- **No auto-fallback to a default registry.** Explicit `--from` required
  for any network resolution. Revisit if friction proves real.
- Never auto-search across all registries.
- `~/.a2scaffoldrc.json` (user-global) merges shallowly with project rc.

Example failure:

```text
$ a2scaffold skill add foo
✗ skill 'foo' not found locally.
  Try: a2scaffold skill add foo --from main
  Or list registries: a2scaffold registry list
```

Deferred:

- `defaultRegistry` auto-fallback (rejected for v0.1.0 — re-evaluate if
  daily use shows the explicit `--from` is friction)
- signing, lockfile, version pinning beyond `ref:`, search indexing
- merging js-tmpl config into rc — js-tmpl already auto-discovers its
  own `js-tmpl.config.*`; keep concerns separated
- rc-level `jsTmpl.values` config — pass values via CLI flags
  (`--values-file`, `--values-dir`) per invocation; promote to rc only
  if the same flags get repeated across runs

---

## 3. Idea parking lot (no priority, no commitment)

> Promotion rule: an item moves to a real plan doc only after personal
> use has surfaced the pain it solves.

### CLI surface

- `init` as explicit alias for the default invocation
- `diff <template>` — preview what would change
- `doctor` — diagnose `.agents/` drift
- `upgrade` — re-apply template, three-way merge (only after `diff`/`doctor` semantics are stable)
- `migrate` — move legacy AGENTS.md layouts forward
- `memory lint` — flag stale memories
- `preview` — render template+values to stdout
- `--json` output for scripting
- Stable, documented exit codes

### Composable templates

- Layered: `--use base,node,ts`
- Conditional files via extended `$if{...}` gates
- Template manifest (`template.yaml`) — keep minimal, version it (`schema: 1`)
- Snippet library for reusable fragments

### Skills

- Skill registry index (only after multiple registries are in real use)
- Skill versioning (git tag or content-hash)
- Skill packs / bundles
- Dependency graph + `skill graph --dot`
- Quality bar enforced by `validate` (description, Trigger, Procedure)
- Provenance / signing — far future

### Multi-harness emitters

- Source of truth: `.agents/` → per-harness emitters write derived files
- Realistic first set if pursued: Claude Code, Copilot, Cursor (structurally diverse)
- Aider/Cline/Continue/Codex/Gemini/Windsurf/Roo/Zed AI as plugins, not core
- `sync` re-emits when `.agents/` changes
- **Open**: do we even need this? Personal use will tell.

### Plugin seam

- Convention: `a2scaffold-plugin-<name>` npm packages
- Plugin shape: `{ templates?, skills?, commands?, emitters? }`
- Defer until something we want to ship doesn't fit in core

### IDE / editor

- MCP server exposing scaffold/skill ops
- VS Code extension (tree view + installer)
- LSP for AGENTS.md / SKILL.md
- Published JSON Schemas (cheap; could land early if validation matters)

### Web presence

- Static site (Astro / VitePress) — only if there's content to host
- Template gallery, skill index, recipes
- Fully deferred until contributors exist

### Self-scaffolding

- `init --self`: agent reads repo, proposes scaffold
- Bespoke `context/*.md` drafted from real code
- Scheduled `self-update` PRs as the codebase evolves
- Memory promotion automation
- **Status**: interesting; not load-bearing for v0.1.0.

### Governance & contributors

- RFC process — only when external contributors arrive
- Semver promise — only after public surface stabilizes
- Deprecation policy — only after first breaking change is real

### Distribution

- npm (today)
- Homebrew, Scoop, deb/rpm, asdf/mise, Docker, GitHub Action — all defer

### Telemetry

- Stay off until there's something to measure with referents (e.g. registry installs)
- Manual signals (issues, stars, "did _I_ keep using it") for v0.1.0
- If ever built: opt-in, no paths, no content, salted daily ID, public dashboard

### Quality / DX

- Golden snapshot tests per template (cheap; pursue when adding templates feels risky)
- Cold-start performance budget (only when slow)
- Copy-pasteable error messages

### Internationalization

- AGENTS.md in `vi`, `ja`, `zh-cn` — far future, only if non-English users arrive

---

## 4. Discarded (kept for honesty)

- Hosted SaaS scaffold-as-a-service — ops burden, no value over CLI
- Paid tier — premature
- Custom DSL for templates — Handlebars + `if` is enough
- Rewriting the templating engine
- Agent-vs-agent benchmarking — out of scope
- "Earn 1.0 by horizon end" — cut 1.0 when the API stops moving, not on a schedule
- Locked vision/mission statements — re-derive yearly from actual usage

---

## 5. How to use this file

- Add an idea: drop it under §3 with one sentence. No phase, no horizon.
- Promote an idea: open a `YYYYMMDD-<topic>.plan.md` and link back here.
- Kill an idea: move it to §4 with a one-line reason.
- Re-read quarterly. If §3 hasn't shrunk, we're not shipping.

---

## 6. Change log

| Date       | Change                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-07 | Initial draft.                                                                                                                 |
| 2026-05-07 | Lock §1 type set (`scaffold`/`skill-ref`/`skills`) + sub-dir template names. Lock §2 no-auto-fallback. Defer js-tmpl rc merge. |
