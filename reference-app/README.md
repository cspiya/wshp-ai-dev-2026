# Reference App — the golden path

Greenfield reference project of the **Wenova AI-Assisted Development Workshop**:
**Next.js (App Router) + shadcn/ui + Tailwind + Drizzle + Neon + tRPC + Zod +
TanStack Query** on **Vercel**, structured as a **modular monolith of vertical
slices** — one bounded context = one module = one agent's working set.

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
| `npm run test` | Vitest |
| `npm run build` | production build |
| `npm run db:generate` / `db:push` | Drizzle migrations (needs `DATABASE_URL`) |

CI (GitHub Actions) runs typecheck + lint + test + build on every push/PR.

## Structure

```
src/
  app/                      Next.js App Router shell (routes, layout, tRPC endpoint)
  components/ui/            shadcn/ui components (local source — agents read/edit them)
  modules/                  feature modules = bounded contexts = vertical slices
    identity/               ← GOLDEN PATH structure template (copy this to add a module)
      domain/               pure logic — imports nothing outward
      application/          use-cases + ports
      infra/                Drizzle schema + adapters
      ui/                   React components of this slice
      acceptance/           Gherkin acceptance criteria
      identity.contract.ts  the ONLY import surface for other modules
      AGENTS.md, README.md  module-scoped rules + docs
  platform/                 cross-cutting: db client (Neon+Drizzle), env, tRPC init
  contracts/                zod schemas shared across module boundaries
```

**Why this shape:** a slice is self-contained, so a task's whole context fits one
folder — contained blast radius, slice-scoped tests, cheap tokens, and safe
multi-agent parallelism. Boundaries are lint-enforced (`eslint.config.mjs`), not
aspirational. Rules for humans and agents: [`AGENTS.md`](AGENTS.md).

## Deployment

Vercel + Neon with a DB branch per preview deployment — manual one-time setup
steps in [`SETUP-STATUS.md`](SETUP-STATUS.md). MCP servers for Linear / GitHub /
Neon / Vercel: copy `.mcp.json.example` to `.mcp.json`.
