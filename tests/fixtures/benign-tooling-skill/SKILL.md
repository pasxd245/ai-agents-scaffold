---
name: benign-tooling-skill
description: Checks markdown links across the repository and reports the broken ones. Use this when the user asks to verify links, audit documentation, or after moving files that other docs point at.
allowed-tools: Read, Grep, Bash(git log *)
---

## Procedure

1. Run `scripts/check.py`.
