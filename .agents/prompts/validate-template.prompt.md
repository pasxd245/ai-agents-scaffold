---
name: Validate a template
description: Scan an existing template for correctness (structure, variables, safety) before merging or releasing.
argument-hint: Template name under templates/
agent: agent
---

# Prompt: Validate a Template

> Use this prompt to scan an existing template for correctness before
> merging or releasing.

---

## Instructions

Given a template directory at `templates/<name>/`, perform the following
checks and report any issues found.

### Structure checks

1. Verify `values.yaml` exists and is valid YAML
2. Verify `template/` directory exists and contains at least one `.hbs` file
3. Verify `partials/` directory exists (even if only contains `.gitkeep`)

### Content checks

4. Extract all `{{variable}}` references from every `.hbs` file
5. Extract all `${variable}` references from file/directory names
6. Compare against keys defined in `values.yaml`
7. Report any **undefined variables** (used in templates but not in values)
8. Report any **unused variables** (defined in values but not used)

### Safety checks

9. Scan for unescaped `{{` sequences that may be literal text
   (common in markdown code blocks showing Handlebars examples)
10. Verify no secrets, credentials, or API keys in `values.yaml`
11. Verify the base `.agents/` structure is included:
    - `.agents/context/.gitkeep.hbs`
    - `.agents/memory/.gitkeep.hbs`
    - `.agents/prompts/.gitkeep.hbs`
    - `.agents/skills/.gitkeep.hbs`
    - `.agents/plan/cycles/.gitkeep.hbs`
    - `.agents/plan/PDCA.md.hbs`
    - `.agents/plan/promotions.md.hbs`

### Output format

```markdown
## Template Validation: <name>

### Structure: PASS / FAIL
- [x] values.yaml exists
- [x] template/ directory exists
- [x] partials/ directory exists

### Variables: PASS / WARN
- Defined: [list]
- Used: [list]
- Undefined: [list or "none"]
- Unused: [list or "none"]

### Safety: PASS / WARN
- [x] No unescaped Handlebars in literals
- [x] No secrets in values
- [x] Base .agents/ structure included

### Result: READY / NEEDS FIXES
```
