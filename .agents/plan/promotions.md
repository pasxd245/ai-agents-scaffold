# Promotion Log

> Append-only log of memory entries promoted to `context/` or `skills/`.
> See [PDCA.md](PDCA.md) for methodology and [AGENTS.md](../AGENTS.md) for promotion criteria.

---

<!-- Append new entries below this line using the format:

## YYYY-MM-DD: [Topic] → [Destination]

**Source**: memory/[filename]
**Rationale**: [1-2 sentences]
**Promoted by**: [Human name]

-->

## 2026-02-28: js-tmpl Integration Patterns → context/

**Source**: Round_01 Act phase learnings
**Rationale**: Verified patterns for using js-tmpl's API, partials, path resolution, and values merging — foundational knowledge for all future development.
**Promoted by**: Vien Pham

## 2026-02-28: Template Creation Checklist → skills/

**Source**: Round_01 Act phase + CONTRIBUTING.md
**Rationale**: Step-by-step reusable procedure for adding new templates, validated during base template creation.
**Promoted by**: Vien Pham

## 2026-03-05: Release Pipeline (actual) → context/architecture.md

**Source**: `.github/workflows/release.yml` + Round_03 correction note
**Rationale**: Round_03 documented an initial workflow design that was refactored before v0.0.1 was tagged. Updated `context/architecture.md` to reflect the actual pipeline (OIDC, PR-based changelog, dist-tag logic). Also appended a correction table to Round_03 and created `memory/2026-03-05-release-workflow-refactor.md`.
**Promoted by**: Vien Pham

## 2026-03-19: Prompt Conventions → context/conventions.md

**Source**: reflect-agents prompt validation and .prompt.md adoption
**Rationale**: Documented the `.prompt.md` extension and YAML frontmatter convention after establishing it across all three prompt files.
**Promoted by**: Vien Pham

## 2026-04-06: Optional Partials for js-tmpl 0.0.1 → context/

**Source**: Published `@nci-gis/js-tmpl@0.0.1` package behavior review
**Rationale**: Corrected authoritative guidance that still claimed `partials/` was mandatory. The published package skips partial registration when `partialsDir` is omitted, so runtime validation and template guidance were updated to make `partials/` optional.
**Promoted by**: Human-confirmed agent update

## 2026-04-06: Skill-Ref Pattern → context/skill-refs.md

**Source**: Round_04 Act phase — skill ref implementation
**Rationale**: Documented the skill-ref pattern (lightweight SKILL.md pointers with `metadata.type: skill-ref`), including directory layout, path computation, passthrough behavior, and conflict rules.
**Promoted by**: Human-confirmed agent update

## 2026-08-29: Project Philosophy → context/philosophy.md

**Source**: Round_13 — derived from `ecosystem-ideas.draft.md`, the repo
refactor plan, and existing `context/conventions.md`
**Rationale**: The principles that decide close calls were scattered across
planning docs and implicit in code review. Collected into canonical context and
summarised in every root instruction stub, so agents load them each session.
**Promoted by**: Vien Pham

## 2026-08-29: Governance long-form split → governance.md

**Source**: Round_13 — context-budget work
**Rationale**: `.agents/AGENTS.md` is imported into every session and had grown
to 315 lines; imports load at launch and count in full against the context
window, and adherence drops as instruction files grow. Memory format, promotion
criteria, skill authoring and the `docs/agents/` policy moved to an on-demand
reference. No content was dropped.
**Promoted by**: Vien Pham
