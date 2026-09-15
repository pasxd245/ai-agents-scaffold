# Contributing

Three kinds of contribution land here: a scaffold template, a skill for the
built-in pool, or a change to the tool itself. The first two need no
JavaScript. All three go through the same gate: `pnpm check` passes, and the
commit message follows Conventional Commits.

## Before you start

```bash
pnpm install          # installs husky hooks too
pnpm check            # lint + format + typecheck + test — must be green
```

Requires Node.js >= 20 and pnpm. There is no build step.

## Scaffold templates

A scaffold template is a directory under `templates/scaffold/`. Nesting is
allowed and the path is the name: `templates/scaffold/shared/python/` is
selected with `--use shared/python`.

```text
templates/scaffold/<name>/
  template/         # Required. Mirrors the output tree; .hbs files only
  values.yaml       # Optional. Default variable values, commented
  values/           # Optional. Value partials, merged over values.yaml
  partials/         # Optional. Handlebars partials ({{> name}})
  README.md         # Optional. What the template generates and why
```

Only `template/` is required. If you add `partials/`, put a `.gitkeep` in it
when it would otherwise be empty — the renderer throws on a partials path that
does not exist.

### Files

- Every file in `template/` ends in `.hbs`; the extension is stripped on
  output. An empty `.gitkeep.hbs` renders to an empty `.gitkeep`.
- Content is Handlebars: `{{project.name}}`, `{{#if}}`, `{{#each}}`,
  `{{> partial}}`. Merged values plus `process.env` (as `env`) are the view.
- Do not format `.hbs` files with prettier; they are excluded because
  Handlebars is not valid markdown. Format the _rendered_ output instead, and
  see "Formatter-stable" below.

### Paths

Directory and file names carry their own small syntax, resolved by the
renderer before Handlebars ever runs:

| In a path              | Meaning                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `${project.name}`      | Interpolated anywhere in a segment; a missing value renders empty |
| `$if{agents.claude}/`  | Whole directory segment. Kept when truthy, pruned when falsy      |
| `$ifn{plan.programs}/` | The inverse: kept when falsy                                      |

Rules the renderer enforces, and that the tool's own path prediction mirrors:

- `$if{}` / `$ifn{}` must be a whole directory segment. A segment that merely
  contains one is an error, and so is a formula in filename position.
- A formula naming a variable absent from the view is an error, not a false.
  Declare every variable a formula uses in `values.yaml`.
- Present-but-falsy prunes the subtree. `false`, `0`, `''`, `null` and
  `undefined` all count as falsy.

The base template's stubs are a worked example:
`template/$if{agents.claude}/CLAUDE.md.hbs` renders to `CLAUDE.md` only when
`agents.claude` is set.

### Managed regions

Two kinds of generated file, and a template has to choose for each:

- **Managed** — a file the user is expected to edit around, such as a harness
  stub. Fence the generated part between `<!-- a2scaffold:start -->` and
  `<!-- a2scaffold:end -->`, each on its own line. Re-scaffold and `sync`
  replace only the fenced block; everything outside it is the author's.
- **Seeded** — written once, then the user's. Everything under `.agents/` in
  the base template. No markers, so nothing short of `--force` touches it.

Put the title outside the region so a project can name itself, and any
placeholder the user is told to replace outside it too — inside the region it
would be silently reverted on the next run.

### Formatter-stable

A test renders every stub in the base template and asserts prettier would
write it back unchanged. Anything a formatter insists on changing inside a
managed region becomes a permanent diff: the formatter adds it, the next
scaffold strips it. Check rendered output where this repo's prettier config
applies, not in `/tmp`, where prettier falls back to its defaults.

### Values

`values.yaml` is documentation as much as configuration. Comment every key.
Only include keys the template actually reads. Users layer their own values
over yours from `<project>/.a2scaffold/values.yaml`, and `--name` over both.

### Try it, then test it

```bash
node bin/a2scaffold --use <name> --output /tmp/try --dry-run   # what would land
node bin/a2scaffold --use <name> --output /tmp/try             # render it
node bin/a2scaffold sync --use <name> --output /tmp/try        # must be a no-op
```

Then add a test in `tests/scaffold.test.js` that scaffolds the template and
asserts what it must produce. Templates are verified by rendering, not by
reading.

### Checklist

- [ ] `template/` exists and every file in it ends in `.hbs`
- [ ] Every variable a path formula or `{{ }}` uses is declared in `values.yaml`
- [ ] Renders with default values; `--dry-run` lists what the render writes
- [ ] A second run is a no-op, and `sync` reports nothing to do
- [ ] Stubs meant to be edited carry a managed region; seeds do not
- [ ] Rendered stubs are formatter-stable
- [ ] Extends the base `.agents/` layout rather than replacing it
- [ ] A test in `tests/scaffold.test.js`

## Skills for the built-in pool

Skills under `templates/skills/<name>/` ship with the package and install by
name: `a2scaffold skill add <name>`. Each is a directory with a `SKILL.md`
whose frontmatter follows the
[Agent Skills specification](https://agentskills.io/specification) — `name`
matching the directory, and a `description` that says when to use it.

Pool skills are plain markdown and are copied verbatim into user repos, so
they are linted and formatted at the source like any other file here. A test
holds every pool skill to a full conformance score and a clean supply-chain
audit:

```bash
node bin/a2scaffold skill validate <name> --agents-dir templates
node bin/a2scaffold skill audit <name> --agents-dir templates
```

## Changes to the tool

- **Built-ins over dependencies.** Two production dependencies. Proposing a
  third is a discussion to open, not a line to add.
- **Every change lands green.** One reviewable step per commit; `pnpm check`
  passes at each.
- **Non-destructive by contract.** A change to `scaffold`, `sync` or skill
  installation that could touch an existing file needs a test showing what it
  refuses to do, not only what it does.
- **Docs move with code.** `docs/api.md` describes every root export and a
  test pins that list; CLI help, `README.md` and `docs/usage.md` use the same
  wording for the same flag.

## Commits

Conventional Commits, enforced by commitlint on the commit hook:
`feat(scaffold): …`, `fix(skills): …`, `docs(.agents): …`. The body says why,
in prose; the diff already says what. A pre-commit hook runs prettier,
eslint and markdownlint on staged files.

## Working with an AI agent

This repo is scaffolded with itself. `.agents/AGENTS.md` is the knowledge base
an agent loads, and its authority table says which paths an agent may write:
`.agents/memory/` freely, `.agents/plan/` within limits, everything else in
`.agents/` only after a human authorises it. Contributions drafted with an
agent are welcome; say so in the PR, and keep the human-owned canon
human-edited.
