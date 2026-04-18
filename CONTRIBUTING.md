# Contributing a New Template

Templates allow the community to share pre-configured AI agent setups
for specific frameworks, languages, and workflows.

## Template Structure

Each template lives in `templates/<template-name>/` with this layout:

```text
templates/
  <template-name>/
    values.yaml       # Required: default variable values
    template/         # Required: .hbs template files (output structure)
    partials/         # Required: Handlebars partials (can be empty)
      .gitkeep
    README.md         # Optional: documents this template
```

## Step-by-Step

1. **Create a directory** under `templates/` with your template name.
   Use kebab-case: `python-crew`, `langchain-rag`, `claude-mcp`, etc.

2. **Create `values.yaml`** with all variables your templates use.
   Document each variable with YAML comments:

   ```yaml
   # Python CrewAI template values
   project:
     name: 'my-crew'
     python_version: '3.11'
   crew:
     agents:
       - name: 'researcher'
         role: 'Research Agent'
   ```

3. **Create `template/`** directory with your `.hbs` files.
   The directory structure mirrors the desired output:
   - File names: append `.hbs` extension (e.g., `config.yaml.hbs`)
   - Empty placeholder files: use `.gitkeep.hbs` with empty content
   - Dynamic paths: use `${variable}` syntax in directory/file names
   - Content: use Handlebars `{{variable}}`, `{{#if}}`, `{{#each}}`

4. **Create `partials/`** directory, even if empty (include `.gitkeep`).
   This directory is required by the template engine.

5. **Test locally:**

   ```bash
   node bin/cli.js --use <your-template> --output /tmp/test-output
   ```

6. **Submit a PR.**

## Validation Checklist

Before submitting, verify:

- [ ] `values.yaml` exists and is valid YAML
- [ ] `template/` directory exists with at least one `.hbs` file
- [ ] `partials/` directory exists (even if empty with `.gitkeep`)
- [ ] All `{{variables}}` in `.hbs` files are defined in `values.yaml`
- [ ] No unintended `{{` sequences in template content
- [ ] Template generates successfully with default values
- [ ] Base `.agents/` structure is included (extend, don't replace)

## Template Guidelines

- **Always include the base `.agents/` structure.** Your template should
  extend the base setup, not replace it. Include the standard directories
  (`context/`, `memory/`, `prompts/`, `skills/`, `plan/`).

- **Pre-populate `context/` when possible.** If your template targets a
  specific framework, include relevant patterns and conventions in
  `.agents/context/`.

- **Keep `values.yaml` minimal.** Only include variables that templates
  actually use. Users override values via `--name` and future CLI flags.

- **Document your template.** Add a `README.md` inside your template
  directory explaining what it generates and how to use it.

- **Follow the [Agent Skills spec](https://agentskills.io/specification)
  for skills.** If your template includes pre-built skills in
  `.agents/skills/`, each skill must be a directory with a `SKILL.md`
  containing YAML frontmatter (`name`, `description`).
