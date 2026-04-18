# Skill References (skill-ref)

> Lightweight pointer files that let multiple agent directories share
> skill definitions without duplicating content.

---

## What is a skill-ref?

A skill-ref is a `SKILL.md` that contains `metadata.type: skill-ref` in
its YAML frontmatter. Instead of holding the full skill definition, it
points back to the authoritative skill in `.agents/skills/`.

```yaml
---
name: create-template
description: A reference to a skill.
metadata:
  type: skill-ref
  rootPath: ../../..
---

# Refer to Skill Details at:

@rootPath/.agents/skills/create-template
```

## Directory layout

```text
.agents/skills/<name>/SKILL.md   ← authoritative definition
.claude/skills/<name>/SKILL.md   ← skill-ref (pointer)
.codex/skills/<name>/SKILL.md    ← skill-ref (pointer)
.gemini/skills/<name>/SKILL.md   ← skill-ref (pointer)
.github/skills/<name>/SKILL.md   ← skill-ref (pointer)
```

## Key fields

| Field               | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `metadata.type`     | Must be `"skill-ref"` to identify the file as a pointer        |
| `metadata.rootPath` | Relative path from the skill-ref directory to the project root |
| `sourceDir`         | Path from project root to the source skill directory           |

## Path computation

- `rootPath` = `path.relative(destSkillDir, sourceProjectRoot)`
- `sourceDir` = `<agentsDirName>/skills/<skillName>` (e.g. `.agents/skills/create-template`)

These are computed by `installSkillRef()` in `src/skills/ref.js`.

## Passthrough behavior

When a source skill is itself a skill-ref (`metadata.type: skill-ref`),
its content is copied verbatim to the destination. This avoids
re-computing paths for multi-hop references.

## Conflict rules

| Destination state   | Without `--force` | With `--force` |
| ------------------- | ----------------- | -------------- |
| No existing skill   | Creates ref       | Creates ref    |
| Existing skill-ref  | Error             | Overwrites     |
| Existing real skill | Error             | Error          |

Real skills (non-refs) are never overwritten, even with `--force`.
Remove them manually before creating a skill-ref in the same location.

## CLI usage

```bash
# Single skill ref
a2scaffold skill ref --skill create-template --to .claude

# All skills
a2scaffold skill ref --skill all --to .claude

# Overwrite existing refs
a2scaffold skill ref --skill all --to .claude --force

# Custom source directory (default: .agents)
a2scaffold skill ref --skill all --from .agents --to .claude
```
