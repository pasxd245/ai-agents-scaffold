# Round 14: Harden the skill audit and the text edges, for v0.2.1

**Status**: Planning
**Part of**: standalone
**Date started**: 2026-09-16
**Date completed**: —

## Goal

Fix what the `review-pr` skill's first run found and the author chose not to
ship in v0.2.0: the skill audit screens by file extension rather than content
and its heuristics abort benign installs, the research crawler reads a
different rc file than the CLI, and adopt splices LF into CRLF files. All are
bug fixes with no API change, so the target is the **v0.2.1 patch**.

Source of record:
[memory/2026-09-16-review-pr-first-run.md](../../memory/2026-09-16-review-pr-first-run.md),
"Need a design decision". The approach-level questions from the same day's
adversarial review (knowledge-base budget, root `AGENTS.md` shape, the
permission layer's real coverage) stay in
[Round 13 § Found by the pre-release adversarial review](Round_13.md#found-by-the-pre-release-adversarial-review-2026-09-16)
and are **not** in scope here, nor is that section's hardening batch; both
need a round of their own.

## Plan

Each step independently landable, each green.

- [ ] **Audit by content, not extension.** Decide text versus binary by
      sniffing the first few KB (no NUL byte, or a `#!` line) and keep the
      extension list as a fast path. Rate an opaque file `high` when it is
      executable or when the caller is the remote screen, so a registry
      install stops on it. Fixture: an extensionless hostile script.
- [ ] **Recalibrate the hidden-character and phrase patterns.** U+200C/D
      (ZWJ, compound emoji) drop to `medium` or are exempted next to emoji;
      `exec(` excludes `.exec(`; `.env` excludes `process.env`; "you are now"
      needs a following article or preposition. Add all to
      `benign-tooling-skill`.
- [ ] **One rc location.** Make `crawl4ai_recursive.py` probe the same
      candidates as `src/config/rc.js`, or move the crawler's defaults into
      `.a2scaffold/values.yaml`; update `crawl4ai.md` and the `a2scaffold`
      skill so the pool agrees on what the rc holds.
- [ ] **CRLF-aware adopt and merge.** Detect the file's dominant line ending
      and normalise the spliced block to it; let the heading anchor skip more
      than one blank CRLF line after frontmatter.
- [ ] **Bump to 0.2.1** once the four above are in; tag from `main`.

Nits from the same run, taken if a step touches the file anyway: `--adopt`
worded three ways; README tree incomplete at its own depth; audit sample in
`docs/skills.md` names a line the audit does not flag; stale comments in
`src/cli/commands/scaffold.js`; two tests point at a missing `base-output`
fixture; a symlinked source directory fails with an empty detail; no test
renders `decisions` and `programs` together.

## Do

—

## Check

- [ ] `pnpm check` green at each commit
- [ ] Hostile fixtures: extensionless script and oversized file stop a remote
      install without `--force`
- [ ] Benign fixture with compound emoji, `RegExp.exec`, `process.env.HOME`
      and "You are now ready" installs clean
- [ ] Crawler reads the rc the CLI documents, verified from a scratch repo
- [ ] `--adopt` on a CRLF stub yields a file with one line-ending style
- [ ] `/review-pr main` on the release branch before the `dev` PR

## Act

**Learnings**:

- ...

**Promotions**:

- [ ] → `templates/skills/review-pr` : after this round's review, decide
      whether the skill's generic core is ready for the pool
