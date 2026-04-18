---
name: create-template
description: Step-by-step procedure for adding a new template to a2scaffold. Use when a contributor wants to add a new template or you need to scaffold a new template directory structure.
metadata:
  author: a2scaffold
  version: '1.0'
---

## Trigger

This skill activates whenever:

- A contributor wants to add a new template
- You need to scaffold a new template directory structure

## Procedure

### 1. Create directory structure

```bash
mkdir -p templates/<template-name>/template
```

Use **kebab-case** for `<template-name>`: `python-crew`, `langchain-rag`, etc.

Create `templates/<template-name>/partials/` only if the template uses
Handlebars partials. When you need it, add `.gitkeep` so git tracks the
directory.

### 2. Create values.yaml

Define all variables the template will use:

```yaml
# templates/<template-name>/values.yaml
project:
  name: 'my-project'
# Add template-specific variables here
```

Document each variable with YAML comments.

### 3. Create .hbs template files

Under `templates/<template-name>/template/`, create the output structure:

- **Always include** the base `.agents/` structure (extend, don't replace)
- File names: append `.hbs` extension (e.g., `config.yaml.hbs`)
- Empty placeholders: use `.gitkeep.hbs` with empty content
- Dynamic paths: use `${var}` syntax in directory/file names
- Content: use Handlebars `\{{var}}`, `\{{#if}}`, `\{{#each}}`
- Create `partials/` only when the template uses `{{> partial}}`

### 4. Handle Handlebars edge cases

- Audit `.hbs` files for unintended `\{{` sequences (e.g., in code blocks)
- Escape literal `\{{` with `\\{{` if needed
- Markdown code fences with Handlebars examples are safe inside
  triple-backtick blocks — Handlebars still processes them, so escape
  any `\{{` that should be literal output

### 5. Test locally

```bash
node bin/cli.js --use <template-name> --output /tmp/test-output
```

Verify:

- [ ] All expected files generated
- [ ] `.gitkeep` files are empty
- [ ] Variable substitution works correctly
- [ ] No stray Handlebars artifacts in output

### 6. Run existing tests

```bash
pnpm test
```

Ensure no regressions. The `listTemplates` test will automatically
pick up the new template.

### 7. Submit PR

Include in PR description:

- What the template generates
- Target use case (framework, language, workflow)
- Any new variables in values.yaml
