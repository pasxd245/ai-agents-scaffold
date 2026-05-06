---
name: Research and save findings
description: Research a topic or URL using available search, browsing, and optional crawl4ai crawling, then write a cited summary to a user-provided output path. Ask for the topic or path when omitted.
argument-hint: Research target plus optional output path, e.g. "crawl4ai auth docs -> .agents/memory/crawl4ai-auth.md"
agent: agent
---

# Prompt: Research and Save Findings

Use this prompt when the user asks to research, gather more information,
investigate a topic, crawl URLs, or save findings to a file.

This is an auto-loaded prompt workflow. It is not a full skill unless the
repo later needs bundled scripts, reusable extraction schemas, or packaged
browser/crawler setup.

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

## 3. Choose research tools

Prefer primary sources:

- Official docs, source repositories, release notes, standards, specs, or
  vendor pages.
- Use secondary sources only for context, examples, or independent
  corroboration.

Use current web search/browsing when:

- The user asks for latest/current/recent information.
- The facts may have changed.
- The target is a specific URL, repo, docs page, package, issue, or PR.
- Precise citations or direct source links are needed.

Use `crawl4ai` only when it is useful:

- JavaScript-heavy pages, docs sites, pages where clean Markdown extraction
  helps, or multi-page crawling.
- Do not install it silently. First check whether Python and `crawl4ai` are
  available. If missing and crawling is important, ask for permission to run
  installation/setup.

Current crawl4ai basics:

```bash
python3 --version
python3 -c "import importlib.util; print(importlib.util.find_spec('crawl4ai'))"
pip install -U crawl4ai
crawl4ai-setup
crawl4ai-doctor
```

Minimal crawl pattern:

```python
import asyncio
from crawl4ai import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun("https://example.com")
        print(result.markdown)

asyncio.run(main())
```

For configured crawls, use `BrowserConfig` and `CrawlerRunConfig`. Prefer
Markdown output for research notes and structured extraction only when the
user needs specific fields.

Fallbacks when crawl4ai is unavailable:

- Built-in web/search tools.
- `curl` or similar CLI fetches when network access is allowed.
- Existing local docs and repo files.
- Ask the user for source material if network access is unavailable.

---

## 4. Research procedure

1. Restate the target, output path, and depth.
2. Gather sources, prioritizing primary sources.
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
