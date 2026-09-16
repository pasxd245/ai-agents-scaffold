#!/usr/bin/env python3
"""Recursively crawl pages with crawl4ai and save Markdown outputs."""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urldefrag, urljoin, urlparse


DEFAULT_CONFIG: dict[str, Any] = {
    "tmpDir": ".agents/tmp",
    "research": {
        "crawler": {
            "maxDepth": 1,
            "maxPages": 20,
            "sameDomain": True,
        }
    },
}


@dataclass(frozen=True)
class PageResult:
    index: int
    url: str
    title: str
    depth: int
    path: Path
    status: str


def deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    result = dict(base)
    for key, value in override.items():
        if (
            isinstance(value, dict)
            and isinstance(result.get(key), dict)
        ):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_config(cwd: Path) -> dict[str, Any]:
    config = DEFAULT_CONFIG
    for candidate in [cwd / ".a2scaffoldrc.json", Path.home() / ".a2scaffoldrc.json"]:
        if candidate.exists():
            with candidate.open("r", encoding="utf-8") as file:
                return deep_merge(config, json.load(file))
    return DEFAULT_CONFIG


def crawler_config(config: dict[str, Any]) -> dict[str, Any]:
    research = config.get("research", {})
    if not isinstance(research, dict):
        return {}
    crawler = research.get("crawler", {})
    return crawler if isinstance(crawler, dict) else {}


def parse_args(config: dict[str, Any]) -> argparse.Namespace:
    crawler = crawler_config(config)
    parser = argparse.ArgumentParser(
        description="Recursively crawl pages with crawl4ai and save Markdown files."
    )
    parser.add_argument("--url", required=True, help="Start URL to crawl.")
    parser.add_argument(
        "--out",
        help="Output directory. Defaults to <tmpDir>/crawls/<host>-<timestamp>.",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=int(crawler.get("maxDepth", 1)),
        help="Maximum link depth to crawl. Default comes from .a2scaffoldrc.json.",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=int(crawler.get("maxPages", 20)),
        help="Maximum pages to save. Default comes from .a2scaffoldrc.json.",
    )
    domain_default = bool(crawler.get("sameDomain", True))
    domain_group = parser.add_mutually_exclusive_group()
    domain_group.add_argument(
        "--same-domain",
        dest="same_domain",
        action="store_true",
        default=domain_default,
        help="Only crawl URLs on the start URL's domain. Default.",
    )
    domain_group.add_argument(
        "--no-same-domain",
        dest="same_domain",
        action="store_false",
        help="Allow crawling links outside the start URL's domain.",
    )
    parser.add_argument(
        "--include",
        action="append",
        default=[],
        help="Regex URL allowlist. May be passed multiple times.",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Regex URL blocklist. May be passed multiple times.",
    )
    return parser.parse_args()


def normalize_url(url: str) -> str:
    clean, _fragment = urldefrag(url)
    parsed = urlparse(clean)
    if parsed.scheme not in {"http", "https"}:
        return ""
    return clean.rstrip("/")


def default_out_dir(config: dict[str, Any], start_url: str, cwd: Path) -> Path:
    tmp_dir = Path(str(config.get("tmpDir", ".agents/tmp"))).expanduser()
    if not tmp_dir.is_absolute():
        tmp_dir = cwd / tmp_dir
    host = urlparse(start_url).netloc or "crawl"
    safe_host = re.sub(r"[^a-zA-Z0-9.-]+", "-", host).strip("-") or "crawl"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return tmp_dir / "crawls" / f"{safe_host}-{timestamp}"


def title_from_markdown(markdown: str, fallback: str) -> str:
    for line in markdown.splitlines():
        match = re.match(r"^#\s+(.+)", line.strip())
        if match:
            return match.group(1).strip()
    path = urlparse(fallback).path.rstrip("/").split("/")[-1]
    return path or urlparse(fallback).netloc or "untitled"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "page"


def page_links(result: Any, base_url: str) -> list[str]:
    links = getattr(result, "links", None)
    collected: list[str] = []
    if isinstance(links, dict):
        for group in links.values():
            if isinstance(group, list):
                for item in group:
                    href = item.get("href") if isinstance(item, dict) else None
                    if href:
                        collected.append(urljoin(base_url, href))
    return collected


def url_allowed(
    url: str,
    start_host: str,
    same_domain: bool,
    include_patterns: list[re.Pattern[str]],
    exclude_patterns: list[re.Pattern[str]],
) -> bool:
    parsed = urlparse(url)
    if same_domain and parsed.netloc != start_host:
        return False
    if include_patterns and not any(pattern.search(url) for pattern in include_patterns):
        return False
    return not any(pattern.search(url) for pattern in exclude_patterns)


def write_page(
    pages_dir: Path,
    index: int,
    url: str,
    depth: int,
    markdown: str,
) -> PageResult:
    title = title_from_markdown(markdown, url)
    filename = f"{index:03d}-{slugify(title)}.md"
    path = pages_dir / filename
    retrieved = datetime.now(timezone.utc).date().isoformat()
    content = (
        "---\n"
        f"url: {json.dumps(url)}\n"
        f"title: {json.dumps(title)}\n"
        f"retrieved: {retrieved}\n"
        f"depth: {depth}\n"
        "---\n\n"
        f"{markdown.strip()}\n"
    )
    path.write_text(content, encoding="utf-8")
    return PageResult(index, url, title, depth, path, "saved")


def write_ledger(out_dir: Path, results: list[PageResult], failures: list[str]) -> None:
    retrieved = datetime.now(timezone.utc).date().isoformat()
    lines = [
        "# Crawl Ledger",
        "",
        f"**Retrieved**: {retrieved}",
        f"**Pages saved**: {len(results)}",
        "",
        "## Sources",
        "",
    ]
    for page in results:
        rel_path = page.path.relative_to(out_dir)
        lines.append(
            f"- [{page.title}]({page.url}) - depth {page.depth}; file: `{rel_path}`"
        )
    if failures:
        lines.extend(["", "## Failures", ""])
        lines.extend(f"- {failure}" for failure in failures)
    lines.append("")
    (out_dir / "ledger.md").write_text("\n".join(lines), encoding="utf-8")


async def crawl(args: argparse.Namespace, config: dict[str, Any], cwd: Path) -> Path:
    try:
        from crawl4ai import AsyncWebCrawler
    except ImportError:
        print(
            "crawl4ai is not installed. Install/setup is required before running "
            "this crawler.",
            file=sys.stderr,
        )
        sys.exit(2)

    start_url = normalize_url(args.url)
    if not start_url:
        raise SystemExit(f"Unsupported URL: {args.url}")

    out_dir = Path(args.out).expanduser() if args.out else default_out_dir(config, start_url, cwd)
    if not out_dir.is_absolute():
        out_dir = cwd / out_dir
    pages_dir = out_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)

    include_patterns = [re.compile(pattern) for pattern in args.include]
    exclude_patterns = [re.compile(pattern) for pattern in args.exclude]
    start_host = urlparse(start_url).netloc
    queue: deque[tuple[str, int]] = deque([(start_url, 0)])
    seen: set[str] = set()
    results: list[PageResult] = []
    failures: list[str] = []

    async with AsyncWebCrawler() as crawler:
        while queue and len(results) < args.max_pages:
            url, depth = queue.popleft()
            normalized = normalize_url(url)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            if not url_allowed(
                normalized,
                start_host,
                args.same_domain,
                include_patterns,
                exclude_patterns,
            ):
                continue

            try:
                result = await crawler.arun(normalized)
                markdown = getattr(result, "markdown", "") or ""
                if markdown.strip():
                    page = write_page(
                        pages_dir,
                        len(results) + 1,
                        normalized,
                        depth,
                        markdown,
                    )
                    results.append(page)
                else:
                    failures.append(f"{normalized} - no markdown returned")

                if depth < args.max_depth:
                    for href in page_links(result, normalized):
                        next_url = normalize_url(href)
                        if next_url and next_url not in seen:
                            queue.append((next_url, depth + 1))
            except Exception as error:  # noqa: BLE001 - report and continue crawl.
                failures.append(f"{normalized} - {error}")

    write_ledger(out_dir, results, failures)
    return out_dir


def main() -> None:
    cwd = Path.cwd()
    config = load_config(cwd)
    args = parse_args(config)
    out_dir = asyncio.run(crawl(args, config, cwd))
    print(f"Crawl saved to: {out_dir}")


if __name__ == "__main__":
    main()
