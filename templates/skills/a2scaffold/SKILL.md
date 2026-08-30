---
name: a2scaffold
description: Operate the a2scaffold CLI on the user's behalf — scaffold or re-scaffold agent instruction files, install and screen skills, and create skill refs. Use whenever the user asks to set up, re-generate, update, or repair .agents/ and the harness stubs (CLAUDE.md, AGENTS.md, GEMINI.md, copilot-instructions.md), or to add, validate, or audit a skill.
metadata:
  author: a2scaffold
  version: '1.0'
---

## Trigger

Activate this skill when the user asks to:

- Set up agent instruction files in a repo, or re-generate them after an upgrade
- Add, install, validate, or audit a skill
- Share skills with another agents directory
- Repair `.agents/` or a harness stub that has drifted

Do **not** activate it to answer questions about what is _inside_ `.agents/`.
That is the knowledge base's job; this skill only operates the tool.

## The rule that matters most

**Render, never hand-write.** The whole point of `a2scaffold` is that
`.agents/` content comes from one versioned template. Writing those files from
memory reproduces the copy-pasted drift the tool exists to remove.

If the CLI cannot produce what the user wants, say so and stop. Do not
substitute your own file.

## Orient first

```bash
npx a2scaffold --version     # is it available at all?
ls .agents/ 2>/dev/null      # already scaffolded?
npx a2scaffold --list        # which templates exist
```

A repo with `.agents/AGENTS.md` is already scaffolded — you are doing an
**update**, which has different rules from a first run.

## Scaffolding

### First run

```bash
npx a2scaffold --dry-run              # always first
npx a2scaffold --name <project-name>
```

`--dry-run` prints the exact output paths, including files gated behind
`$if{...}` flags, so it is a true preview of what lands.

To change which harnesses are wired up, set the `agents.*` flags rather than
deleting files afterwards. Optional directories are flags too — `plan.decisions`
for `.agents/decisions/`, `plan.programs` for `.agents/plan/programs/`. Set the
flag and re-run; do not `mkdir` them by hand, or they arrive without the README,
template, and permission rules the flag brings with them.

Values come from the template's `values.yaml`, overridable per repo through
`.a2scaffold/.a2scaffoldrc.{json,yaml,yml}`.

### Updating an existing repo — reach for `sync` first

```bash
npx a2scaffold sync --dry-run   # report only
npx a2scaffold sync
```

`sync` creates missing files, refreshes managed regions, and leaves everything
else alone. Nothing it does can lose work, so it needs no `--force` and asks no
questions. **This is the right command for almost every update.** It also
installs cleanly into a repo that has never been scaffolded.

It reports two things it will not do on its own: a stub with no markers, and
`.claude/settings.json` when it has fallen behind. Both want a human decision —
relay them, do not work around them.

Reach for the full scaffold below only on a first run, or when the user
explicitly wants files replaced.

### Re-scaffolding an existing repo

Three categories of file behave differently, and confusing them destroys
work:

| File                                                                                  | On re-scaffold                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root stubs — `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md` | Carry a managed region (`<!-- a2scaffold:start -->` … `<!-- a2scaffold:end -->`). Only the fenced block is replaced; hand-written sections outside it survive. Not a conflict, needs no `--force`. |
| A stub that predates the tool, with no markers                                        | **Adopted** under `--force`: the generated block is inserted below the title and everything else the author wrote is kept. Happens once; the file then has markers and merges normally.            |
| Everything under `.agents/`                                                           | **No managed region, on purpose.** It is canonical and human-owned. Re-scaffolding reports it as a conflict and refuses without `--force`, which replaces it wholesale.                            |

So:

```bash
npx a2scaffold --dry-run   # see what would change
npx a2scaffold             # updates managed regions; exits 1 if canon conflicts
```

**Before ever passing `--force`**: read the CLI's own split. It lists what
would be _adopted_ (content kept) separately from what would be _overwritten_
(replaced wholesale) — and the second list includes anything the human curated
in `context/`, `memory/`, or `plan/`. Confirm with the user, naming the files
in the overwrite list specifically. If the repo is under git, check
`git status` is clean first so the change is recoverable.

Adopting a repo that already has agent files is the normal first run there,
not a dangerous one: `--force` is required, and no hand-written content is
lost.

A conflict list is information, not a failure. Report which files differ and
ask, rather than reaching for `--force` to make the error go away.

## Skills

### Installing

```bash
npx a2scaffold skill add <name>                    # built-in pool
npx a2scaffold skill add group/<name>              # nested built-in
npx a2scaffold skill add ./path/to/skill           # local directory
npx a2scaffold skill add https://github.com/...    # GitHub tree URL
npx a2scaffold skill add <name> --from <registry>  # named registry
```

Resolution is **local-only unless `--from` is given**. If a name does not
resolve, the fix is the printed one — do not silently reach for the network.

### Screen anything you did not write

A skill is executable instructions handed to an agent. Before installing from a
GitHub URL, a registry, or a directory the user did not author:

```bash
npx a2scaffold skill audit <name>
```

Audit reports supply-chain risks — unscoped tool grants, process execution,
network access, binaries shipped alongside the skill. It is a heuristic: read
the flagged lines before repeating its verdict. A scoped grant like
`Bash(grep *)` is least privilege done right, not a finding.

Report what it found and let the user decide. Do not install a flagged skill on
your own judgement.

### Authoring and checking

```bash
npx a2scaffold skill validate            # all skills
npx a2scaffold skill validate <name>     # one
npx a2scaffold skill list
```

`validate` reports both hard spec violations and a conformance score. A low
score does not block an install; it means the skill will trigger unreliably.
The usual causes are a description under ~30 words, or one that says what the
skill does without saying _when_ to use it.

### Sharing across directories

```bash
npx a2scaffold skill ref --skill all --from .agents --to .github
```

`skill ref` writes lightweight pointers, not copies — use it to expose the same
skills to a second harness. Use `skill add` when the destination needs its own
editable copy.

## Governance

`.agents/` has an authority model, and this skill does not exempt you from it.
Agents may write to `.agents/memory/` and append to `plan/promotions.md`;
`AGENTS.md`, `context/`, `reference/`, `prompts/` and `skills/` are read-only
without explicit human instruction. Running `a2scaffold --force` over canon is
a write to canon — same rule, so warn and confirm first.

Read `.agents/AGENTS.md` for the repo's own table; it is authoritative over
this file.

## Failure modes

| Symptom                            | Cause                                    | Do this                                                     |
| ---------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Exit 1, list of files              | Canon would be overwritten               | Report the list; ask before `--force`                       |
| Hand edits to a stub vanished      | Edits were _inside_ the managed region   | Move them below `<!-- a2scaffold:end -->`; recover from git |
| `skill 'x' not found locally`      | Name is not in the pool, and no `--from` | Use the printed suggestion; do not guess a registry         |
| Conditional file did not appear    | Its `agents.*` flag is false             | Set the flag in values, then re-run                         |
| Skill installed but never triggers | Weak description                         | `skill validate <name>`, fix what it reports                |
