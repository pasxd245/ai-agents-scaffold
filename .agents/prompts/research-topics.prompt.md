---
name: Research and save findings
description: Research a topic or URL using the research skill, then write a cited summary to a user-provided output path. Ask for the topic or path when omitted.
argument-hint: Research target plus optional output path, e.g. "crawl4ai auth docs -> .agents/memory/crawl4ai-auth.md"
agent: agent
---

# Prompt: Research and Save Findings

Use this prompt when the user asks to research, gather more information,
investigate a topic, crawl URLs, or save findings to a file.

This is an auto-loaded prompt workflow for resolving the request, respecting
write authority, and saving the output. Use the `research` skill for source
strategy, evidence handling, crawler/tool choice, synthesis, and quality bar.

---

## 1. Resolve the request

Identify:

- **Research target**: question, topic, URL, repo, docs site, issue, PR, or
  named entity.
- **Output path**: where to save the research notes.
- **Freshness requirement**: whether the user needs latest/current info.
- **Depth**: quick scan, focused answer, or deep research.

If the research target is missing, ask what to research.

If the output path is missing, ask where to save the findings. Do not guess
for authoritative locations. If the user wants a reasonable default, use
`.agents/memory/YYYY-MM-DD-<topic>-research.md`.

If the target is ambiguous, list the likely interpretations and ask the user
to pick one.

---

## 2. Respect authority before writing

Classify the output path before writing:

| Output path                  | Rule                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `.agents/context/`           | Authoritative. Propose the research note or diff only unless the human explicitly instructs this exact write.  |
| `.agents/prompts/`           | Human-curated. Propose the research note or diff only unless the human explicitly instructs this exact write.  |
| `.agents/skills/`            | Human-approved. Propose the research note or diff only unless the human explicitly instructs this exact write. |
| `.agents/memory/`            | Allowed for research notes after showing the intended file path and summary shape.                             |
| `.agents/plan/promotions.md` | Append-only after explicit approval.                                                                           |
| Other repo docs              | May write after confirming the path and showing the planned summary structure.                                 |
| Outside repo                 | Ask for explicit confirmation before writing.                                                                  |

When a path is authoritative, say "authoritative" explicitly and name the
rule that blocks direct editing.

---

## 3. Apply the research skill

Use the `research` skill to choose sources, collect evidence, evaluate
reliability, synthesize findings, and decide whether current web
search/browsing is required.

If crawling appears useful, follow the crawl4ai reference in the `research`
skill. Do not install crawler tooling silently.

---

## 4. Research procedure

1. Restate the target, output path, and depth.
2. Follow the `research` skill's source strategy and evidence workflow.
3. Record source metadata: title, URL, publisher/project, retrieved date,
   and why it is relevant.
4. Cross-check important claims across at least two sources when possible.
5. Separate facts from inference. Label uncertain or inferred points.
6. Avoid copying long passages. Quote only short excerpts when needed.
7. Track gaps, contradictions, and follow-up questions.

For multi-page research, keep a source ledger as you go:

```markdown
## Sources

- [Title](URL) - publisher/project, retrieved YYYY-MM-DD. Relevance: ...
```

---

## 5. Save format

Write the output as Markdown unless the user requested another format.

Default structure:

```markdown
# <Research Topic>

**Date**: YYYY-MM-DD
**Researcher**: <agent/tool name>
**Scope**: <what was researched>
**Output status**: Draft | Ready | Needs Review

## Summary

<5-10 bullets or short paragraphs with the highest-signal findings.>

## Findings

### <Finding>

- Evidence:
- Implication:
- Confidence: High | Medium | Low

## Source Ledger

- [Source title](URL) - retrieved YYYY-MM-DD. Notes: ...

## Gaps / Follow-up

- ...
```

If saving into `.agents/memory/`, use the repo's memory conventions:
include `Date`, `Agent`, `Confidence`, `Status`, `Evidence`, and
`Promotion Candidate?` where relevant.

---

## 6. Before writing

Before creating or updating the output file:

- Confirm the resolved output path.
- Say whether the path is authoritative, memory, docs, or external.
- Show the planned headings and a brief summary of what will be written.
- Ask for confirmation when required by the authority rules.

After writing, report:

- File path written.
- Number and type of sources used.
- Any unresolved gaps or low-confidence claims.
