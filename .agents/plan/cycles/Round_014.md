# Round 14: Harden the skill audit and the text edges, for v0.2.1

**Status**: Review
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
[Round 13 § Found by the pre-release adversarial review](Round_013.md#found-by-the-pre-release-adversarial-review-2026-09-16)
and are **not** in scope here, nor is that section's hardening batch; both
need a round of their own.

## Plan

Each step independently landable, each green.

- [x] **Audit by content, not extension.** Decide text versus binary by
      sniffing the first few KB (no NUL byte, or a `#!` line) and keep the
      extension list as a fast path. Rate an opaque file `high` when it is
      executable or when the caller is the remote screen, so a registry
      install stops on it. Fixture: an extensionless hostile script.
- [x] **Recalibrate the hidden-character and phrase patterns.** U+200C/D
      (ZWJ, compound emoji) drop to `medium` or are exempted next to emoji;
      `exec(` excludes `.exec(`; `.env` excludes `process.env`; "you are now"
      needs a following article or preposition. Add all to
      `benign-tooling-skill`.
- [x] **One rc location.** Make `crawl4ai_recursive.py` probe the same
      candidates as `src/config/rc.js`, or move the crawler's defaults into
      `.a2scaffold/values.yaml`; update `crawl4ai.md` and the `a2scaffold`
      skill so the pool agrees on what the rc holds.
- [x] **CRLF-aware adopt and merge.** Detect the file's dominant line ending
      and normalise the spliced block to it; let the heading anchor skip more
      than one blank CRLF line after frontmatter.
- [x] **Take js-tmpl 0.1.3 and js-yaml 4.3.2.** Added 2026-09-27, after the
      four above. Both are security patches with no API change and no Node
      floor change, which is what a 0.2.1 can carry. js-tmpl 0.2.0, released
      the same day, is breaking (Node 22, `${missing}` throws, `planRender`)
      and gets a round of its own.
- [x] **Bump to 0.2.1** once the four above are in; tag from `main`.

Nits from the same run, taken if a step touches the file anyway: `--adopt`
worded three ways; README tree incomplete at its own depth; audit sample in
`docs/skills.md` names a line the audit does not flag; stale comments in
`src/cli/commands/scaffold.js`; two tests point at a missing `base-output`
fixture; a symlinked source directory fails with an empty detail; no test
renders `decisions` and `programs` together.

## Do

Four commits on `fix/audit-and-text-edges`, each green on its own.

1. **Audit by content.** The screen read a file only when its extension was on
   a list, so renaming `setup.sh` to `setup` filed a hostile script under
   "binary or unreadable". Content decides now, on git's heuristic. Opaque
   findings also gained the right weight: medium locally, where you already
   have the files, high through the remote screen and high for anything
   executable. New `opaque-skill` fixture covers both branches.
2. **Recalibration.** `.env` no longer matches `process.env`, `exec(` no
   longer matches `.exec(`, "you are now" now needs an article or
   preposition, and U+200C/D left the high-severity class so a compound emoji
   is not reported. Each loosening ships with a positive control, because a
   recalibration that only widens the gate cannot be told from deleting the
   rule.
3. **One rc.** Larger than planned. The two readers disagreed about *where*
   the file lives — the crawler could not see the documented `.a2scaffold/`
   form at all — and also about *what* it holds: `mergeRc` built its result
   from scratch and copied only `registries`, so this repo's own rc, which
   contains `tmpDir` and `research` and nothing else, was read and discarded
   in full. Both fixed; both docs corrected, including the `a2scaffold`
   skill's claim that the rc "holds skill registries only".
4. **CRLF.** Adopt and merge now splice at the file's own line ending. The
   heading anchor also could not see past a second blank CRLF line, so the
   generated block landed above the author's heading — the one thing adoption
   promises not to do.

**Nits**: not taken. None of the four commits touched the files they live in,
which was the condition for taking them.

5. **Dependency patches** (2026-09-27). The lockfile carried handlebars 4.7.8
   and js-yaml 4.1.1, and `pnpm audit --prod` named eight handlebars
   advisories (one critical, CVE-2026-33937, JavaScript injection via AST
   type confusion) and four js-yaml ones (quadratic CPU via merge keys).
   js-tmpl 0.1.3 raises both; a2scaffold's own direct js-yaml range moved to
   `^4.3.2` in the same commit. Templates are trusted input, but the skill
   audit and the rc reader parse YAML fetched from registries, and a critical
   in the lockfile does not ship under a patch tag. Production audit is clean
   after the bump; the remaining advisories are all in dev tooling.

   Checked on the way: the a2scaffold suite against js-tmpl **0.2.0** on
   Node 22 is 250 / 251. The one failure is the `${missing}` test in
   `tests/output-paths.test.js`, exactly the semantics 0.2.0 changed, so the
   path mirror is now wrong for 0.2.0 and right for 0.1.x. That, the Node 22
   floor and the `planRender` prototype are the scope of the next round, not
   this one.

**Not done**: the release itself. On 2026-09-16 `git push` failed on
certificate verification behind a TLS-intercepting proxy; it went through on
a later network and the branch is on `origin`. No tag exists yet. Tagging
from `main` is a human's.

## Check

- [x] `pnpm check` green at each commit — 251 tests, 0 failures
- [x] Hostile fixtures: extensionless script and oversized file stop a remote
      install without `--force` — **verified at the audit level only.** Both
      now score `high` under `{ remote: true }`, which is what
      `screenRemoteSkill` refuses on. That `installSkill` itself aborts is not
      tested: screening runs only on network installs, which the suite cannot
      reach without mocking the transport
- [x] Benign fixture with compound emoji, `RegExp.exec`, `process.env.HOME`
      and "You are now ready" installs clean — one finding remains, the
      `subprocess.check_output` on line 7 that an existing test asserts must
      be flagged
- [x] Crawler reads the rc the CLI documents, verified from a scratch repo —
      both readers resolve the same `.a2scaffold/.a2scaffoldrc.json` and both
      refuse the same conflicting pair
- [x] `--adopt` on a CRLF stub yields a file with one line-ending style —
      and with the generated block below the author's heading, including past
      two blank CRLF lines
- [x] `pnpm audit --prod` reports no known vulnerabilities after the
      dependency patches; `pnpm check` green, 251 tests
- [ ] `/review-pr main` on the release branch before the `dev` PR — not
      yet run. It was blocked while nothing could be pushed; the branch is on
      `origin` now, so it is simply the next step

## Act

**Learnings**:

- ...

**Promotions**:

- [ ] → `templates/skills/review-pr` : after this round's review, decide
      whether the skill's generic core is ready for the pool
