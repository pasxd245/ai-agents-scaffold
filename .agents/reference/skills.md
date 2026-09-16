# Authoring a SKILL.md

> **Read this when**: writing a new skill, or fixing one that
> `a2scaffold skill validate` flagged.

---

## Format ([Agent Skills spec](https://agentskills.io/specification))

Each skill is a directory under `skills/` containing a `SKILL.md` file
with YAML frontmatter:

```text
skills/<skill-name>/
  SKILL.md          # Required: frontmatter + instructions
  scripts/          # Optional: executable code
  references/       # Optional: additional docs
  assets/           # Optional: templates, data files
```

`SKILL.md` must include:

```markdown
---
name: <skill-name>
description: What this skill does and when to use it.
---

## Trigger

This skill activates whenever...

## Procedure

1. Step one
2. Step two
```

The `name` field must match the directory name (kebab-case, lowercase).

---

## Conformance

`a2scaffold skill validate` scores each skill 0-100 and reports warnings that
never block an installation — a description too vague to trigger reliably, an
oversized body, unrecognised frontmatter keys. See
[docs/skills.md](../../docs/skills.md) for the full list.

`a2scaffold skill audit` screens for supply-chain risks. Run it on any skill
you did not write: skills execute with the agent's full permissions.
