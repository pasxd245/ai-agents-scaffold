# Round 02: Promote Round_01 Learnings + Add Prompts

**Status**: Review
**Date started**: 2026-02-28
**Date completed**: —

## Goal

Graduate validated learnings from Round_01 into `context/` and `skills/`.
Create reusable agent prompts in `.agents/prompts/` for template-related
tasks. This completes the PDCA Act phase for Round_01 and establishes the
prompts directory as a useful resource.

## Plan

- [x] Promote js-tmpl integration patterns → `context/js-tmpl.md`
- [x] Promote template creation checklist → `skills/create-template.md`
- [x] Create prompt: template validation scan → `prompts/validate-template.md`
- [x] Create prompt: new template scaffolding → `prompts/create-template.md`
- [x] Log all promotions in `plan/promotions.md`
- [x] Update Round_01 status to Complete
- [x] Update `architecture.md` and `conventions.md` project name to `a2scaffold`

## Do

### 2026-02-28

- Created `context/js-tmpl.md` — core API usage, template file rules,
  partials gotcha, path resolution, values merging patterns
- Created `skills/create-template.md` — 7-step procedure with directory
  structure, Handlebars edge cases, testing, and PR checklist
- Created `prompts/validate-template.md` — structured scan for template
  correctness (structure, variables, safety checks, output format)
- Created `prompts/create-template.md` — guided prompt for generating new
  templates (gather requirements, generate structure, principles, validate)
- Logged 2 promotions in `promotions.md`
- Marked Round_01 as Complete with promotion checkboxes updated
- Renamed `ai-agents-scaffold` → `a2scaffold` in architecture.md and conventions.md

## Check

- [x] `context/js-tmpl.md` contains verified integration patterns
- [x] `skills/create-template.md` is a clear, step-by-step procedure
- [x] Prompts are actionable — an agent can follow them without ambiguity
- [x] `promotions.md` has entries for each promotion
- [x] Round_01 marked Complete
- [x] All tests still pass (19/19)

## Act

**Learnings**:

- (to be filled after Check phase)

**Promotions**:

- (this round IS the promotions)
