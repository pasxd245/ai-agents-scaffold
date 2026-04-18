# Skill Workflow

> End-to-end flow for `a2scaffold skill <subcommand>` — managing Agent
> Skills and lightweight skill references (`skill-ref`).

## Subcommand map

```mermaid
flowchart LR
  A[a2scaffold skill] --> B[add]
  A --> C[list]
  A --> D[validate]
  A --> E[ref]
  B --> B1[installSkill]
  C --> C1[listSkills]
  D --> D1[validateSkill]
  E --> E1[installSkillRef]
```

## `skill add` — install a skill

```mermaid
flowchart TD
  A[a2scaffold skill add source] --> B[parseSkillSource]
  B --> C{type}
  C -->|local| D[installFromLocal]
  C -->|github| E[git sparse-checkout]
  E --> D
  D --> F[validateSkill on source]
  F --> G{valid?}
  G -->|no| H[Error: source invalid]
  G -->|yes| I{dest exists?}
  I -->|yes, no --force| J[Error: already exists]
  I -->|no, or --force| K[cpSync → .agents/skills/name]
```

**Sources:** local path, `owner/repo/path`, or full GitHub URL.

## `skill list` — list installed skills

Reads `<agentsDir>/skills/*/SKILL.md`, parses frontmatter, prints name +
description. Sorted alphabetically. Skips dirs without `SKILL.md` or
unparseable frontmatter.

## `skill validate` — validate against spec

```mermaid
flowchart TD
  A[a2scaffold skill validate name?] --> B{name given?}
  B -->|yes| C[validate single]
  B -->|no| D[validate all in skills/]
  C --> E[validateSkill]
  D --> E
  E --> F{frontmatter ok?}
  F -->|no| G[Report errors]
  F -->|yes| H[Check name/description/compatibility]
  H --> I{all rules pass?}
  I -->|no| G
  I -->|yes| J[Mark valid]
  G --> K[exit 1]
  J --> L{more skills?}
  L -->|yes| E
  L -->|no| M[exit 0]
```

**Validation rules** (see [src/skills/validate.js](../../../src/skills/validate.js)):

- `SKILL.md` must exist with YAML frontmatter
- `name`: 1-64 chars, `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`, matches dir name
- `description`: 1-1024 chars
- `compatibility` (optional): ≤500 chars

**Skill-ref chain validation** (implemented in [src/skills/ref-chain.js](../../../src/skills/ref-chain.js)):

When a skill has `metadata.type: skill-ref`, `validateSkill` also walks the
ref chain — resolving each hop via `metadata.rootPath` + the `@rootPath/<path>`
line in the body — and reports:

- `broken ref: target does not exist at "<path>"` — dead pointer
- `ref cycle detected: A → B → A` — visited-set detection
- `ref chain exceeds max depth (5)` — MAX_REF_DEPTH cap
- `terminal skill invalid: <err>` — bubbles errors from the raw terminal

## `skill ref` — create skill-refs

Creates lightweight pointer `SKILL.md` files in a destination agents dir
(e.g. `.claude/skills/`) that point back to skills in a source dir
(e.g. `.agents/skills/`). Used so multiple agent tools can share a single
authoritative skill definition.

```mermaid
flowchart TD
  A[a2scaffold skill ref --skill X --to .claude] --> B[resolveSkillsToRef]
  B --> C{skill == all?}
  C -->|yes| D[discoverSkills from .agents]
  C -->|no| E[locate single skill]
  D --> F[for each skill]
  E --> F
  F --> G[checkDestConflict]
  G --> H{dest state}
  H -->|real skill| I[Error: cannot overwrite]
  H -->|ref, no --force| J[Error: already exists]
  H -->|ref, --force| K[proceed]
  H -->|not exist| K
  K --> L{source is ref?}
  L -->|yes passthrough| M[copy content verbatim]
  L -->|no raw| N[render skill-ref template with rootPath + sourceDir]
  M --> O[write dest/skills/name/SKILL.md]
  N --> O
```

**Conflict rules** (`installSkillRef`):

| Dest state          | No `--force` | With `--force`  |
| ------------------- | ------------ | --------------- |
| not exist           | create ref   | create ref      |
| existing skill-ref  | error        | overwrite       |
| existing real skill | error        | **still error** |

**Passthrough:** if the source SKILL.md already has
`metadata.type: skill-ref`, its content is copied verbatim so the final
file still resolves to the original real skill (CLI-generated chains stay
length 1).

## Directory layout across agent tools

```text
.agents/skills/<name>/SKILL.md   ← authoritative definition (raw)
.claude/skills/<name>/SKILL.md   ← skill-ref (pointer)
.codex/skills/<name>/SKILL.md    ← skill-ref (pointer)
.gemini/skills/<name>/SKILL.md   ← skill-ref (pointer)
.github/skills/<name>/SKILL.md   ← skill-ref (pointer)
```

## Related

> See [docs/ToC.md](../../ToC.md) for the full docs index.
