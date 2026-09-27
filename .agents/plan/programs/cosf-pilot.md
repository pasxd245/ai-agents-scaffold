# Program: a2scaffold as a CoSF pilot

**Status**: Planning
**Opened**: 2026-09-24
**Closed**: —
**Origin**: [context/philosophy.md](../../context/philosophy.md) — the CoSF
section states three claims and admits, four times, that nothing here measures
any of them.

## Goal

Every claim CoSF makes carries either a measurement or a written verdict that
it cannot be measured here. No claim keeps the status it has today, which is
neither.

Verifiable: `context/philosophy.md` contains no sentence of the form "nothing
here measures that" without a link to the round that tried.

## Why now

The claims and their falsifiers have been canon since 2026-08-29. Fifteen
rounds have run since. Every round carrying the field reads
`Part of: standalone`, so no round has ever been designed to test one.

What canon currently admits, verbatim:

| Where        | Admission                                                                          |
| ------------ | ---------------------------------------------------------------------------------- |
| H1           | falsified by "a round where the scaffold measurably slowed the work" — none run    |
| H2           | "nothing here measures that… H2 is a stance, not a finding"                        |
| What follows | adaptation efficiency "is measurable… Nothing in this repo measures it yet"        |
| Shipped stub | "If this project finds a way to, write it down" — shipped to every scaffolded repo |

The last one is the sharpest: the tool asks strangers to solve a problem its
own repository has not attempted.

## Phases

| #   | Phase                         | Gate — how we know it is done                                                                                                                                                                | Round(s) |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Measure adaptation efficiency | A repeatable procedure exists and has been run once **with a control** — a cold agent on a fixed task, with `.agents/` and without. Numbers written down, including the ones that disappoint | —        |
| 2   | Record the scaffold's cost    | At least one round records what the scaffold **cost** — context spent, turns lost to loading the wrong file — next to what it bought. H1 cannot be falsified while only benefits are logged  | —        |
| 3   | Settle H2, either way         | Either a mechanism where the human is the beneficiary and it shows, or a written verdict that it is unmeasurable here — in which case H2 is demoted from `context/` to `memory/`             | —        |

Phase 1 first because it is the only one of the three that is tractable today.
Phases 2 and 3 are ordered by how much they depend on having any measurement
habit at all, not by importance.

**A phase may conclude that its claim is wrong.** That is a result, not a
failure of the phase. H1 and H2 are the author's own and labelled untested;
this program is what would earn or retire them.

## Not in scope

- **Feature work on the tool.** R014 and R015 are `standalone` and stay that
  way. A round that fits in one round does not need a program — see
  [programs/README.md](README.md). Do not retrofit `Part of: cosf-pilot` onto
  rounds that are not testing a claim; an orphan with a false parent is worse
  than an orphan.
- **Promoting CoSF further into canon.** It is already in `context/` with a
  `Status: untested` banner, which is the honest placement. This program does
  not strengthen the wording; it produces the evidence that would.
- **Designing the measurement.** Phase 1 opens a round for that. Naming the
  phase is not the same as knowing how.

## Log

- **2026-09-24 — opened.** Triggered by a mindset the author stated during
  Round 015 planning: aim large while exploring, demand evidence at release.
  The discipline half was already canon (`philosophy.md`: "If it has never been
  tested, it is an aspiration, not a principle"). The CoSF section is itself
  the ambition half — an untested framework admitted to `context/` with its
  falsifiers attached. What had never happened was the descent from a labelled
  hypothesis to a round. This program is that descent, and nothing more yet.
