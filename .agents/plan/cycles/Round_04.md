# Round 04: Skill Ref — Lightweight Skill Reference Command

**Status**: Planning
**Date started**: 2026-03-26
**Date completed**: —

## Goal

Add a `skill ref` subcommand that creates lightweight SKILL.md pointer files
instead of copying entire skill directories. This enables sharing skill
references across AI agent base directories (`.agents`, `.claude`, `.codex`, etc.)
without duplicating content. Local-only scope for v1; GitHub sources deferred.

## Plan

- [ ] Create `templates/skill-ref/` — values.yaml, template/${skill.path}/SKILL.md.hbs, partials/.gitkeep
- [ ] Add `isSkillRef(skillDir)` to `src/skills.js` — detect skill-ref type via `metadata.type`
- [ ] Add `discoverSkills(agentsDir)` to `src/skills.js` — find all skills under a source agents dir
- [ ] Add `installSkillRef({ from, to, skill, force })` to `src/skills.js` — orchestrate ref creation using scaffold() with skill-ref template
- [ ] Update `src/index.js` — export new public functions
- [ ] Add `parseSkillRefArgs()` with `--skill`, `--from`, `--to`, `-f` flags in `bin/cli.js`
- [ ] Add `runSkillRef()` handler and `case 'ref':` routing in `bin/cli.js`
- [ ] Update HELP text with ref command docs and examples
- [ ] Create test fixtures: `skill-ref-skill/SKILL.md`, temp multi-skill dirs
- [ ] Add test cases for `isSkillRef`, `discoverSkills`, `installSkillRef`
- [ ] Run full test suite, verify no regressions

## Do

[Progress log — update as work proceeds]

## Check

- [ ] `pnpm test` — all tests pass (existing + new)
- [ ] `a2scaffold skill ref --skill <name> --to <dst>` creates correct SKILL.md with `type: skill-ref`
- [ ] `a2scaffold skill ref --skill all --to <dst>` creates refs for every skill
- [ ] `--from` defaults to `.agents` when omitted
- [ ] Skill-ref passthrough: source with `type: skill-ref` is copied verbatim
- [ ] `rootPath` is correct relative path from dest skill dir to source project root
- [ ] `--force` overwrites existing skill-refs
- [ ] Error when `--from === --to`
- [ ] Error when dest has real skill (non-ref), even with `--force`
- [ ] Error without `--force` when dest has existing skill-ref
- [ ] Error on non-existent source skill

## Act

**Learnings**:
- ...

**Promotions**:
- [ ] → context/ : skill-ref pattern documentation
