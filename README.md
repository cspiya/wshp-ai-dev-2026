# Wenova AI-Assisted Development Workshop — 2026.07

Materials and reference project for the **Wenova AI-Assisted Development Workshop** (1 day, 2026-07-14,
Budapest; repo slug: `wshp-ai-dev-2026`). One day, hands-on: professional AI-assisted (agentic)
development with **Claude Code CLI** on a modern stack — **Linear + GitHub + Vercel + Neon + Next.js/React**.

## What's in this repo

```
wshp-ai-dev-2026/
├── materials/            ← participant materials: setup guide, agenda, glossary, notebooks (checklists land during prep week)
├── toolkit/              ← take-home toolkit: AGENTS.md starter, hooks, skills, orchestrator, spec templates
├── participant-starter/  ← minimal Next.js + Tailwind + shadcn starter — participants build their own site from this
└── reference-app/        ← the greenfield reference project (modular vertical-slice architecture)
```

- **`materials/`** — everything a participant needs before and during the day.
- **`toolkit/`** — the reusable kit you take home and drop into your own projects.
- **`participant-starter/`** — the hands-on starting point: clone/copy it into your own repo
  and build your website idea from it during the day (Hungarian README inside).
- **`reference-app/`** — the "golden path" reference implementation the workshop builds on:
  a Next.js (App Router) + shadcn/ui + Drizzle + tRPC/Zod app on Vercel + Neon, structured as a
  modular monolith of vertical slices ("one bounded context = one subagent's working set").

## The day in one paragraph

Short theory intro (agentic development fundamentals), then hands-on: everyone scaffolds **their own
project in their own GitHub repo** and builds a small website from zero using spec-driven development
with human validation gates, an orchestrator with a Repeat-Until-Good review loop, enforced rules
(AGENTS.md + hooks), QA in every phase with e2e tests on real per-PR previews — plus a dedicated block
on applying all of this to **legacy .NET / MS-SQL / Azure DevOps** estates, and a team operating model
with a 30/60/90 adoption plan.

## Start here (participants) / Kezdd itt (résztvevők)

1. [`materials/setup-guide.md`](materials/setup-guide.md) — fiókok + telepítés (~30–40 perc, minden ingyenes).
2. Hozz egy **weboldal-ötletet** — a nap során nulláról építed fel.
3. Napirend: [`materials/agenda.md`](materials/agenda.md) · Szakszavak: [`materials/fogalomtar.md`](materials/fogalomtar.md).
4. Tananyag-notebookok modulonként: [`materials/notebooks/`](materials/notebooks/).

## Scope & tracking

This repo contains **only participant-shareable materials and the reference implementation** — presentations,
internal prep notes, and client documents live elsewhere. Build progress is tracked in the Linear project of the
same name: [wshp-ai-dev-2026 (Linear)](https://linear.app/wenova/project/wshp-ai-dev-2026-3eae5243953d)
*(workspace members only)*.

## Language policy

Teaching materials (notebooks, guides, glossary) are **Hungarian** — the cohort is Hungarian — using
English technical terms; anything non-obvious is defined in [`materials/fogalomtar.md`](materials/fogalomtar.md).
All AI instructions, rules, code, and technical artifacts are **English** (models are most effective in
English). Business-level specs during the workshop may be written in Hungarian.

---
© Wenova · Workshop delivery: 2026-07-14 · License: materials MIT unless noted otherwise.
