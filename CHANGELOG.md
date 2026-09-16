# Changelog

All notable changes to this project will be documented in this file.


## [0.2.0] - 2026-09-16

### Features

- *(skills)* Score SKILL.md conformance in skill validate
- *(skills)* Add skill audit for supply-chain screening
- *(.agents)* Promote the memory-placement rule from dogfooding
- *(scaffold)* Make re-scaffolding non-destructive
- *(.agents)* Date the harness facts, bound the cycle log, age memories
- *(scaffold)* Opt-in planning surface, and give the author the title
- *(skills)* Populate the built-in pool, and fix what publishing exposed
- *(skills)* Install a2scaffold into this repo, and format the pool at source
- *(scaffold)* Adopt existing agent files instead of destroying them
- *(scaffold)* Add `sync`, an update that cannot lose work
- *(pool)* Teach the a2scaffold skill to review every skill in a repo
- *(scaffold)* Preview the real conflict split, and name what --force replaced
- *(skills)* Add review-pr, a pre-review skill tuned to this repo

### Bug Fixes

- *(.agents)* Apply dogfood findings and write CoSF into philosophy
- *(skills)* Exclude build artefacts when installing a skill
- *(scaffold)* Require managed-region markers to own their line
- *(scaffold)* Stop the generated region fighting the formatter
- *(scaffold)* Close the gaps a pre-review found in the safety contract
- *(scaffold)* Close the second review's findings on markers, installs and exports
- *(skills)* Anchor skill-ref paths at the common root of source and destination
- *(pool)* Point the a2scaffold skill at the values file, not the rc
- *(scaffold)* Keep indentation on adopt and recognise CRLF markers
- *(scaffold)* Stop rendering the process environment into templates
- *(skill-ref)* Let --force replace a stale pointer
- *(cli)* Keep flags placed before the sync command word
- *(scaffold)* Report a byte-identical managed stub as current
- Treat a UTF-8 BOM as an encoding mark, not as content
- *(skill-add)* Refuse a name that climbs out of the skills directory
- *(tmpl)* Stop asserting a guardrail the repo opted out of

### Refactoring

- *(tmpl)* [**breaking**] Make .agents/AGENTS.md the single knowledge base
- *(.agents)* Cut the knowledge base to 88 lines and fix the load order
- *(scaffold)* Cut source comments to contract and rationale

### Documentation

- *(.agents)* Log Round 13 and the v0.2.0 backlog
- *(agents)* Capture the 2026-08-29 practice survey as a re-measurable baseline
- *(.agents)* Record the round's decisions, and one harness fact
- Bring CONTRIBUTING and the Round 13 record up to the code
- Put the working model at the front door
- *(skills)* Say what -d means, and what validate and audit do not check
- Add the upgrade note for 0.1.x repos
- *(.agents)* Record the v0.2.0 decisions in Round 13 and memory
- *(.agents)* Park a skillsDir rc key as a v0.2.x candidate
- Say what the audit and the permission layer actually cover
- *(.agents)* Record the pre-release adversarial review as Round 14 material
- *(tmpl)* State enforcement per harness, not as a Claude Code fact
- *(tmpl)* Ship the flat skills-directory rule in the harness doc
- *(contributing)* The process environment is not in the view
- Match the dry-run listing, rc locations and API tables to the code
- *(.agents)* Record the review-pr first run and its open findings
- *(.agents)* Bring canon back in line with the code (authorised)
- *(plan)* Open Round 14 for the v0.2.1 hardening batch

### Miscellaneous

- Bring this repo's own stubs under management
- *(release)* Run the full quality gate before publishing
- *(skills)* Project review-pr into .github/skills like the other five

## [0.1.0] - 2026-05-07

### Features

- *(templates)* Add Gemini instructions and fix AGENTS.md path
- *(skills)* Add skill ref command for lightweight skill references
- Make partials optional, add skill-ref files, and extract shared partials
- *(skills)* Phase 7 — skill-ref chain validation
- *(skills)* Add master-plan and repo-explainer skills
- *(tmpl)* Gate agent files by $if{agents.*} flags
- *(skills)* Add research skill with crawl4ai crawler
- *(scaffold)* Namespace templates and add skill registry support
- *(config)* Add project values file and tidy rc layout

### Bug Fixes

- *(docs)* Correct relative path to .agents/AGENTS.md in AGENTS.md

### Refactoring

- *(cli)* Phase 2 — rename bin/cli.js → bin/a2scaffold
- *(cli)* Phase 3 — split src/cli/ into per-command files
- *(skills)* Phase 4 — split src/skills.js into per-concern files
- *(layout)* Phase 5 — final folder-barrel layout
- *(tmpl)* Parameterize kb_path and relocate Gemini instructions
- *(skills)* Use metadata.skillPath as canonical ref pointer

### Documentation

- Phase 6 — uplift paths after layout refactor

### Miscellaneous

- Phase 1 — tooling baseline + docs scaffolding
- Phase 1.5 — type-check baseline (JSDoc + checkJs)
- *(tsconfig)* Include node types
- Enforce Conventional Commits via commitlint
- *(.agents)* Compact PDCA cycles and refresh prompts

## [0.0.2] - 2026-03-18

### Bug Fixes

- *(agents)* Align prompt files with authority rules and add consistent frontmatter
- *(templates)* Sync base template with .agents/ updates and normalize titles
- *(ci)* Comment out unused NPM_TOKEN env in release workflow

### Documentation

- *(agents)* Add prompt conventions to context and log promotion

### Miscellaneous

- Add tmp/temp to gitignore and .codex scaffold to base template

### Reverted

- *(ci)* Restore NPM_TOKEN env in release workflow

## [0.0.1] - 2026-03-06

### Features

- Init base structure
- Build a2scaffold CLI tool with PDCA tracking and Agent Skills spec
- Add skill subcommand for install, list, and validate

### Bug Fixes

- *(ci)* Correct pnpm --if-present flag position for build step
- *(ci)* Pass NPM_TOKEN for npm publish authentication
- *(publish)* Add repository metadata for npm provenance validation

### Refactoring

- Move AGENTS.md into .agents/ to avoid Codex conflict
- Rename CLI flag --template/-t to --use/-u

### Documentation

- Add API/usage docs and planning cycles
- Separate skills guide from CLI usage docs
- *(ci)* Add inline comments to release workflow for maintainability

### Miscellaneous

- Add release pipeline with git-cliff and CI workflow
- Harden release workflow with main-branch guard and quality gate parity
- Improve npm keywords for discoverability
<!-- generated by git-cliff -->
