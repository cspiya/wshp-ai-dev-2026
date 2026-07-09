<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reference App — agent rules

Greenfield reference project of the Wenova AI-Assisted Development Workshop.
A **modular monolith of vertical slices**: one bounded context = one module
folder = one agent's working set.

## Golden path

To add a feature module, **copy `src/modules/identity/`** (its folder layout,
contract, and patterns) and imitate it. Do not invent a new structure. Each
module has its own `AGENTS.md` and `README.md` — read them before working there.

## Boundary rules

Rules 1–3 are **lint-enforced on resolved import paths** (alias, relative, or
multi-hop `../..` spelling makes no difference) — see `eslint.config.mjs`.
The lint rules themselves are regression-tested:
`src/platform/lint-boundaries.test.ts`.

1. Modules import other modules **only** via their `<name>.contract.ts`.
2. `domain/` imports nothing outward: no platform, no React/Next, no other
   modules — and no packages at all, except `zod`.
3. Only a module's `infra/` (and platform itself) may import `@/platform/db`.
4. *(convention)* Inside a module use relative imports; the `@/` alias is only
   for crossing boundaries. `infra/` implements ports defined in `application/`.
5. *(convention)* Schemas shared by 2+ modules go to `src/contracts/` — the
   strictest review gate in the repo.

## SOLID without scaffolding

Introduce a port/interface **only at a boundary that actually varies** (DB,
payment vendor, LLM provider). Never for internal pure functions.
**One implementation ⇒ no interface.** No factories, wrappers, or config
objects "for flexibility" — flexibility that nothing exercises is dead weight.

## Language policy

Code, comments, AI instructions, commit messages, and technical docs are
**English**. Only business-spec documents may be Hungarian.

## Validation loop (run before declaring any task done)

```
npm run typecheck && npm run lint && npm run test
```

- `npm run dev` — local dev server
- `npm run build` — production build (CI runs it too)
- `npm run db:generate` / `npm run db:push` — Drizzle migrations (needs
  `DATABASE_URL`; until the Day 2 schema lands both are clean no-ops — the
  identity schema.ts is a placeholder with zero tables)

If a check fails: read the output, fix, re-run. Report done only when all green.

## Scope guardrails

- Auth/RBAC is a **stub** — do not build real auth here.
- No realtime, uploads, or multi-tenancy — out of scope for this artifact.
- Optimize for pedagogical clarity over production robustness: smallest
  working form, readable configs, comments only where a constraint is not
  obvious from code.
