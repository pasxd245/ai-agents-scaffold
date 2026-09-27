# `.prettierignore` hides the source but not the render, so templates ship unformatted

**Date**: 2026-09-24
**Agent**: Claude Code (Opus 5)
**Confidence**: High
**Status**: New
**Source**: Enabling `plan.decisions` and `plan.programs` on this repo — the
first sync made `pnpm check` fail on files the tool had just written
**Review-by**: `n/a` — depends on this repo's own code and config, and fails
loudly when wrong

## Problem

Turning on two optional surfaces and running `a2scaffold sync` produced four
new files. `pnpm check` then failed `format:check` on three of them. The tool
wrote files into its own repository that its own quality gate rejects.

## Finding

`.prettierignore` excludes `templates/**/*.hbs`, so no `.hbs` file has ever
been formatted. Rendered output lands in `.agents/`, which prettier **does**
see. The ignore rule is asymmetric: it silences the source and not the render.

Consequence: any repo that enables one of these surfaces, runs prettier, and
commits gets a dirty tree on first sync — from files it did not write.

The same `.prettierignore` already contains the correct reasoning, applied to
a different directory:

> `templates/scaffold/**/*.md` — "Pool skills under `templates/skills/` are
> plain markdown, installed verbatim into user repos where prettier does see
> them — **formatting them at the source keeps the two copies identical**."

That argument covers `.hbs` files with no handlebars expressions exactly as
well, and was not applied to them.

## Evidence

Copying every `templates/scaffold/**/*.md.hbs` to a scratch directory as
`.md` and running `prettier --check` fails **7 of them**. Five contain no
`{{` at all, so their render is byte-identical to the source and the failure
is unambiguous:

| Template                                       | `{{` count | Fixed here |
| ---------------------------------------------- | ---------- | ---------- |
| `$if{plan.decisions}/…/decisions/README.md`    | 0          | ✅ yes     |
| `$if{plan.decisions}/…/decisions/_TEMPLATE.md` | 0          | ✅ yes     |
| `$if{plan.programs}/…/programs/_TEMPLATE.md`   | 0          | ✅ yes     |
| `.agents/context/memory-placement.md`          | 0          | ❌ no      |
| `.agents/prompts/reflect-agents.prompt.md`     | 0          | ❌ no      |
| `.agents/context/harness-behaviour.md`         | 6          | ❌ no      |
| `.agents/AGENTS.md`                            | 8          | ❌ no      |

Violations are markdown table padding and `*emphasis*` where prettier wants
`_emphasis_` — cosmetic individually, blocking as a gate.

Only the three that this session's change made appear were fixed, by copying
the rendered-and-formatted file back over its source. The other four are
untouched on purpose: they are pre-existing, unrelated to the change in hand,
and two of them carry handlebars expressions that prettier cannot be trusted
to reformat safely.

Side observation, not investigated: this repo's own `.agents/` copies pass
`format:check`, so for those four the repo copy and the template have already
drifted. Whether that drift is only formatting is unverified.

## Recommendation

**Do**: format a markdown template at source whenever it contains no
handlebars expression, and check it with the same gate as the rest of the
repo. The rendered file is the source, byte for byte.

**Don't**: rely on `.prettierignore` to mean "this file's formatting does not
matter". It means "prettier will not look here" — and the render is somewhere
prettier does look.

## Promotion candidate?

- [ ] `context/` — not yet. It is one repo, one config file, seen once
- [x] Not yet — but it needs a **round**, not a promotion. Candidate scope:
      narrow the ignore rule to `.hbs` files that actually contain `{{`, or
      add a check that renders the base template to a temp directory and runs
      `format:check` over the output. The second catches the whole class
      instead of the four known instances
