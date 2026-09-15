# Skills Guide

a2scaffold can install, list, validate, audit, and reference [Agent Skills](https://agentskills.io/specification) in your project's `.agents/skills/` directory.

Skills are modular folders of instructions, scripts, and resources that AI agents discover and load on demand. a2scaffold provides lightweight skill management — install from local paths or GitHub, validate against the spec, and list what's installed. For registry search and auto-updates, see [Using with ecosystem tools](#using-with-ecosystem-tools).

## Quick start

```bash
# Install a skill from GitHub (full URL)
a2scaffold skill add https://github.com/anthropics/skills/tree/main/skills/pdf

# Install a local skill
a2scaffold skill add ./my-skill

# List installed skills
a2scaffold skill list

# Validate all installed skills
a2scaffold skill validate
```

## Commands

### `a2scaffold skill add <source>`

Install a skill into `.agents/skills/`.

**Source formats:**

| Format        | Example                                                 |
| ------------- | ------------------------------------------------------- |
| Built-in name | `my-skill`, `group/my-skill`                            |
| Local path    | `./my-skill`, `../shared/code-review`, `/absolute/path` |
| GitHub URL    | `https://github.com/owner/repo/tree/main/path/to/skill` |

Resolution order: explicit local paths and `https://github.com/...` URLs are used directly; otherwise, if `--from <registry>` is set the name is fetched from that registry; otherwise the name is looked up in the built-in pool at `templates/skills/`. Bare `owner/repo/path` shorthand is **not** accepted — use a full URL or a registry.

**From the built-in pool:**

Built-in names resolve under `templates/skills/`.

| Skill            | What it does                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a2scaffold`     | Teaches an agent to operate this CLI on your behalf — scaffolding, re-scaffolding, installing and screening skills. Install it in a scaffolded repo so the agent runs the right command instead of hand-writing `.agents/` files.  |
| `master-plan`    | Decomposes a non-trivial refactor into numbered, commit-sized phases with acceptance gates.                                                                                                                                        |
| `repo-explainer` | Explains a repository or subsystem with Mermaid diagrams that render natively in GitHub and VS Code.                                                                                                                               |
| `research`       | Investigates a topic and produces a sourced brief, crawling primary sources rather than answering from memory. Ships a crawler; `skill audit` reports its network access, which is expected — read the findings before installing. |

```bash
# Bare name — installs templates/skills/<name>/
a2scaffold skill add a2scaffold

# Nested name — preserves the path under skills/ (no built-in ships nested today)
a2scaffold skill add group/my-skill
```

Bare and nested names preserve the requested path: `skill add group/my-skill` lands at `.agents/skills/group/my-skill/`. Explicit paths and URLs use the source's basename instead.

`skill list`, `skill validate` and `skill audit` all recurse, so a nested skill is reported under its full name (`group/name`).

> **Do not group a skill you intend to project into a harness.** A harness
> skills directory is exactly one level — `.claude/skills/<skill-name>/SKILL.md`
> — so `skill ref` writing `.claude/skills/group/name/` produces a skill the
> harness never discovers. Grouping is safe for skills that stay in `.agents/`.
> See [harness behaviour](../.agents/context/harness-behaviour.md).

**From a local directory:**

```bash
a2scaffold skill add ./path/to/my-skill
```

The source must contain a valid `SKILL.md` with YAML frontmatter. The skill is copied into `.agents/skills/<basename>/`.

**From GitHub:**

```bash
a2scaffold skill add https://github.com/anthropics/skills/tree/main/skills/pdf
```

Requires `git` to be installed. Uses sparse checkout to download only the specified skill directory, not the entire repository.

**From a named registry (`.a2scaffoldrc`):**

Define registries in a `.a2scaffoldrc` config file, then reference them by name. The loader checks (in order):

- `<project>/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` or `<project>/.a2scaffoldrc.{json,yaml,yml}` (project — pick one)
- `~/.a2scaffold/.a2scaffoldrc.{json,yaml,yml}` or `~/.a2scaffoldrc.{json,yaml,yml}` (user home — pick one)

Project entries override user entries by registry name. Example `.a2scaffold/.a2scaffoldrc.yaml`:

```yaml
registries:
  anthropics:
    url: github:anthropics/skills
    path: skills
    ref: main
```

Or as JSON:

```json
{
  "registries": {
    "anthropics": {
      "url": "github:anthropics/skills",
      "path": "skills",
      "ref": "main"
    }
  }
}
```

```bash
a2scaffold skill add pdf --from anthropics
```

The skill name is appended to the registry's `path`, and the resolved tree (`anthropics/skills/skills/pdf` at `main`) is fetched via sparse checkout.

**Overwrite an existing skill:**

```bash
a2scaffold skill add ./updated-skill --force
```

Without `--force`, the command exits with an error if the skill already exists.

### `a2scaffold skill list`

List all installed skills with their names and descriptions.

```bash
a2scaffold skill list
```

Output:

```text
Installed skills:

  pdf
    Use this skill whenever the user wants to do anything with PDF files.
```

### `a2scaffold skill validate [name]`

Validate installed skills against the [agentskills.io specification](https://agentskills.io/specification).

```bash
# Validate all installed skills
a2scaffold skill validate

# Validate a specific skill
a2scaffold skill validate pdf
```

Checks each skill's `SKILL.md` for:

- Valid YAML frontmatter
- Required `name` field (1-64 chars, lowercase alphanumeric + hyphens, matches directory name)
- Required `description` field (1-1024 chars)
- Optional field constraints (`compatibility` max 500 chars)
- Skill-ref chains resolve: the target exists, there is no cycle, and the chain is at most 5 hops deep

Exits with code 1 if any skill is invalid. Output for each skill is shown as `✔ <name> [skill|skill-ref] — valid` or `✘ <name> [type] — invalid` followed by error details.

#### Conformance score

Alongside hard spec errors, validation reports the warnings behind a **0–100
guidance score**. A warning means the skill is well-formed but will work badly
— most often a description too vague for the model to match a task against:

```text
  ✔ create-template [skill] — valid, 99/100
    ! description is 29 words; 30+ helps the model match tasks to it reliably
  ✔ research [skill] — valid, 94/100
    ! description says what the skill does but not when to use it
```

Warnings checked: description length and whether it states _when_ to use the
skill, the 1,536-character listing cap on `description` + `when_to_use`, an
oversized or empty body (~5,000-token guidance), and unrecognised frontmatter
keys — which catches typos like `when-to-use` for `when_to_use`.

**Warnings never affect the exit code.** Only spec errors do. A vague skill is
still a valid one; the author just needs to know.

**The number is local guidance, not a rating.** The checks draw on the Agent
Skills specification, Claude Code's listing behaviour, Skilldex's conformance
guidance and local judgement in roughly equal measure, and the weights behind
the arithmetic are chosen, not calibrated. Two skills a point apart are not
meaningfully different, and 100 does not certify anything. Read the warnings;
treat the score as a rough ordering.

Build artefacts are not installed. A source skill is a working directory and
accumulates caches its own repo gitignores, but `cpSync` copies what is on disk
rather than what is tracked. `.git`, `node_modules`, `__pycache__`,
`.pytest_cache`, `.venv`, `.DS_Store` and compiled `.pyc`/`.pyo`/`.pyd` files
are excluded.

### `a2scaffold skill audit [name]`

Surface a few obvious risky patterns in installed skills. It is a prompt to read them, never a safety verdict.

```bash
# Audit all installed skills
a2scaffold skill audit

# Audit one
a2scaffold skill audit research
```

A skill runs with the **full permissions of the agent that loads it** — it
reaches your API keys, SSH credentials and shell. Published skills have a poor
safety record: Snyk's 2026 ToxicSkills audit of 3,984 skills found ~37%
carrying at least one security flaw and 76 with live malicious payloads.

The audit flags five categories:

| Category      | What it looks for                                                   |
| ------------- | ------------------------------------------------------------------- |
| `injection`   | Instruction-override phrasing; zero-width or bidi characters        |
| `credentials` | References to `~/.ssh`, `.env`, keychains, wallets, browser cookies |
| `execution`   | `eval`, `subprocess`, piping to a shell, base64 decoding            |
| `network`     | `curl`, `wget`, `fetch`, non-allowlisted URLs                       |
| `opaque`      | Symbolic links, binary or oversized files that cannot be screened   |

```text
  • research — 1 finding(s)
    [medium] scripts/crawl4ai_recursive.py:16 — reaches the network
```

These are **heuristics, not proof**. A crawler skill legitimately reaches the
network. The audit's job is to tell you where to look, and it exits 0 either
way.

Skills fetched over the network are screened automatically: `skill add` with
`--from <registry>` or a GitHub URL **aborts** on a high-severity finding.
Pass `--force` to install anyway once you have reviewed the source. Local
installs are not screened — you already have the files.

### What `validate` and `audit` do not check

Both commands are narrow on purpose, and neither certifies a skill. Know the
gaps before you rely on a green run:

- **`validate` does no security screening.** A spec-valid, 100/100 skill can
  still exfiltrate your keys. That is `audit`'s job, and only its job.
- **Neither checks harness discoverability.** Claude Code reads
  `<skills-dir>/<name>/SKILL.md` and nothing deeper, so a grouped skill at
  `.claude/skills/group/name/` is spec-valid and never loaded. Grouping is fine
  inside `.agents/`; a harness directory must be flat.
- **No file-existence check.** Links to `scripts/`, `references/` or
  `assets/` are not followed; a missing file is found at run time.
- **No name-uniqueness check.** Two skills named `research` at different
  nesting levels both validate.
- **No judgement of the instructions themselves.** Nothing decides whether a
  procedure is correct, complete or safe to follow, and nothing is executed in
  a sandbox to find out.
- **`audit` is pattern matching.** It reads text with regular expressions and
  can be evaded by anything it does not name. Local `skill add` is not
  screened at all — you already have the files, so read them.

### `a2scaffold skill ref --skill <name|all> --to <dir>`

Create lightweight **skill-ref** pointers in a destination agents directory that resolve back to skills installed in a source agents directory. Skill refs let multiple agent directories (`.claude`, `.github`, `.gemini`, …) share a single canonical skill source without duplicating files.

```bash
# Ref a single skill from .agents into .claude
a2scaffold skill ref --skill clean-code --to .claude

# Ref every skill from .agents into .github
a2scaffold skill ref --skill all --from .agents --to .github
```

**Flags:**

| Flag             | Required | Default   | Description                                             |
| ---------------- | -------- | --------- | ------------------------------------------------------- |
| `--skill <name>` | yes      |           | Skill name, or `all` to ref every skill under `<from>`  |
| `--to <dir>`     | yes      |           | Destination agents directory                            |
| `--from <dir>`   | no       | `.agents` | Source agents directory containing the canonical skills |
| `-f, --force`    | no       |           | Overwrite existing skill-refs at the destination        |

A skill-ref is a `SKILL.md` whose frontmatter `metadata.type` is `skill-ref` and whose body points to the canonical skill path. `skill validate` walks the ref chain and validates the terminal skill.

## Options

`-d, --agents-dir <dir>` (default `.agents`) applies to `skill add`, `skill list`, `skill validate`, and `skill audit`. `skill ref` uses `--from` and `--to` instead.

| Flag                 | Short | Default   | Applies to                 | Description                                                     |
| -------------------- | ----- | --------- | -------------------------- | --------------------------------------------------------------- |
| `--agents-dir <dir>` | `-d`  | `.agents` | add, list, validate, audit | Directory that holds `skills/` (e.g. `.agents`, `.claude`, `.`) |
| `--from <name>`      |       |           | add                        | Fetch from a registry defined in `.a2scaffoldrc.json`           |
| `--force`            | `-f`  |           | add, ref                   | Overwrite an existing skill or skill-ref                        |

### Skills kept outside `.agents/`

Every skill command reads `<dir>/skills/`, and `-d` names `<dir>`. A repo
that keeps its skills at the top level — `<root>/skills/<name>/SKILL.md`, the
layout of most published skill collections — is one flag away:

```bash
a2scaffold skill validate -d .                        # validate ./skills/*
a2scaffold skill audit -d .                           # screen them
a2scaffold skill ref --skill pdf --from . --to .claude   # expose one to a harness
```

Nothing is moved or rewritten. `skill ref` writes a pointer under
`.claude/skills/` whose path stays inside the repo, so it survives a clone
under another folder name. Ref skills into a harness directory one at a time:
harness skill directories are one level deep, and `--skill all` would also
project any grouped skill, which the harness never finds.

If you would rather have `.agents/` own a copy, `skill add ./skills/<name>`
copies the skill in. That is a choice, not a requirement; the tool does not
migrate layouts on its own.

## Skill format reference

Each skill is a directory containing at minimum a `SKILL.md` file:

```text
my-skill/
  SKILL.md          # Required — YAML frontmatter + instructions
  scripts/          # Optional — executable code
  references/       # Optional — additional docs
  assets/           # Optional — templates, data files
```

`SKILL.md` must include YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does and when to use it.
---
```

The `name` field must match the directory name. See the full [Agent Skills specification](https://agentskills.io/specification) for all fields and conventions.

## Using with ecosystem tools

a2scaffold's skill management is intentionally minimal — it handles install, list, validate, audit, and skill-ref creation. For advanced features, use ecosystem tools alongside a2scaffold:

- **[skills.sh](https://skills.sh/)** (Vercel) — `npx skills add owner/repo/skill` — registry search, auto-updates, supports 40+ agents
- **[gh-upskill](https://github.com/trieloff/gh-upskill)** — `gh upskill owner/repo` — install from GitHub with path filtering

After installing skills with external tools, run `a2scaffold skill validate` to verify they conform to the spec.
