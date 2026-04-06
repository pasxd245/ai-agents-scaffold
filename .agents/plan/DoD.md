# Definition of Done (DoD)

> Criteria that must be met before a Round can move from **Review** to
> **Complete**. Each Round's Check phase should verify these items.

---

## General Criteria (all Rounds)

### Code Quality

- [ ] All new/modified code follows existing project conventions
- [ ] No linting errors or warnings introduced
- [ ] No TODO/FIXME left without a tracking reference

### Testing

- [ ] All existing tests pass (`pnpm test`)
- [ ] New functionality has corresponding test cases
- [ ] Edge cases identified in the plan are covered by tests

### Documentation

- [ ] HELP text updated if CLI interface changed
- [ ] `docs/` updated if public API changed
- [ ] `.agents/context/` updated if architecture changed

### Integration

- [ ] Feature works end-to-end via CLI (manual verification)
- [ ] No regressions in existing commands
- [ ] `src/index.js` exports updated if new public functions added

---

## Round 04 — Skill Ref: Specific Criteria

### Template

- [ ] `templates/skill-ref/` exists with valid structure (values.yaml, template/, optional partials/)
- [ ] Template renders correctly via `scaffold()` with skill overrides
- [ ] Output SKILL.md contains correct frontmatter (`name`, `metadata.type: skill-ref`, `rootPath`)
- [ ] `${skill.path}` path interpolation produces correct output directory

### Command

- [ ] `a2scaffold skill ref --skill <name> --to <dst>` creates a single skill ref
- [ ] `a2scaffold skill ref --skill all --to <dst>` creates refs for all skills
- [ ] `--from` defaults to `.agents` when omitted
- [ ] `--force` overwrites existing skill-refs
- [ ] Error when `--from === --to` (prevent self-referencing)
- [ ] Error when dest has a real skill (non-ref), even with `--force`
- [ ] Error without `--force` when dest has existing skill-ref
- [ ] Error on non-existent source skill
- [ ] Skill-ref source files are copied verbatim (passthrough)

### Path Computation

- [ ] `rootPath` is a correct relative path from dest skill dir to source project root
- [ ] `sourcePath` correctly references the original SKILL.md from the project root
- [ ] Paths work across different directory depths
