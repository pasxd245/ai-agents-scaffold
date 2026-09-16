# crawl4ai Reference

Use this reference when research requires browser-backed crawling, clean
Markdown extraction, or multi-page collection from a docs site.

## When to Use

Use `crawl4ai` when one or more of these are true:

- The page depends on JavaScript rendering.
- A docs site needs cleaner Markdown than a raw HTML fetch provides.
- The task requires crawling multiple related pages.
- The research note benefits from preserving headings, links, and readable
  page structure.

Do not use it by default for simple pages, local files, source code, package
metadata, or one-off URLs that built-in browsing/search tools can handle.

## Setup Checks

Do not install crawler tooling silently. First check what is already
available:

```bash
python3 --version
python3 -c "import importlib.util; print(importlib.util.find_spec('crawl4ai'))"
```

If `crawl4ai` is missing and crawling is important to the task, ask for
permission before installing or running setup.

Common setup commands:

```bash
pip install -U crawl4ai
crawl4ai-setup
crawl4ai-doctor
```

## Recursive Crawl Script

For multi-page crawling, prefer the bundled script:

```bash
python3 .agents/skills/research/scripts/crawl4ai_recursive.py \
  --url https://docs.example.com \
  --out .agents/tmp/crawls/example-docs \
  --max-depth 2 \
  --max-pages 25
```

If `--out` is omitted, the script reads `.a2scaffoldrc.json` from the
current working directory first, then `~/.a2scaffoldrc.json`, and falls
back to `.agents/tmp`. Default output is:

```text
<tmpDir>/crawls/<host>-<timestamp>/
```

The project default config is:

```json
{
  "tmpDir": ".agents/tmp",
  "research": {
    "crawler": {
      "maxDepth": 1,
      "maxPages": 20,
      "sameDomain": true
    }
  }
}
```

Relative `tmpDir` values resolve from the current working directory.
Command-line flags override crawler config defaults.

## Minimal Crawl

Use Markdown output for research notes unless the user asks for structured
fields.

```python
import asyncio
from crawl4ai import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun("https://example.com")
        print(result.markdown)

asyncio.run(main())
```

For configured crawls, use `BrowserConfig` and `CrawlerRunConfig`. Prefer
the smallest configuration needed for the target site.

## Source Ledger

For multi-page crawls, keep a source ledger while collecting evidence:

```markdown
## Sources

- [Title](URL) - publisher/project, retrieved YYYY-MM-DD. Relevance: ...
```

Record enough detail to connect each final finding back to its source.

## Fallbacks

When `crawl4ai` is unavailable or not worth installing, use:

- Built-in web/search tools.
- `curl` or similar CLI fetches when network access is allowed.
- Existing local docs, repo files, package metadata, or source code.
- User-provided source material when network access is unavailable.

State the fallback used if it affects confidence or coverage.
