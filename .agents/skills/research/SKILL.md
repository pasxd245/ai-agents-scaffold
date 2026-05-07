---
name: research
description: Use when investigating a topic, comparing options, producing a sourced brief, evaluating tradeoffs, or gathering current evidence before making a recommendation.
metadata:
  author: a2scaffold
  version: '1.0'
---

## Trigger

This skill activates whenever a user asks to research, investigate,
compare, evaluate, survey, find prior art, assess current state, or
prepare a sourced decision brief.

Use it with domain-specific skills when the research is about a known
workflow, codebase, template, product decision, or implementation plan.

## Procedure

### 1. Frame the research question

Restate the user's request as a research question and identify:

- The decision or output the research should support
- The relevant time horizon
- The domain: technical, product, market, academic, legal, operational,
  or strategic
- Any constraints, success criteria, or known assumptions

Ask a clarifying question only when the missing detail would materially
change the research direction. Otherwise, state the assumption and proceed.

### 2. Choose the source strategy

Prefer sources in this order:

1. Primary sources: official docs, specifications, standards, source
   code, papers, laws, release notes, datasets, or first-party reports
2. Strong secondary sources: reputable analysis, books, technical blogs,
   industry reports, or expert commentary
3. Weak secondary sources: forum posts, summaries, unsourced articles, or
   generated content

Use current sources when facts may have changed recently, including
prices, laws, APIs, model capabilities, company details, security issues,
or active projects.

When crawling is useful for JavaScript-heavy pages, docs sites, clean
Markdown extraction, or multi-page source collection, read
[crawl4ai.md](references/crawl4ai.md).

### 3. Collect evidence

Track the evidence needed to support the final answer:

- Source title or file path
- Author, organization, or owner when available
- Publication or update date when relevant
- The specific claim supported by the source
- Whether the source is primary or secondary

Separate observed facts from interpretation. Preserve contradictions or
gaps instead of smoothing them into a false consensus.

### 4. Evaluate reliability

For important claims, check:

- Is the source primary, current, and directly relevant?
- Is the claim corroborated by another credible source?
- Could the author or organization have a conflict of interest?
- Is the evidence about the exact topic, or only an analogy?
- What would make this conclusion wrong?

If evidence is limited, say so and lower the confidence level.

### 5. Synthesize

Answer the user's real question first. Then group supporting findings by
theme, not by source. Make reasoning explicit enough that the user can see
how the evidence supports the conclusion.

Include:

- What is known
- What is uncertain
- What tradeoffs matter
- What risks or failure modes remain
- What follow-up research would change the recommendation

### 6. Report

Use the smallest structure that fits the task. For decision-oriented
research, prefer:

- Summary
- Key findings
- Evidence
- Risks / unknowns
- Recommendation
- Next steps

For quick research, a concise answer with source notes is enough.

## Quality Bar

- Do not present unsourced claims as settled facts.
- Do not hide uncertainty.
- Do not over-collect sources after the answer is clear.
- Do not use secondary summaries when primary sources are readily
  available and material to the answer.
- Do not let the source order dictate the final structure.
