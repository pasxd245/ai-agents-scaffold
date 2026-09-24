# Claude Code reads root AGENTS.md — canon says it does not

**Date**: 2026-09-23
**Agent**: Claude Code (Opus 5)
**Confidence**: High
**Status**: New
**Source**: Round 015 planning — a user report that Claude Code had gained
`AGENTS.md` support, verified against vendor docs and by scaffolding
scratch repos
**Review-by**: 2026-12-23 — this is another vendor's product behaviour and
the caveat list below is the part most likely to move

## Problem

[context/harness-behaviour.md](../context/harness-behaviour.md) states, under
"Each harness reads a different file": _"Claude Code reads `CLAUDE.md` and not
`AGENTS.md`."_ The same file's "Re-verifying" section names the trigger that
just fired — _"A harness gains or drops native `AGENTS.md` support"_.

`reference/root-files.md` carries the same mapping in its stub table, and the
generated `AGENTS.md` stub lists eight tools that read it without Claude Code
among them.

## Finding

Claude Code v2.1.277+ reads root `AGENTS.md` **by default**, with no setting,
whenever there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in
the working directory or above it. Three details decide what this repo can do
with that:

1. **`.agents/` is excluded by name.** Claude Code does not auto-read anything
   under a `.agents/` directory. The heart cannot collide with the root stub,
   and `@.agents/AGENTS.md` remains the only path in. The architecture is
   unaffected.
2. **a2scaffold cannot configure the Claude side.** The control lives at
   `pluginConfigs["agents-md@builtin"].options.instructionFiles`, and Claude
   Code **ignores it in project and local settings files**. A generated
   `.claude/settings.json` has no way to opt a repo in. The only lever the
   tool has is not writing `CLAUDE.md`.
3. **Support is not universal.** It is off for sessions that cannot fetch
   feature flags (Bedrock, Vertex, other third-party providers, telemetry
   disabled), off for the first session after an install or upgrade, off if
   the built-in `agents-md` plugin is disabled, and off for any developer who
   keeps a `CLAUDE.local.md` of their own.

Per-harness, as of this date:

| Harness     | Root `AGENTS.md`                              | What it takes                                   |
| ----------- | --------------------------------------------- | ----------------------------------------------- |
| Claude Code | ✅ v2.1.277+, default when no `CLAUDE.md`     | nothing — the stub's absence is the switch      |
| Codex       | ✅ native                                     | nothing                                         |
| Gemini CLI  | ⚠️ opt-in                                     | `context.fileName` in `.gemini/settings.json`   |
| Copilot     | ⚠️ opt-in in VS Code; native for coding agent | `chat.useAgentsMdFile`, user/workspace settings |

## Evidence

- [Claude Code memory docs](https://code.claude.com/docs/en/memory) —
  the default table, the `.agents/` exclusion, the `pluginConfigs` location
  and the "When AGENTS.md support is unavailable" list
- [Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md/)
- [Copilot coding agent changelog](https://github.blog/changelog/2025-08-28-copilot-coding-agent-now-supports-agents-md-custom-instructions/),
  [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- Scratch repo, `agents.claude: false` + `agents.agentsmd: true` +
  `guardrails.claude: true` → no `CLAUDE.md`, root `AGENTS.md` carrying
  `@.agents/AGENTS.md`, `.claude/settings.json` present. The converged layout
  already renders on v0.2.0; nothing in the tool needed changing to reach it
- Scratch repo, `agents.codex: true` → `.codex/.gitkeep`, zero bytes, and no
  instruction file at all. `agents.gemini: true` → `GEMINI.md` **and**
  `.gemini/`, the two bundled
- Files: `.agents/context/harness-behaviour.md`,
  `.agents/reference/root-files.md`,
  `templates/scaffold/base/template/$if{agents.agentsmd}/AGENTS.md.hbs`,
  `templates/scaffold/base/template/$if{agents.claude}/CLAUDE.md.hbs`

## Recommendation

**Do**: treat the root instruction file and the harness directory as two
independent choices. `.claude/`, `.gemini/` and `.codex/` carry permission
rules, native config and skill refs whether or not a `.md` stub sits beside
them — `guardrails.claude` already works this way and is the pattern to
generalise.

**Don't**: drop `CLAUDE.md` from the defaults. Finding 3 means a converged
repo silently loses its instructions for a whole class of sessions. Converged
is a choice a repo makes knowing its harness fleet, not a new default.

## Promotion candidate?

- [x] `context/` — `context/harness-behaviour.md` is where harness facts live
      by design, and it is currently wrong. Needs a human: canon is not an
      agent's to edit. Specifically: - correct "Each harness reads a different file" - add an `AGENTS.md`-support section carrying findings 1–3 - move **Last verified** to 2026-09-23 - correct the stub table in `reference/root-files.md`
- [ ] `skills/` — nothing reusable here
- [ ] Not yet

The two-axis model that follows from this finding is **not** a promotion
candidate. It has been observed once, from reading a values file, and never
used. Philosophy #6 keeps it here until a second harness has been added along
it. Round 015 records the same constraint.
