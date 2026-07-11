<!-- BEGIN:nextjs-agent-rules -->
# Next.js: always read the version-matched docs before coding

Before any Next.js work, find and read the relevant documentation in
`node_modules/next/dist/docs/`. The installed documentation is the source of
truth for this project's Next.js version.
<!-- END:nextjs-agent-rules -->

# Reference App — agent rules

Greenfield reference project of the Wenova AI-Assisted Development Workshop.
A **modular monolith of vertical slices**: one bounded context = one module
folder = one agent's working set.

## Golden path

To add a feature module, **copy `src/modules/workshops/`** (its folder layout,
contract, and patterns) and imitate it — it is the fully-built reference slice
(schema + tRPC CRUD + UI + tests; see `docs/adr/0001-workshops-is-the-golden-path.md`).
Do not invent a new structure. `src/modules/identity/` is only the minimal
empty-module boundary demo, not the template. Each module has its own
`AGENTS.md` and `README.md` — read them before working there.

## Boundary rules

Rules 1–3 are **lint-enforced on resolved import paths** (alias, relative, or
multi-hop `../..` spelling makes no difference) — see `eslint.config.mjs`.
The fences cover `src/`, `scripts/`, and `e2e/` alike: runners and specs may
only reach a module through its contract. The lint rules themselves are
regression-tested: `src/platform/lint-boundaries.test.ts`.

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
- `npm run test:e2e` — Playwright happy path (builds + starts the app with an
  in-memory repo, no DB needed; `PLAYWRIGHT_BASE_URL` retargets it)
- `npm run db:generate` / `npm run db:push` — Drizzle migrations (need
  `DATABASE_URL`); `npm run db:seed` — sample data. A schema change without a
  committed migration in `drizzle/` is not done.

If a check fails: read the output, fix, re-run. Report done only when all green.

## Hard-won gotchas (do not re-learn)

- **Lockfiles must be generated with npm 10** (`npx npm@10 install`): the CI runner
  pairs Node 22 + npm 10; npm-11 lockfiles break `npm ci`.
- **`shadcn` IS a runtime dependency** (globals.css imports `shadcn/tailwind.css`) —
  do not "clean it up".
- **`E2E_IN_MEMORY_DB=1` is a local-e2e-only seam**, guarded by a startup throw on
  Vercel (`src/platform/api/root.ts`) — never weaken the guard; composition lives at
  the composition root, never at module import time.
- **Test lint-boundary rules with REAL files** — eslint zones are generated from
  existing module folders, so stdin tests against non-existent paths false-pass.
- **Both repo adapters must stay contract-equal:** the shared port-contract suite
  (`workshop-repo.contract.test.ts`) runs on in-memory always + Drizzle when
  `TEST_DATABASE_URL` is set (point it at a disposable Neon branch for a zero-skip run).
- Playwright against a preview:
  `PLAYWRIGHT_BASE_URL=<url> npx playwright test --grep @happy-path`.

## Scope guardrails

- Neon Auth has an explicitly approved **thin integration** scope under
  WEN-141, but it remains incomplete until the external Neon provisioning,
  package, environment, session, and preview checks in `SETUP-STATUS.md` are
  done. Do not build custom auth or full RBAC, and never describe the current
  unauthenticated teaching flow as deploy-ready.
- No realtime, uploads, or multi-tenancy — out of scope for this artifact.
- Optimize for pedagogical clarity over production robustness: smallest
  working form, readable configs, comments only where a constraint is not
  obvious from code.
