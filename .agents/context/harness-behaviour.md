# Harness behaviour

> Canonical, and **dated**. How the agent harnesses actually load and enforce
> things — the facts the rest of `.agents/` is designed around.
>
> Everything here is someone else's product behaviour and will change without
> telling you. Each entry carries the date it was last verified. Past that,
> treat it as unverified rather than wrong, and re-read the source.

**Last verified**: 2026-08-29

---

## Why this file exists

Three assumptions were held about harness behaviour that turned out to be
false, and each one had already shaped a design decision before anyone
checked. Guessing here is expensive: the whole scaffold is built on how these
tools load files.

The rule: **a claim about harness behaviour needs a source and a date, or it
does not go in.**

---

## Instruction files are context, not configuration

An instruction file is text the model reads. It is not enforced. An agent can
read "READ ONLY" in a table and write to the file anyway, and nothing stops
it.

Anything that must hold regardless of what the model decides has to be a
permission rule or a hook.

Source: Claude Code memory docs. Verified 2026-08-29.

---

## Loading costs what it costs

- Instruction files are loaded at session start and count in full against the
  context window.
- `@path` imports **do not reduce** that: an imported file is expanded and
  loaded at launch, same as if it were inline. Imports organise; they do not
  save.
- Longer instruction files measurably reduce adherence. Target **under 200
  lines** per file.
- Import depth is capped at **4 hops**. Imports inside code spans and fenced
  blocks are not expanded.
- Block-level HTML comments are stripped before the file is injected, so a
  comment block costs nothing at read time.

Source: Claude Code memory docs. Verified 2026-08-29.

---

## Permission rules

- File-path rules are consulted for **`Edit(...)`** only. A `Write(...)` path
  rule is accepted and then never used — it silently does nothing.
- Precedence runs deny → ask → PreToolUse hooks → allow → mode.
- `deny` cannot be overridden in-session. `ask` can, which makes `ask` the
  right verb for a rule a human is meant to be able to authorise past.
- Paths anchored with a leading `/` resolve from the project root.

Source: Claude Code permissions docs. Verified 2026-08-29.

---

## Skills load in tiers

- Name and description at startup; the body only when the skill is triggered;
  `references/` and `scripts/` only when the body calls for them.
- `description` plus `when_to_use` is truncated at **1,536 characters** in the
  listing, so the trigger has to come first.
- Keep the body under roughly **5,000 tokens**; put the rest in `references/`.
- A skill runs with the **full permissions of the agent that loads it**.

Source: Claude Code skills docs; agentskills.io spec. Verified 2026-08-29.

---

## Each harness reads a different file

`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md` — and
only some expand `@` imports. `AGENTS.md` is the cross-tool convention;
Claude Code reads `CLAUDE.md` and not `AGENTS.md`.

See [reference/root-files.md](../reference/root-files.md) for the current
mapping.

Source: agents.md; Claude Code memory docs. Verified 2026-08-29.

---

## Re-verifying

Re-read the sources when any of these happen, and update the date:

- A harness ships a release that touches memory, permissions, or skills
- A harness gains or drops native `AGENTS.md` support
- Something here contradicts what you just watched the tool do — that last one
  outranks this file

When a fact changes, check what in `.agents/` was built on it. These are not
trivia; the directory layout, the line budgets and the permission rules are
all downstream of this page.
