# Documentation Hub — `docs/ToC.md`

> Structural index of all documentation in this repository.
> **One bullet per file.** Update only when files are added, moved, or removed.

---

## For users of `a2scaffold`

| Doc                    | What you'll find                                           |
| ---------------------- | ---------------------------------------------------------- |
| [usage.md](usage.md)   | CLI reference — flags, commands, quick start               |
| [skills.md](skills.md) | Skills management — `skill add`, `list`, `validate`, `ref` |
| [api.md](api.md)       | Programmatic API — `scaffold()`, `installSkill()`, etc.    |

## For contributors & AI agents

| Doc                                                                            | What you'll find                                                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [agents/workflows/scaffold.workflow.md](agents/workflows/scaffold.workflow.md) | End-to-end scaffold flow (diagram + steps)                                    |
| [agents/workflows/skill.workflow.md](agents/workflows/skill.workflow.md)       | End-to-end skill flow for all subcommands                                     |
| [agents/plan/](agents/plan/)                                                   | Co-planning docs (human + AI brainstorm). Format: `<yyyyMMdd>-<name>.plan.md` |

## Agent-operational knowledge (`.agents/`)

These live outside `docs/` but are linked here for discovery. See
[.agents/AGENTS.md](../.agents/AGENTS.md) for the full authority model.

| Doc                                                                   | What you'll find                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| [.agents/AGENTS.md](../.agents/AGENTS.md)                             | Pair-programming guide, directory authority, load order |
| [.agents/context/architecture.md](../.agents/context/architecture.md) | Canonical architecture overview                         |
| [.agents/context/conventions.md](../.agents/context/conventions.md)   | Coding & naming conventions                             |
| [.agents/context/js-tmpl.md](../.agents/context/js-tmpl.md)           | Handlebars template conventions                         |
| [.agents/context/skill-refs.md](../.agents/context/skill-refs.md)     | Skill-ref (pointer) file format & rules                 |
| [.agents/plan/DoD.md](../.agents/plan/DoD.md)                         | Definition of Done                                      |
| [.agents/plan/PDCA.md](../.agents/plan/PDCA.md)                       | PDCA methodology & templates                            |
| [.agents/plan/promotions.md](../.agents/plan/promotions.md)           | Append-only promotion log                               |

## Source entry points (not docs, but useful)

| Path                                       | Role                           |
| ------------------------------------------ | ------------------------------ |
| [../src/scaffold.js](../src/scaffold.js)   | Template rendering             |
| [../src/skills.js](../src/skills.js)       | Skills management & validation |
| [../src/templates.js](../src/templates.js) | Template discovery             |
| [../bin/cli.js](../bin/cli.js)             | CLI entry point                |
| [../templates/](../templates/)             | Bundled templates              |

---

## How to use this index

- **Looking for a topic?** Scan the tables above — one bullet per doc.
- **Writing a new doc?** Add a row here in the matching section.
- **Moving a doc?** Update the row here; other docs only link to ToC, not to each other.
- **Inline code references** (e.g. `src/skills.js#L32`) stay inline — don't route those through ToC.
