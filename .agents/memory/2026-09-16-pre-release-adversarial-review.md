# Pre-release adversarial review of v0.2.0: what broke, what is overbuilt

**Date**: 2026-09-16
**Agent**: Claude Code (three independent passes: premise, CLI as a stranger,
security and governance)
**Confidence**: High for the reproduced defects; Medium for the approach
verdicts, which are one reviewer's reading of the evidence
**Status**: New
**Source**: requested before tagging v0.2.0 with the brief "assume the repo may
be in a wrong approach". Every claim below was verified against the code or
reproduced with the CLI in a scratch directory.
**Review-by**: 2027-03-01 (the approach findings should be re-read against the
next practice survey)

## Problem

The release plan covered the version number, root-level skills and the depth
of `skill validate`. It did not ask whether the product is right. This is the
strict pass: defects a stranger hits in the first hour, security claims that
do not hold, and premises that may be wrong.

## Finding

### Fixed before the tag (2026-09-16)

- `--adopt` de-indented the first line after the title and turned an indented
  example marker into a live one; CRLF files never matched the marker regex,
  so a re-scaffold adopted a second block. Both data loss; both reported as
  "content kept". Fixed with tests.
- Every template view carried `process.env`. A `{{env.TOKEN}}` in any
  template, including one passed with `--use`, rendered a secret into a
  committed file. Removed.
- `--dry-run` listed paths and exited 0 on a repo the real run then refused;
  `--force` never named the canon files it replaced. Dry-run now reports the
  real split; the banner lists `Replaced wholesale, edits lost`.
- The audit said "nothing flagged" and stopped. It now says a clean result is
  not a verdict. README and `AGENTS.md` no longer claim the permission layer
  is one an agent cannot ignore.
- Help examples named a template and a nested skill that do not exist.

### Approach-level, for the next round

1. **The generated knowledge base spends its budget on itself.** A fresh
   scaffold renders 1,326 lines; the per-session load is `CLAUDE.md` plus
   `.agents/AGENTS.md`, 146 lines, none about the user's project.
   `AGENTS.md` is 97 lines against its own "keep under 100" rule, so a user
   has 2 lines before breaking it. The dogfood repo hit the same disease
   ("cold start was 878 lines"). Candidate: a ~20-line KB; everything else
   behind `reference/` triggers.
2. **`.agents/AGENTS.md` is a second AGENTS.md, not an abstraction.** The
   field standard is root `AGENTS.md`. The tool makes the root file a stub
   whose payload is `@.agents/AGENTS.md`, which only Claude Code and Gemini
   expand. Round 13 built the standard shape first and rejected it on taste.
   Candidate: root `AGENTS.md` is canon; `CLAUDE.md` imports it; `.agents/`
   keeps `context/`, `memory/`, `skills/`.
3. **The headline guarantee is untested and Edit-only.** The `ask` rules cover
   the `Edit` tool in interactive sessions. Bash, Write, `mv` and `git
checkout` bypass them; this session edited canon through a shell with no
   prompt. Candidate: a PreToolUse hook or `deny` rules on the canon paths,
   plus one live test in a fresh session, or keep the honest wording and
   stop calling it enforcement.
4. **Governance is mostly paperwork about itself.** Three memory files, none
   promoted through the memory path; the promotions log's recent entries are
   authorised exceptions to the rule it enforces; one compaction ever; the
   skills-as-installable-unit falsification test from May was never scored.
   Candidate: base template = `context/`, `memory/`, `skills/`,
   `settings.json`; PDCA, DoD, cycles, prompts become `--use pdca`.
5. **Seeded-once canon rots.** `harness-behaviour.md` is dated, volatile
   third-party fact seeded into user repos that `sync` never updates. A
   0.1.x user gets 0.2.0 text only through `--force`. Candidate: split
   template-owned files (managed region or `.agents/_upstream/`) from
   user-owned ones.
6. **Naming a stranger cannot guess.** `.agents/` beside `AGENTS.md`; two
   config files with different shapes; `--from` meaning registry in one
   command and directory in another; `-d` meaning "holds `skills/`";
   `init`/default/`sync`/`--adopt`/`--force` as five ways to install.
   Renames are free before 1.0 and impossible after.
7. **The skills half has one wedge and does not say it.** Against
   `npx skills add`, the only things this does that it does not are `skill
ref` and `audit` on network installs. Either headline the projection
   story or cut `add`/`list`.

### Behaviour-level, for the next round

- `skill ref --skill all` writes refs until the first collision and stops,
  leaving the destination half-written, and silently projects `group/name`
  into a harness dir that never loads it. Pre-flight, then write; warn or
  refuse on nested names when the target is a harness dir.
- `sync` never reports an orphaned generated file after a flag is turned off
  (`agents.copilot: false` leaves `.github/copilot-instructions.md` and says
  "everything up to date").
- `skill validate -d <missing>` and `skill list -d <missing>` exit 0; `audit`
  exits 1. A typo in CI passes green.
- `skill list` prints the frontmatter name, `validate` and `audit` print
  `group/name`; the docs promise the full name everywhere.
- Scaffold on a file with broken markers says "use `--force`" with no reason;
  `sync` on the same file names the ambiguity. Same reason in both.
- Unknown keys in `.a2scaffold/values.yaml` are ignored without a warning.
- `a2scaffold skill` with no action prints help and exits 0.
- The audit's network gate blocks only `high`. Three evasive skills
  (credential theft by split strings, `git clone` then `./install.sh`,
  paraphrased injection) audited clean or medium and would install from a
  registry with no `--force`. Candidate: refuse on any finding by default.
- Registry refs float on a branch (`ref: main`); no SHA pinning, no
  recorded commit, so a reviewed-clean skill can change under the same
  command. Candidate: accept full SHAs, warn on branches, record the
  resolved commit beside the install.
- `js-yaml.load` runs on downloaded frontmatter; safe on v4's default
  schema, which is load-bearing and uncommented.
- `@nci-gis/js-tmpl` is first-party and pulls `handlebars` and `config`;
  the "two production deps" count understates the surface.
- One memory file hard-codes `/home/ubuntu/pf/...`; the git remote embeds a
  token (not printed; rotate it).
- `context/philosophy.md` cites `templates/skills/planning/master-plan/` as
  an example path that cannot exist for a projectable skill. Human fix.

## Evidence

- Files: `src/scaffold/managed-region.js`, `src/scaffold/index.js`,
  `src/cli/commands/scaffold.js`, `src/skills/audit.js:64-94`,
  `src/skills/ref.js`, `src/skills/resolve.js:71`, `src/utils/download.js`,
  `.claude/settings.json`, `templates/scaffold/base/template/.agents/AGENTS.md.hbs`
- Commits fixing the first block: `66b1641`, `e28bff7`, `5747ad5`, `e68b58a`
- Reproductions were run under a scratch directory and are described inline;
  the three evasive skills are the ones to keep as fixtures if the gate
  changes.

## Recommendation

**Do**: treat the approach list as Round 14's "Needs a decision" section, in
the order above. Items 1 to 3 change what every user loads or trusts; they are
worth a decision before more features.
**Don't**: fix the behaviour list piecemeal inside feature commits. Each is
small; batch them as a hardening round with a test per item, the way the
2026-09-15 items were done.

## Promotion candidate?

- [ ] `context/` — not yet; the approach verdicts need a human reading and a
      second data point (the `_AICowork_` adoption is the natural one).
- [ ] `skills/` — no procedure here.
- [x] `plan/` — Round 14 backlog. Pointer added to Round 13.
