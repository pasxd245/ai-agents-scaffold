---
name: Compact a target
description: Condense any specified context (files, directories, logs, transcripts, code regions, docs) into a shorter, deduplicated form while preserving load-bearing facts. Asks clarifying questions and proposes chunking for large inputs.
argument-hint: What to compact (free-form — a path, an alias, or a description like "this PR's review notes")
agent: agent
---

# Prompt: Compact a Target

> Use this prompt to compress **any** body of context — files, directories,
> logs, transcripts, chat history, design docs, code regions, or external
> references — into a leaner form without losing decisions, rationale, or
> links future readers will need.

The skill is **target-agnostic**. `.agents/` is one common case, not the
only one.

---

## 1. Resolve the target

The user's argument describes **what** to compact. It may be:

- A path (file or directory), absolute or repo-relative.
- An alias (see table below).
- A free-form description (e.g. "the review notes on PR #42",
  "today's debug log", "the long comment block in `foo.ts`").
- Empty.

**If no argument was provided** — stop and ask:

> What would you like me to compact? Some examples:
>
> - a path: `src/lib/parser.ts`, `docs/`, `.agents/plan/cycles/`
> - an alias: `pdca`, `memory`, `context`, `plan`, `prompts`
> - a description: "the changelog since v1.2", "this conversation",
>   "the TODO comments in `web/`"

Wait for a reply. Do not guess.

**If the argument is ambiguous** (matches multiple plausible targets), list
the candidates and ask the user to pick one.

**If the argument is a description rather than a path**, restate your
interpretation and the concrete files/regions you plan to read, then
confirm before proceeding.

### Convenience aliases

| Argument                        | Resolves to                           |
| ------------------------------- | ------------------------------------- |
| `pdca`, `pdca cycles`, `cycles` | `.agents/plan/cycles/`                |
| `memory`, `.agents/memory`      | `.agents/memory/`                     |
| `plan`                          | `.agents/plan/` (excluding `cycles/`) |
| `context`                       | `.agents/context/`                    |
| `prompts`                       | `.agents/prompts/`                    |
| any path under repo root        | that exact file or directory          |

Aliases are shortcuts — anything else falls through to "treat as path or
description and ask if unsure."

---

## 2. Ask the questions you actually need

Before reading deeply, ask only the questions whose answers will change
your output. Skip ones you can infer. Common ones:

- **Goal of compaction?** (readability, token budget, archival, hand-off
  to a new agent, prep for review, etc.) — affects what counts as
  "load-bearing".
- **Audience?** (future you, another agent, a human reviewer, a stranger)
  — affects how much context to inline vs. link.
- **In-place edit, propose-only, or write to a new file?** Default:
  follow the authority rules in section 6. Use in-place edits only for
  targets the agent is explicitly allowed to modify.
- **Anything that must NOT be dropped?** (specific dates, names,
  decisions, links).
- **Target size or ratio?** (e.g. "halve it", "fit under 200 lines",
  "one page"). If not given, aim for the smallest size that still
  preserves load-bearing facts.

Ask these in one batch. Do not ask things the argument already answered.

---

## 3. Size the job; propose chunking if large

After resolving the target, estimate scope:

- Count files and approximate total lines/bytes (`wc -l`, `du -sh`,
  `find … | wc -l`).
- Sample a few files to gauge density.

**Thresholds (rules of thumb, not laws):**

- Small: ≤ ~5 files **or** ≤ ~1k lines → compact in one pass.
- Medium: ≤ ~20 files **or** ≤ ~5k lines → compact in one pass but show
  the diff in sections.
- Large: more than that, or content that won't fit comfortably in a
  single review → **stop and propose a chunking plan**.

For large inputs, propose a chunking strategy and ask the user to pick:

- **By directory / subtree** — natural for codebases and `.agents/plan/`.
- **By time window** — natural for logs, cycles, memory, transcripts
  (e.g. one chunk per month, per round).
- **By topic / heading** — natural for long single documents.
- **By file** — simplest fallback.

Also ask whether to:

- Compact each chunk independently, then stitch a top-level index, **or**
- Compact chunk-by-chunk with the user reviewing between chunks.

Default: independent chunks + top-level index, unless the user prefers
review-between-chunks for higher-stakes content.

---

## 4. Read before writing

- Read every file in the resolved target/chunk with the available
  file-reading tool; do not rely on summaries.
- Note dates, decisions, owners, cross-links, and open questions. These
  are load-bearing and must survive compaction.
- For repo content, skim `git log -- <path>` to separate recent activity
  from settled history.
- For transcripts/logs, note speakers, timestamps, and decision points.

---

## 5. Compact

Apply in order:

1. **Preserve load-bearing facts**: dates, decisions, rationale (the
   _why_), owners, links, open questions, action items, anything the
   user named in step 2.
2. **Drop ephemera**: status chatter, intermediate progress, superseded
   plans, content already canonical elsewhere (e.g. `CLAUDE.md`,
   `AGENTS.md`).
3. **Merge duplicates**: keep one, cite the others by date or source.
4. **Prefer bullets over prose** for logs/history; keep prose for
   rationale and decisions.
5. **Preserve order that carries meaning**: chronological for
   logs/cycles/memory; semantic for docs and code comments.
6. **Never invent.** If something is unclear, leave a `# TODO: verify`
   marker (or comment-equivalent for the file type) and keep the
   original line.
7. **Match the file type**: code comments stay valid comments; markdown
   stays valid markdown; YAML stays parseable.

---

## 6. Respect authority before editing

Before proposing or applying changes, classify the target:

| Target                             | Authority                   | Agent action                                                                                     |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `.agents/context/`                 | Canonical project knowledge | Read and propose diffs only; do not write unless the human explicitly instructs this exact edit. |
| `.agents/prompts/`                 | Human-curated prompts       | Read and propose diffs only; do not write unless the human explicitly instructs this exact edit. |
| `.agents/skills/`                  | Human-approved procedures   | Read and propose diffs only; do not write unless the human explicitly instructs this exact edit. |
| `.agents/memory/`                  | Agent-generated learnings   | May edit or create files after showing the diff and receiving confirmation.                      |
| `.agents/plan/promotions.md`       | Promotion log               | Append-only after explicit human approval.                                                       |
| Other `.agents/plan/` files        | Planning records            | Ask before editing; preserve chronology and append-only intent where present.                    |
| Regular repo docs or source files  | Project-owned content       | May edit after showing the diff and receiving confirmation.                                      |
| Transcripts/logs/external captures | Source evidence             | Prefer writing a compacted derivative file instead of overwriting the original.                  |

When the target is authoritative, use "authoritative" explicitly in the
response and name the rule that blocks direct editing. If the user
already gave an explicit instruction to edit that authoritative file,
still show the planned diff before applying it.

---

## 7. Show a diff before saving

- Present the proposed compaction as a unified diff or before/after
  pairs (per chunk for large jobs).
- Call out removals in one line each, with reason.
- Wait for confirmation before writing.

After approval, apply edits with the available file-editing tool and report:

- Files changed, lines removed vs. kept (rough).
- Anything flagged `# TODO: verify`.
- For chunked jobs: progress (`3 of 7 chunks done`) and what's next.

---

## 8. Don't compact these without explicit confirmation

- Canonical project docs: `.agents/AGENTS.md`, `CLAUDE.md`,
  `.agents/plan/PDCA.md`, `.agents/plan/DoD.md`,
  `.agents/plan/promotions.md`.
- Authoritative directories: `.agents/context/`, `.agents/prompts/`,
  `.agents/skills/`.
- Anything tracked as authoritative reference (config schemas, public
  API docs, license files).
- Files outside the repo, or under `.git/`, `node_modules/`, build
  artifacts.

If the target resolves to one of these, surface it and ask before
touching it.
