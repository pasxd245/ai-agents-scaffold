# Prompt: Create a New Template

> Use this prompt when a user wants to generate a new template for
> a2scaffold. Follow the skill at `skills/create-template/SKILL.md`
> for the step-by-step procedure.

---

## Instructions

The user wants to create a new a2scaffold template. Gather the following
information, then generate the template structure.

### 1. Gather requirements

Ask the user:
- **Template name**: What should this template be called? (kebab-case)
- **Target use case**: What framework/language/workflow is this for?
- **Files to generate**: What files should the template produce beyond
  the base `.agents/` structure?
- **Variables needed**: What values should be customizable? (e.g.,
  project name, language version, framework settings)

### 2. Generate template structure

Create the following under `templates/<name>/`:

```text
templates/<name>/
  values.yaml         ← Default values for all variables
  template/           ← .hbs files mirroring output structure
    .agents/           ← Standard directory structure
      AGENTS.md.hbs   ← Customized for the use case
      context/
        .gitkeep.hbs
        <framework-patterns>.md.hbs   ← Pre-populated context
      memory/.gitkeep.hbs
      prompts/.gitkeep.hbs
      skills/.gitkeep.hbs
      plan/
        PDCA.md.hbs
        promotions.md.hbs
        cycles/.gitkeep.hbs
    .claude/CLAUDE.md.hbs
    .github/copilot-instructions.md.hbs
    <additional-files>.hbs            ← Template-specific files
  partials/
    .gitkeep
```

### 3. Key principles

- **Extend the base, don't replace it.** Always include the standard
  `.agents/` directories and governance files.
- **Pre-populate context.** If the template targets a framework, add
  relevant patterns to `.agents/context/` so agents have useful
  knowledge from day one.
- **Customize AGENTS.md.** Tailor the pair-programming guide to the
  specific workflow (e.g., add framework-specific coding guidelines
  to the "Role & Mindset" section).
- **Keep values minimal.** Only add variables that templates actually
  interpolate.

### 4. Validate

After generating, run the validation prompt at
`prompts/validate-template.md` to check for issues.

Then test:

```bash
node bin/cli.js --use <name> --output /tmp/test -n "test-project"
```
