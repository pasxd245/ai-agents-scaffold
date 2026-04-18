# Round 04: Skill Ref — Lightweight Skill Reference Command

**Status**: Review
**Date started**: 2026-03-26
**Date completed**: 2026-04-06

## Goal

Add a `skill ref` subcommand that creates lightweight SKILL.md pointer files
instead of copying entire skill directories. This enables sharing skill
references across AI agent base directories (`.agents`, `.claude`, `.codex`, etc.)
without duplicating content. Local-only scope for v1; GitHub sources deferred.

## Plan

- [x] Create `templates/skill-ref/` — values.yaml, template/${skill.path}/SKILL.md.hbs, partials/.gitkeep
- [x] Add `isSkillRef(skillDir)` to `src/skills.js` — detect skill-ref type via `metadata.type`
- [x] Add `discoverSkills(agentsDir)` to `src/skills.js` — find all skills under a source agents dir
- [x] Add `installSkillRef({ from, to, skill, force })` to `src/skills.js` — orchestrate ref creation using scaffold() with skill-ref template
- [x] Update `src/index.js` — export new public functions
- [x] Add `parseSkillRefArgs()` with `--skill`, `--from`, `--to`, `-f` flags in `bin/cli.js`
- [x] Add `runSkillRef()` handler and `case 'ref':` routing in `bin/cli.js`
- [x] Update HELP text with ref command docs and examples
- [x] Create test fixtures: `skill-ref-skill/SKILL.md`, temp multi-skill dirs
- [x] Add test cases for `isSkillRef`, `discoverSkills`, `installSkillRef`
- [x] Run full test suite, verify no regressions

## Do

- Implemented `isSkillRef`, `discoverSkills`, `installSkillRef` in `src/skills.js`
- Created `templates/skill-ref/` with Handlebars partial (`skill_ref.hbs`)
- Added CLI `skill ref` subcommand with `--skill`, `--from`, `--to`, `--force` flags
- Extracted shared `general_instructions.hbs` partial in the base template
- Made `partials/` optional to align with published `@nci-gis/js-tmpl@0.0.1`
- Added skill-ref SKILL.md pointers for all four agents (.claude, .codex, .gemini, .github)
- Comprehensive test coverage: 66 tests passing

## Check

- [x] `pnpm test` — all tests pass (existing + new)
- [x] `a2scaffold skill ref --skill <name> --to <dst>` creates correct SKILL.md with `type: skill-ref`
- [x] `a2scaffold skill ref --skill all --to <dst>` creates refs for every skill
- [x] `--from` defaults to `.agents` when omitted
- [x] Skill-ref passthrough: source with `type: skill-ref` is copied verbatim
- [x] `rootPath` is correct relative path from dest skill dir to source project root
- [x] `--force` overwrites existing skill-refs
- [x] Error when `--from === --to`
- [x] Error when dest has real skill (non-ref), even with `--force`
- [x] Error without `--force` when dest has existing skill-ref
- [x] Error on non-existent source skill

## Act

**Learnings**:

- Published `@nci-gis/js-tmpl@0.0.1` skips partial registration when `partialsDir` is omitted — `partials/` no longer needs to be mandatory in templates
- Skill-ref passthrough (copying verbatim when source is already a ref) simplifies multi-hop references without re-computing paths
- Extracting shared content into Handlebars partials (`general_instructions.hbs`, `skill_ref.hbs`) reduces duplication across agent instruction files

**Promotions**:

- [x] → context/ : skill-ref pattern documentation (`.agents/context/skill-refs.md`)
