# Built-in skill pool

Skills placed under this directory ship with `a2scaffold` and are
installable by name:

```sh
a2scaffold skill add <name>          # → resolves here
a2scaffold skill add group/<name>    # nested paths supported
```

Each entry must be a valid skill (its own directory containing
`SKILL.md` with required frontmatter). See the agentskills.io spec.

For skills hosted in external repos, define a registry in
`.a2scaffoldrc.json` and use `skill add <name> --from <registry>`.
