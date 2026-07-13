# Reference App — the golden path

> This application is the workshop's **[validation workload](../materials/fogalomtar.md#validation-workload)**
> for its [agent-ready development framework](../materials/fogalomtar.md#agent-ready-repo), which is the
> product. The app is deliberately representative rather than product-complete: business rules, multiple
> slices, persistence, a varying external port, failure paths, review findings, and e2e deployment
> evidence test whether the [operating model](../materials/fogalomtar.md#operating-model) can actually
> deliver software.

All examples and sample data are [lifelike but explicitly INVENTED](../materials/fogalomtar.md#invented-data).
They contain no client facts or personal data. Work coordination lives in the
[Linear issue spec, lease, and trace](../materials/fogalomtar.md#linear-work-state); this repository does not
use handoff files.

Greenfield reference project of the **Wenova AI-Assisted Development Workshop**:
**Next.js (App Router) + shadcn/ui + Tailwind + Drizzle + Neon + tRPC + Zod +
TanStack Query** on **Vercel**, structured as a **modular monolith of vertical
slices** — one bounded context = one module = one agent's working set.

## Tech stack — and why (AI-native choices)

The stack above was not picked by feature list — every piece had to be drivable by
an agent end to end.

| Layer | Choice | Why |
|---|---|---|
| App framework | Next.js App Router + TypeScript | Conventional, strongly represented in agent training corpora, machine-checkable end to end (typecheck/lint/test/build). |
| UI | Tailwind + shadcn/ui (local source) | Components are editable source under `src/components/ui/` — agents read and edit them directly. |
| API layer | tRPC + Zod + TanStack Query | End-to-end typed chain: a contract violation is a typecheck failure, not a runtime surprise. |
| Database | Neon Postgres + Drizzle | DB branch per preview deployment + MCP; committed SQL migrations keep schema changes reviewable. |
| Auth | Neon Auth | Users land in **our own Postgres** — no second user store to sync, and the data stays queryable through the same DB tooling. |
| Payments | `PaymentPort` + fake adapter | The swappable-boundary lesson: the varying vendor is isolated behind a port, so a real adapter can replace the fake one without touching checkout code. |
| Hosting + previews | Vercel | Preview per PR + MCP — every change gets a live URL agents can test against. |
| Work state | Linear (issue = spec) | The issue IS the spec; via MCP the agent reads and updates work state itself. |
| Source + gates | GitHub (gh CLI, PR checks) | Machine-drivable source control and merge gates. |
| Design step | v0 / Claude Design | Agent-drivable design step. |
| Agents | Claude Code CLI + Codex | Two independent agentic harnesses for maker/reviewer separation and model-swap evals. |

### What makes a system AI-native?

**AI-first / AI-native development** = the system is designed so an AI agent is a
first-class co-worker in it, not a tool bolted on afterwards. Four criteria:

1. **Fast, cheap cycles** — every change builds, tests and gets a preview in minutes
   (CI + per-PR previews + branched database); infrastructure must never be the
   bottleneck of the agent's iteration speed.
2. **Per-feature separation** — one module = one agent workspace (vertical slice,
   enforced boundaries): small context, small blast radius, each feature independently
   DEVELOPABLE and VERIFIABLE, parallelizable agent work. In this repo that is the
   architecture itself — the vertical slice ("one module, one agent workspace") is the
   #1 AI-quality lever; see [Structure](#structure) below.
3. **Full AI-integrability** — every tool has a machine interface (CLI / API / MCP);
   wherever only a human can click, the agent chain breaks.
4. **Contracts + verification** — spec, rules, gates, independent review
   ([RUG](../materials/fogalomtar.md#rug)), evidence (the pillar the workshop already
   teaches).

Stack selection principle: **"AI-integrability > feature list."**

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL (Neon) — not needed for the health check
npm run dev                 # http://localhost:3000
```

The homepage renders a live health check that exercises the whole chain:
React → TanStack Query → tRPC → Zod → server.

## Commands

| Command | What |
|---|---|
| `npm run dev` | dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (includes the architecture boundary rules) |
| `npm run test` | Vitest (unit + router contract tests + lint-rule regression tests) |
| `npm run test:e2e` | Playwright happy path — no DB needed locally (in-memory repo); set `PLAYWRIGHT_BASE_URL` to run against a deployment |
| `npm run build` | production build |
| `npm run db:generate` / `db:push` | Drizzle migrations (need `DATABASE_URL`) |
| `npm run db:seed` | insert sample workshops (idempotent) |

CI (GitHub Actions) runs typecheck + lint + test + build on every push/PR.

## Structure

```
src/
  app/                      Next.js App Router shell (routes, layout, tRPC endpoint)
  components/ui/            shadcn/ui components (local source — agents read/edit them)
  modules/                  feature modules = bounded contexts = vertical slices
    workshops/              ← GOLDEN PATH: fully-built slice (copy this to add a module)
      domain/               entity Zod schemas + pure logic — imports nothing outward
      application/          use-cases (tRPC router factory) + ports, contract tests
      infra/                Drizzle schema + repo adapters (real + in-memory double)
      ui/                   shadcn table + create/edit form (RHF + Zod resolver)
      acceptance/           Gherkin acceptance criteria (map to tests)
      workshops.contract.ts the ONLY import surface for other modules
      AGENTS.md, README.md  module-scoped rules + docs
    orders/                 webshop journey: catalog → cart → checkout → confirmation
                            (guest/company buyer, qty limits, coupon, net+VAT pricing)
    registrations/          workshop sign-up slice (in-memory + Drizzle adapters)
    pricing/                pure pricing domain (calculation order, rounding)
    checkout/               payment flow behind PaymentPort (fake adapter)
    identity/               minimal empty-module boundary demo (NOT the template)
  platform/                 cross-cutting: db client (Neon+Drizzle), env, tRPC init
  contracts/                zod schemas shared across module boundaries
docs/adr/                   architecture decision records
drizzle/                    generated SQL migrations (committed)
e2e/                        Playwright specs (one happy path per slice)
```

**Why this shape:** a slice is self-contained, so a task's whole context fits one
folder — contained blast radius, slice-scoped tests, cheap tokens, and safe
multi-agent parallelism. Boundaries are lint-enforced on **resolved** import
paths (`eslint.config.mjs`), not aspirational — and the lint rules themselves
have regression tests (`src/platform/lint-boundaries.test.ts`). Rules for
humans and agents: [`AGENTS.md`](AGENTS.md).

## Deployment

Vercel + Neon with a DB branch per preview deployment — manual one-time setup
steps in [`SETUP-STATUS.md`](SETUP-STATUS.md). MCP servers for Linear / GitHub /
Neon / Vercel: copy `.mcp.json.example` to `.mcp.json`.

## Implemented vertical slices

- `npm run test:e2e` runs `/shop` database-free through the guarded local
  in-memory seam: integer pricing → fake payment authorization → pending
  registration → confirmation → cancellation. A normal `npm run dev` uses
  the configured Drizzle/Neon adapters and therefore needs `DATABASE_URL` for
  the registration steps.
- `pricing/` fixes the calculation order and rounding in pure domain tests.
- `checkout/` isolates the changing payment vendor behind `PaymentPort`.
- `registrations/` has in-memory and Drizzle adapters plus a deterministic,
  injected clock for the 48-hour cancellation rule.
- Neon Auth is not claimed complete: the package, route, session context, protected
  write procedures, and UI are present, but provisioning/environment correctness and
  a post-merge authenticated Preview journey still require live proof. The exact
  checklist is in `SETUP-STATUS.md`.
