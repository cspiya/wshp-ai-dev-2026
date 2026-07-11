# Wenova AI-Assisted Development Workshop — 2026.07

Materials and reference project for the **Wenova AI-Assisted Development Workshop** (1 day, 2026-07-14,
Budapest; repo slug: `wshp-ai-dev-2026`). One day, hands-on: professional AI-assisted (agentic)
development with **Claude Code CLI** on a modern stack — **Linear + GitHub + Vercel + Neon + Next.js/React**.

> **Primary outcome:** build an agent-ready development system from an empty greenfield repository,
> then validate it by delivering a realistic application slice end to end. The app is the operating
> model's integration test; the reusable development framework is the product participants take home.
> Models and agent tools are replaceable executors: repository contracts, deterministic gates, independent
> review and evidence keep the quality bar stable across outages, cost changes and rapid model upgrades.

## What's in this repo

```
wshp-ai-dev-2026/
├── materials/            ← participant materials: setup guide, agenda, glossary, notebooks (checklists land during prep week)
├── toolkit/              ← take-home toolkit: AGENTS.md starter, hooks, skills, orchestrator, spec templates
├── participant-starter/  ← minimal technical substrate — participants make the repo agent-ready first
└── reference-app/        ← realistic validation workload for the operating model
```

- **`materials/`** — everything a participant needs before and during the day.
- **`toolkit/`** — the reusable kit you take home and drop into your own projects.
- **`participant-starter/`** — the hands-on technical substrate: clone/copy it, then add the rules,
  standards, specs, gates and RUG workflow that make the repository agent-ready.
- **`reference-app/`** — the realistic validation workload and "golden path" reference implementation:
  a Next.js (App Router) + shadcn/ui + Drizzle + tRPC/Zod app on Vercel + Neon, structured as a
  modular monolith of vertical slices ("one bounded context = one subagent's working set").

## The day in one paragraph

Short theory intro, then hands-on: everyone turns an **operationally empty repository** into an
agent-ready development system with explicit rules, canonical standards, spec gates, a Repeat-Until-Good
review loop and deterministic validation. A realistic application slice then tests whether that system
can actually deliver software through a real preview and e2e path — plus a dedicated block
on applying all of this to **legacy .NET / MS-SQL / Azure DevOps** estates, and a team operating model
with a 30/60/90 adoption plan.

## Start here (participants) / Kezdd itt (résztvevők)

1. [`materials/agent-ready-repo.md`](materials/agent-ready-repo.md) — mit építünk, és milyen checkpointokon jutunk el az üres repótól a bizonyított operating modelig.
2. [`materials/setup-guide.md`](materials/setup-guide.md) — fiókok + telepítés (~30–40 perc, minden ingyenes).
3. Hozz egy **egyszerű alkalmazásötletet és üzleti szabályt** — ez lesz a saját fejlesztési rendszered validációs workloadja.
4. Napirend: [`materials/agenda.md`](materials/agenda.md) · Szakszavak: [`materials/fogalomtar.md`](materials/fogalomtar.md).
5. Tananyag-notebookok modulonként: [`materials/notebooks/`](materials/notebooks/).

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
