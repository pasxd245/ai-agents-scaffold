# Definition of Done (DoD)

> Criteria that must be met before a Round can move from **Review** to
> **Complete**. Each Round's Check phase should verify these items.

---

## General Criteria (all Rounds)

### Code Quality

- [x] All new/modified code follows existing project conventions
- [x] No linting errors or warnings introduced
- [x] No TODO/FIXME left without a tracking reference

### Testing

- [x] All existing tests pass (`pnpm test`)
- [x] New functionality has corresponding test cases
- [x] Edge cases identified in the plan are covered by tests

### Documentation

- [x] HELP text updated if CLI interface changed
- [x] `docs/` updated if public API changed
- [x] `.agents/context/` updated if architecture changed

### Integration

- [x] Feature works end-to-end via CLI (manual verification)
- [x] No regressions in existing commands
- [x] `src/index.js` exports updated if new public functions added

---

## Round 04 — Skill Ref: Specific Criteria

### Template

- [x] `templates/skill-ref/` exists with valid structure (values.yaml, template/, optional partials/)
- [x] Template renders correctly via `scaffold()` with skill overrides
- [x] Output SKILL.md contains correct frontmatter (`name`, `metadata.type: skill-ref`, `rootPath`)
- [x] `${skill.path}` path interpolation produces correct output directory

### Command

- [x] `a2scaffold skill ref --skill <name> --to <dst>` creates a single skill ref
- [x] `a2scaffold skill ref --skill all --to <dst>` creates refs for all skills
- [x] `--from` defaults to `.agents` when omitted
- [x] `--force` overwrites existing skill-refs
- [x] Error when `--from === --to` (prevent self-referencing)
- [x] Error when dest has a real skill (non-ref), even with `--force`
- [x] Error without `--force` when dest has existing skill-ref
- [x] Error on non-existent source skill
- [x] Skill-ref source files are copied verbatim (passthrough)

### Path Computation

- [x] `rootPath` is a correct relative path from dest skill dir to source project root
- [x] `sourceDir` correctly references the source skill directory from the project root
- [x] Paths work across different directory depths
