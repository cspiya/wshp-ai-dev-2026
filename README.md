# wshp-ai-dev-2026 — Advanced AI Software Development Workshop

Materials and reference project for the **Wenova 1-day Advanced AI Software Development workshop**
(2026-07-14, Budapest). One day, hands-on: professional AI-assisted (agentic) development with
**Claude Code CLI** on a modern stack — **Linear + GitHub + Vercel + Neon + Next.js/React**.

## What's in this repo

```
wshp-ai-dev-2026/
├── materials/        ← participant materials: setup guide, agenda, checklists, templates
├── toolkit/          ← take-home toolkit: AGENTS.md starter, hooks, skills, orchestrator, spec templates
└── reference-app/    ← the greenfield reference project (modular vertical-slice architecture)
```

- **`materials/`** — everything a participant needs before and during the day.
- **`toolkit/`** — the reusable kit you take home and drop into your own projects.
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

## Start here (participants)

1. Read [`materials/setup-guide.md`](materials/setup-guide.md) — accounts + installs (~30–40 min, all free).
2. Bring a **website idea** — you'll build it from zero during the day.
3. The agenda: [`materials/agenda.md`](materials/agenda.md).

## Scope & tracking

This repo contains **only participant-shareable materials and the reference implementation** — presentations,
internal prep notes, and client documents live elsewhere. Build progress is tracked in the Linear project of the
same name: [wshp-ai-dev-2026 (Linear)](https://linear.app/wenova/project/wshp-ai-dev-2026-3eae5243953d)
*(workspace members only)*.

## Language policy

All AI instructions, rules, code, and technical documentation in this repo are **English** (models are
most effective in English). Business-level specs during the workshop may be written in Hungarian.

---
© Wenova · Workshop delivery: 2026-07-14 · License: materials MIT unless noted otherwise.
