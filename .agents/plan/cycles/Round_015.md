# Round 015: Split the stub axis from the harness axis, for v0.3.0

**Status**: In Progress
**Part of**: standalone — feature work, not a
[CoSF pilot](../programs/cosf-pilot.md) phase. It fits in one round, and
`programs/README.md` reserves programs for work that does not.
**Date started**: 2026-09-23
**Date completed**: —

## Goal

`AGENTS.md` is converging into the file every harness reads, so a root
instruction file per harness is becoming optional. A harness **directory**
is not: `.claude/`, `.gemini/` and `.codex/` carry permission rules, native
config and skill refs, and none of that depends on whether a `.md` stub
exists next to it.

Today one group of flags decides both. Split them, so a repo can say "no
`GEMINI.md`, but keep `.gemini/`" — the shape the converged layout needs.

Public behaviour and a values-key rename, so the target is **v0.3.0**, after
Round 014 ships v0.2.1.

## What the flags actually mean today

Verified 2026-09-23 by scaffolding a scratch repo per combination.

| Flag               | Writes a `.md`                     | Writes a directory                     |
| ------------------ | ---------------------------------- | -------------------------------------- |
| `agents.agentsmd`  | `AGENTS.md`                        | —                                      |
| `agents.claude`    | `CLAUDE.md`                        | — (`.claude/` is `guardrails.claude`)  |
| `agents.copilot`   | `.github/copilot-instructions.md`  | `.github/`, only as a side effect      |
| `agents.gemini`    | `GEMINI.md`                        | **`.gemini/`** — the two are bundled   |
| `agents.codex`     | **nothing**                        | `.codex/`                              |
| `guardrails.claude`| —                                  | `.claude/settings.json`                |

Five flags under one prefix meaning four different things. Two consequences
worth naming:

- **`agents.codex` is already the split we want**, under a name that says
  otherwise. It has never written an instruction file; Codex reads root
  `AGENTS.md`. It is proof the second axis exists, not a special case.
- **`guardrails.claude` is already on the second axis**, correctly
  independent of `agents.claude` — and already documented as such. It is the
  pattern to generalise, not a one-off.

`.codex/.gitkeep` and `.gemini/.gitkeep` are zero-byte placeholders whose
only job is to give `skill ref --to <dir>` somewhere to land. `skill ref`
itself takes an arbitrary `--to` and hardcodes no harness, so the directories
are convention, not mechanism.

`.agents/` is **not** on either axis. It is the knowledge base, always
generated, and Claude Code excludes anything under it from instruction-file
discovery by name — so the heart cannot collide with the root stub.

## The two axes

1. **Instruction file** — which root `.md` stubs to write. `agents.*`.
2. **Harness surface** — which harness directory to create and which native
   config file to put in it. `guardrails.claude` is today's only member.

## Harness support, verified 2026-09-23

Against [Claude Code memory docs](https://code.claude.com/docs/en/memory),
[Gemini CLI context files](https://geminicli.com/docs/cli/gemini-md/),
[Copilot coding agent changelog](https://github.blog/changelog/2025-08-28-copilot-coding-agent-now-supports-agents-md-custom-instructions/),
[VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions).

| Harness     | Reads root `AGENTS.md`                                    | What it takes                                     |
| ----------- | --------------------------------------------------------- | ------------------------------------------------- |
| Claude Code | ✅ v2.1.277+, by default, when no `CLAUDE.md` is in scope   | nothing — the stub's *absence* is the switch      |
| Codex       | ✅ native                                                   | nothing                                           |
| Gemini CLI  | ⚠️ opt-in                                                  | `context.fileName` in `.gemini/settings.json`     |
| Copilot     | ⚠️ opt-in in VS Code; native for the coding agent           | `chat.useAgentsMdFile`, user/workspace settings   |

Three facts decide the design:

1. **`.agents/` is excluded by name.** Claude Code does not auto-read
   anything under a `.agents/` directory, so `@.agents/AGENTS.md` stays the
   only path in and the existing architecture survives unchanged.
2. **a2scaffold cannot configure Claude's side.** The option lives at
   `pluginConfigs["agents-md@builtin"].options.instructionFiles`, and Claude
   Code ignores it in **project and local** settings files. For Claude,
   convergence is achievable only by not writing `CLAUDE.md`.
3. **`AGENTS.md` support is not always available.** Off for sessions that
   cannot fetch feature flags (Bedrock, Vertex, other third-party providers,
   telemetry disabled), off for the first session after an install or
   upgrade, off if the `agents-md` plugin is disabled, and off for any
   developer keeping their own `CLAUDE.local.md`.

Fact 3 is why no `agents.*` default flips this round. Converged is a choice a
repo makes knowing its harness fleet. Revisit when the caveat list shrinks.

## Plan

Each step independently landable, each green.

- [x] **Write the finding to `memory/`.** The tables above contradict
      `context/harness-behaviour.md` ("Claude Code reads `CLAUDE.md` and not
      `AGENTS.md`") and the mapping in `reference/root-files.md`. Per the
      authority rules an agent writes the finding, never the canon:
      `memory/2026-09-23-agentsmd-convergence.md`, carrying a promotion
      proposal. Docs only, no code.
- [ ] **Human promotes it into canon.** `context/harness-behaviour.md` gains
      an `AGENTS.md`-support section and a new **Last verified** date; its
      "Each harness reads a different file" section and the
      `reference/root-files.md` table are corrected. Logged in
      `plan/promotions.md`. The round records this step; it does not perform
      it.
- [ ] **Introduce the `harness.*` group.** Axis 2, one member per harness,
      each meaning "create the directory and write its native project
      config". Proposed members and what each emits:
      - `harness.claude` → `.claude/settings.json`, the `ask` permission
        rules. **Supersedes `guardrails.claude`.**
      - `harness.gemini` → `.gemini/`, plus `settings.json` carrying
        `{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}`. The one
        harness whose opt-in a2scaffold can write, because `context.fileName`
        is project-level.
      - `harness.codex` → `.codex/`. Takes over what `agents.codex` does now.
      - `harness.copilot` → nothing yet; see Non-goals. Omit the key rather
        than ship one that does nothing.

      Constraints:
      - **The rename is breaking, and lands in one release — no alias, no
        deprecation window.** `guardrails.claude` and `agents.codex` move and
        the old names stop working, failing loudly and naming the replacement.
        The reasoning, the rejected alternatives and the condition that
        reopens it are in
        [decisions/2026-09-24-no-deprecation-window-pre-1.0.md](../../decisions/2026-09-24-no-deprecation-window-pre-1.0.md);
        this round executes it and does not restate it. Migration is one
        "Upgrading from 0.2.x" section next to the existing 0.1.x one.
      - **`$if{}` errors on a variable absent from the view**, so every new
        key must land in `templates/scaffold/base/values.yaml` in the same
        commit as the template path that reads it.
      - **Defaults**: `harness.claude` inherits `guardrails.claude: true`.
        `harness.gemini` and `harness.codex` inherit today's `false`. No
        default changes shape this round.
- [ ] **Never overwrite a harness config file.** A repo's
      `.gemini/settings.json` may already hold `mcpServers` or a theme, the
      same hazard `.claude/settings.json` already has. Extend the
      `ENFORCEMENT_FILES` treatment — report staleness, never overwrite — and
      widen that constant's doc comment, which currently says "enforcement"
      and no longer covers the set.
- [ ] **Correct the stub blurbs.** `AGENTS.md.hbs` lists eight tools and
      omits Claude Code; `CLAUDE.md.hbs` opens with "Claude Code reads this
      file, not `AGENTS.md`", now false. Reword both, and say in `CLAUDE.md`
      why it still exists (fact 3), so nobody deletes it as dead weight.
- [ ] **Pin the converged layout with a test.** It works today and nothing
      keeps it working. Assert that `agents.claude: false` +
      `agents.agentsmd: true` + `harness.claude: true` yields no `CLAUDE.md`,
      a root `AGENTS.md` carrying `@.agents/AGENTS.md`, and
      `.claude/settings.json` with the `ask` rules intact. Add the mirror
      case for Gemini: no `GEMINI.md`, `.gemini/settings.json` present.
- [ ] **Document both axes.** `docs/usage.md` and a pointer in `README.md`:
      the two-axis model, the values file that produces the converged layout,
      the per-harness support table, and the caveat list in full. A reader
      has to be able to decide whether their fleet can take it.
- [ ] **Bump to 0.3.0**, only after v0.2.1 is tagged.

## Non-goals

- Flipping any `agents.*` default. See fact 3.
- `.vscode/settings.json` for Copilot's `chat.useAgentsMdFile`. a2scaffold
  could write the workspace variant, but `.vscode/` is editor territory this
  tool has never entered, and the per-user variant stays uncovered either
  way. Documented, not generated — revisit if it recurs.
- Anything from Round 013's adversarial-review backlog or Round 014's fixes.
  Separate rounds, separate releases.

## Do

**2026-09-24 — step 1 landed.**
[memory/2026-09-23-agentsmd-convergence.md](../../memory/2026-09-23-agentsmd-convergence.md)
carries the finding, the per-harness table, the three facts that decide the
design, and a promotion proposal naming the four edits canon needs. Dated
2026-09-23 after the day the facts were verified, not the day it was written.

Step 2 is now the only thing blocking canon, and it is a human's.

**Deviation — the round did not open the planning surface.** `plan.programs`
and `plan.decisions` were switched on the same day, and
[programs/cosf-pilot.md](../programs/cosf-pilot.md) and
[decisions/2026-09-24-no-deprecation-window-pre-1.0.md](../../decisions/2026-09-24-no-deprecation-window-pre-1.0.md)
were written. **Neither is part of this round.** They are recorded here only
because the decision doc is what this round's step 3 executes, and a reader
of the diff would otherwise wonder why those files appeared alongside it.

**Side finding, split out rather than absorbed.** The first `sync` after
enabling those two surfaces wrote four files, and `pnpm check` then failed
`format:check` on three of them — the tool wrote files into its own
repository that its own gate rejects. Cause and blast radius are in
[memory/2026-09-24-hbs-templates-render-prettier-dirty.md](../../memory/2026-09-24-hbs-templates-render-prettier-dirty.md):
`.prettierignore` hides `templates/**/*.hbs` from prettier while the rendered
output lands where prettier does look, and 7 of the markdown templates fail.

Only the 3 that this change made appear were fixed, because they blocked
green. The other 4 are pre-existing and untouched — they belong to a round of
their own, and the memory proposes the scope. Fixing them here would have
been exactly the scope creep this round's Non-goals section forbids.

## Check

- [ ] `pnpm check` green at each commit
- [ ] Converged scaffold in a scratch repo: no `CLAUDE.md`, no `GEMINI.md`,
      root `AGENTS.md` present, `.claude/settings.json` and
      `.gemini/settings.json` present
- [ ] A live Claude Code session in that scratch repo reports
      `no CLAUDE.md found; AGENTS.md loaded: …` — verified by watching it,
      not inferred from docs
- [ ] `.agents/AGENTS.md` is **not** loaded as a second instruction file in
      that session, only through the `@` import
- [ ] A live Gemini CLI session in the same repo loads root `AGENTS.md`
- [ ] `skill ref --to .gemini` still works with no `GEMINI.md` present
- [ ] A repo with a hand-written `.gemini/settings.json` gets a report, not
      an overwrite
- [ ] A 0.2.x values file using `guardrails.claude` or `agents.codex` fails
      loudly, naming the new key — a silently ignored key is the one outcome
      worse than breaking
- [ ] This repo's own `.a2scaffold/values.yaml` migrated, and `sync` on it is
      a no-op afterwards
- [ ] `/review-pr main` on the release branch before the `dev` PR, as in
      Round 014 — the release is challenged before it ships, not after
- [ ] Re-running `sync` on a converged repo is a no-op
- [ ] Record explicitly what could not be verified — the Bedrock/Vertex and
      telemetry-disabled paths are claims from docs, not observations

## Act

**Learnings**:

- ...

**Promotions**:

- [ ] → `context/harness-behaviour.md` : `AGENTS.md` support per harness, the
      `.agents/` exclusion, and why the Claude-side option cannot be written
      from project settings
- [ ] → `reference/root-files.md` : the stub table, once the above lands
- [ ] → `memory/` **only** : the two-axis model. It is the reason the flags
      get renamed, but it has been observed once, today, from reading a
      values file — never used. Philosophy #6 puts it in `memory/` until a
      second harness has actually been added along it. Do not promote it to
      `context/` this round.
