# Agent Practice Baseline — 2026-08-29

- **Date**: 2026-08-29
- **Status**: Baseline — measured, acted on, awaiting re-measurement
- **Owner**: Vien Pham (human) + AI agent
- **Next review**: 2027-02-28 (6 months) — earlier if a trigger below fires
- **Rendered version**: [field report artifact](https://claude.ai/code/artifact/d7b8d8ff-70ec-469c-ba17-135a3d08cc10)

> **This file is a measuring stick, not a report.** It records what the field
> looked like on 2026-08-29, with figures precise enough that a future survey
> can be diffed against it rather than merely re-read.
>
> Everything here was true _as reported by the sources on that date_. Figures
> are quoted, not independently reproduced. Do not treat them as current — the
> whole point is that they will drift.
>
> The artifact link renders the same material more readably, but this file is
> the record of survival. If the link dies, nothing here is lost.

---

## 1. How to use this file

**Reading it later**: §2 is what we believed. §3 is what we built because of
it. §4 is how to check whether we were right.

**Re-running the survey**: follow §4 literally. Re-ask the same questions, fill
the "2027-02" column of the tables in §2, and for every row that moved, check
§3 for the decision it justified. A finding that flipped is a design review, not
a trivia update.

**Adding to it**: don't. Open a new dated baseline and link back. This one is a
snapshot; overwriting it destroys the comparison.

---

## 2. The baseline

Volatility is a prediction about how fast each claim will age — **H**igh (expect
movement within 6 months), **M**edium, **L**ow (structural, unlikely to move).

### 2.1 Instruction files

| Claim (2026-08-29)                                                                                                       | Vol   | Source           |
| ------------------------------------------------------------------------------------------------------------------------ | ----- | ---------------- |
| `AGENTS.md` stewarded by the Agentic AI Foundation under the Linux Foundation                                            | L     | agents.md        |
| 60,000+ open-source projects carry one                                                                                   | H     | agents.md        |
| Read natively by 20+ agents (Codex, Cursor, Copilot, Gemini CLI, Jules, Devin, Windsurf, Zed, Warp, Aider, Amp, VS Code) | M     | agents.md        |
| Spec has no required fields; nearest-file-wins precedence for nested files                                               | L     | agents.md        |
| **Claude Code reads `CLAUDE.md`, not `AGENTS.md`**; docs prescribe an `@` import bridge                                  | **H** | Claude Code docs |
| Competing "write once, emit everywhere" tools: `rulesync`, `ai-rules-sync`, `agent_sync`                                 | M     | GitHub           |

### 2.2 Context mechanics (Claude Code)

| Claim                                                                                                                                                                | Vol | Source           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------- |
| Target **under 200 lines** per instruction file; longer reduces adherence                                                                                            | M   | Claude Code docs |
| Imports load at launch and count in full — they organise, they don't save                                                                                            | M   | Claude Code docs |
| Import depth limit: 4 hops; code spans and fences are not parsed as imports                                                                                          | M   | Claude Code docs |
| Files over 4 MiB are skipped entirely                                                                                                                                | M   | Claude Code docs |
| HTML comments are stripped before injection (so comment slots are free)                                                                                              | M   | Claude Code docs |
| `.claude/rules/` supports `paths:` frontmatter for path-scoped loading                                                                                               | M   | Claude Code docs |
| Auto memory at `~/.claude/projects/<project>/memory/`, `MEMORY.md` index loaded first 200 lines / 25KB, machine-local, types `user`/`feedback`/`project`/`reference` | H   | Claude Code docs |
| Context rot degrades recall **13.9–85%** as context grows                                                                                                            | L   | arXiv 2606.29718 |
| Anthropic: context editing **+29%**; with a memory tool **+39%**                                                                                                     | M   | Anthropic        |

### 2.3 Guardrails

| Claim                                                                                                                                                                                                                     | Vol | Source           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------- |
| Instruction files are **context, not enforced configuration**                                                                                                                                                             | L   | Claude Code docs |
| Permission precedence: deny → ask → PreToolUse hooks → allow → mode                                                                                                                                                       | M   | Claude Code docs |
| **File-path rules must use `Edit()`; `Write()` rules are accepted but never consulted**                                                                                                                                   | M   | Claude Code docs |
| `deny` cannot be overridden in-session; `ask` can                                                                                                                                                                         | M   | Claude Code docs |
| OWASP Top 10 for Agentic Applications 2026 = ASI01–ASI10 (goal hijack, tool misuse, identity abuse, supply chain, RCE, memory/context poisoning, inter-agent comms, cascading failures, trust exploitation, rogue agents) | L   | OWASP GenAI      |
| Filesystem isolation alone is insufficient — network isolation needed to stop exfiltration                                                                                                                                | L   | Claude Code docs |

### 2.4 Skills

| Claim                                                                                                                                                            | Vol | Source                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------- |
| Progressive disclosure: name+description at startup, body on activation, references on execution                                                                 | L   | Anthropic              |
| `description` + `when_to_use` truncated at **1,536 characters** in the listing                                                                                   | M   | Claude Code docs       |
| Body recommended under ~**5,000 tokens**                                                                                                                         | M   | Anthropic              |
| Live frontmatter surface includes `when_to_use`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `context`, `argument-hint`, `arguments`, `model` | M   | Claude Code docs       |
| Skilldex conformance scoring: 0–100, **30-word minimum description**, warnings-over-blockers                                                                     | M   | arXiv 2604.16911       |
| Skills portable across ~**40** products                                                                                                                          | H   | agentskills.io         |
| **2,500+** Claude Code plugin marketplaces registered                                                                                                            | H   | claudemarketplaces.com |

### 2.5 Skill supply chain

The figures that most justify our local-first design. **If these improve
dramatically, revisit §3's `skill audit` weighting; if they worsen, consider
making the audit blocking by default.**

| Claim                                                                          | Vol | Source           |
| ------------------------------------------------------------------------------ | --- | ---------------- |
| Snyk ToxicSkills (2026-02-05): **3,984** skills scanned                        | —   | Snyk             |
| **36.82%** carry ≥1 security flaw; **13.4%** critical                          | H   | Snyk             |
| **76** skills with confirmed malicious payloads                                | H   | Snyk             |
| **91%** of malicious skills combine prompt injection with conventional malware | M   | Snyk             |
| Koi Security: **341** malicious of 2,857 audited; **335** from one operation   | H   | Koi              |
| Skills execute with the **full permissions of the host agent**                 | L   | Snyk / Anthropic |
| MINJA: **>95%** memory-injection success against production agents             | M   | arXiv            |

### 2.6 Orchestration

| Claim                                                                                                                  | Vol | Source        |
| ---------------------------------------------------------------------------------------------------------------------- | --- | ------------- |
| Five vendors converged on orchestrator + isolated sub-agents as default                                                | L   | multiple      |
| Princeton: a single agent matched or beat multi-agent on **64%** of benchmarked tasks given the same tools and context | M   | Princeton NLP |
| **40%** of multi-agent pilots fail within six months of production                                                     | H   | industry      |
| Gartner: **1,445%** increase in multi-agent inquiries Q1'24 → Q2'25; average **12** agents per org                     | H   | Gartner       |
| Anthropic: sub-agents return 1,000–2,000 token summaries; **90.2%** improvement on their internal research eval        | M   | Anthropic     |
| Delegation earns its cost at ~10+ files read or 3+ independent pieces                                                  | M   | practitioner  |
| Consensus split: instruction files = facts, skills = routines, hooks = guarantees, sub-agents = delegation             | L   | multiple      |
| One eval: static `AGENTS.md` **100%** pass vs **79%** for dynamic skill retrieval; ~**20%** fewer output tokens        | M   | third-party   |

---

## 3. What we built on this baseline

Landed in [Round 13](../../../.agents/plan/cycles/Round_13.md) — commits
`765ac08`, `80c7a84`, `fb6d5e7`, `cfcb5e8`.

| Decision                                                             | Rests on | Falsified if…                                                                                        |
| -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `.agents/AGENTS.md` is the single heart; root files are peer stubs   | §2.1     | A harness gains native cross-file resolution making stubs redundant                                  |
| Root `AGENTS.md` generated by default                                | §2.1     | The convention loses adoption, or Claude Code reads `AGENTS.md` natively                             |
| KB split into ~190-line core + on-demand `governance.md`             | §2.2     | Import cost stops counting at launch, or the eval in §2.6 generalises — over-lazy-loading hurt there |
| 200-line budget enforced by test                                     | §2.2     | The documented target moves                                                                          |
| `.claude/settings.json` uses `ask` on `.agents/` paths               | §2.3     | `ask` stops honouring the human-override path, or hooks become necessary                             |
| `skill validate` scores conformance, non-blocking                    | §2.4     | The spec adds hard requirements that should block                                                    |
| `skill audit` screens; blocks high-severity on network installs only | §2.5     | Registry hygiene improves enough that screening is noise                                             |
| Decision-framework table in the KB                                   | §2.6     | The four-way split stops matching how harnesses work                                                 |

**Not built, deliberately** — skill registry (space is crowded and unsafe),
multi-agent orchestration features (§2.6 counter-evidence), Claude Code plugin
packaging (harness-specific, we are neutral), renaming `.agents/` (competing
proposals, none accepted).

---

## 4. Re-run protocol

Do this at the next review, or when a trigger fires.

### 4.1 Triggers for an early re-run

- Claude Code ships native `AGENTS.md` support → §2.1 and most of §3 row 1–2
- A new OWASP agentic edition, or a major skill-supply-chain incident → §2.5
- The `.claude/rules/` or permissions syntax changes → §2.3, and the blocked
  path-scoped-rules item in Round 13
- We hit a real problem the baseline said wouldn't happen

### 4.2 Re-ask these

Same shape as the original survey; keep the wording close so results are
comparable.

1. Agent orchestration patterns — single vs multi-agent in production
2. `AGENTS.md` / `CLAUDE.md` convergence and adoption
3. Agent memory architecture — episodic/semantic/procedural, staleness
4. Agent Skills — progressive disclosure, conformance, frontmatter surface
5. Coding-agent guardrails — permissions, sandboxing, hooks, least privilege
6. OWASP agentic threats and skill supply-chain security
7. Context engineering — compaction, budgets, context rot
8. Competing tools in the "rules sync / agent scaffold" space

### 4.3 Primary sources to re-read, not just search

These carry the mechanics we encoded. Search results paraphrase them badly.

- `https://agents.md`
- `https://code.claude.com/docs/en/memory`
- `https://code.claude.com/docs/en/permissions`
- `https://code.claude.com/docs/en/skills`
- `https://code.claude.com/docs/en/plugins`
- `https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents`
- `https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/`

### 4.4 Comparison procedure

1. Fill a **2027-02** column on every table in §2. Mark each row
   `same` / `moved` / `reversed` / `gone`.
2. For every `moved` or `reversed` row, find the §3 decisions resting on it.
3. For each affected decision, decide: still right, needs adjusting, or wrong.
4. Open a new Round for anything in the last two categories.
5. Write a new dated baseline. **Do not edit this file** beyond §6.
6. Score our predictions: how many H rows actually moved, how many L rows
   didn't. If the volatility ratings were badly wrong, say so — that is a
   learning about how we read the field, and it should change how confidently
   we act on the next survey.

### 4.5 What honest re-measurement looks like

The failure mode is confirming ourselves. Guard against it:

- Re-ask the questions **before** re-reading this file, so the baseline doesn't
  anchor the search.
- Actively look for evidence the §3 decisions were wrong. A survey that
  validates everything is a survey that wasn't trying.
- Record figures that got _worse_ for our design as prominently as ones that
  got better. §2.5 is the obvious candidate: if skill hygiene improved a lot,
  `skill audit` is less valuable than we claimed.

---

## 5. Known gaps in this baseline

Stated so a future survey knows where we were thin, not comprehensive:

- **No measurement of our own output.** Every figure is someone else's. We
  never tested whether our scaffolded `AGENTS.md` actually improves agent
  behaviour on this repo. Golden-snapshot tests and an eval harness are in the
  Round 13 backlog for this reason.
- **Adoption figures are vendor- or blog-sourced** and not independently
  verified. Treat the 60,000-project and ~40-product numbers as order of
  magnitude.
- **Gemini CLI and Copilot mechanics were surveyed less deeply** than Claude
  Code's. Our claims about their import behaviour are weaker than the ones
  about Claude Code.
- **No security testing of what we shipped.** The permission rules are
  syntactically correct per the docs and unverified in a live session.

---

## 6. Change log

| Date       | Change                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| 2026-08-29 | Initial baseline. Surveyed, acted on in Round 13, recorded for re-comparison |
