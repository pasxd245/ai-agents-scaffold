# Root instruction files

> **Read this when**: editing `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`,
> `.github/copilot-instructions.md`, or changing how the harness stubs are
> generated.

---

**This file is the heart.** Every root file is a stub that points here; the
project knowledge lives in `.agents/` exactly once. Each harness reads a
different name, and only some expand inline imports:

| Stub                              | Harness                                                | Points here by                          |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `CLAUDE.md`                       | Claude Code                                            | `@.agents/AGENTS.md`, expanded inline   |
| `GEMINI.md`                       | Gemini CLI                                             | `@.agents/AGENTS.md`, expanded inline   |
| `AGENTS.md`                       | Codex, Cursor, Jules, Devin, Amp, Zed, Windsurf, Aider | the same line, read as a path reference |
| `.github/copilot-instructions.md` | GitHub Copilot                                         | restated content — it cannot import     |

The stubs are peers. None of them imports another, so no harness depends on a
file meant for a different one, and every stub reaches this file in one hop.

## Rules

- ❌ Do NOT write project knowledge into a stub. If it matters to more than
  one harness, it belongs in `.agents/`.
- ✅ Harness-specific quirks — and only those — go in that stub's
  `## Your instructions here` slot.
- ⚖️ **Keep each stub under 200 lines.** Imports load at launch and count in
  full against the context window; longer instruction files measurably reduce
  adherence. Anything longer belongs in `.agents/context/` or a skill.
- 🔁 The stubs are generated from one shared template. When the common wording
  changes, re-scaffold rather than editing the same paragraph four times.
- ✏️ Generated content is fenced by `<!-- a2scaffold:start -->` /
  `<!-- a2scaffold:end -->`. Write your own sections **outside** the fence —
  a re-scaffold replaces the inside and preserves the outside.
