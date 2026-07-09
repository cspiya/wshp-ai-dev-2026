# `workshops` module — THE golden-path slice

The first fully-built vertical slice of the training webshop: the workshop
catalog (course CRUD). **To add a feature module, copy this folder's layout
and imitate its patterns** (ADR:
[docs/adr/0001-workshops-is-the-golden-path.md](../../../docs/adr/0001-workshops-is-the-golden-path.md)).
Coming next in the same shape: `registrations/` (status flow),
`pricing/` (pure domain logic, WEN-141), `checkout/` (PaymentPort + fake adapter).

## Layout

| Piece | What lives here |
|---|---|
| `domain/workshop.ts` | Workshop entity as Zod schemas — the single source of validation for API, form, and tests. No business rules yet (those arrive with `pricing`, WEN-141) |
| `application/workshops.router.ts` | Use-cases as a tRPC router factory + the `WorkshopRepo` port |
| `application/workshops.router.test.ts` | Router contract tests over the port's in-memory double (no DB) |
| `infra/schema.ts` | Drizzle `workshops` table — migrations via `npm run db:generate` |
| `infra/drizzle-workshop-repo.ts` | The real adapter (Neon over `@/platform/db`) |
| `infra/in-memory-workshop-repo.ts` | Test double (contract tests + `E2E_IN_MEMORY_DB=1` e2e server) |
| `infra/workshop-repo.ts` | Adapter selection (in-memory only under the e2e flag) |
| `ui/` | shadcn table + create/edit form (React Hook Form + Zod resolver, same schemas) |
| `acceptance/workshops.feature` | Given-When-Then criteria — each maps to a test |
| `workshops.contract.ts` | The module's ONLY public surface: schemas, router, UI entry |

The route shell `src/app/workshops/page.tsx` renders `WorkshopsView` from the
contract; the router is mounted as `workshops` in `src/platform/api/root.ts`.

## Why the port exists (and when yours should)

`WorkshopRepo` has **two real implementations** (Drizzle + in-memory), which is
what earns it an interface. If your new module talks to the DB the same way,
copy this port pattern; if something has only one implementation, don't wrap it
(root AGENTS.md: one implementation ⇒ no interface).

## Running against a database

- `npm run db:generate` / `db:push` — create/apply migrations (needs `DATABASE_URL`)
- `npm run db:seed` — insert sample workshops (idempotent by title)
- Without a `DATABASE_URL`, the app still builds and renders; workshop queries
  fail with a clear message and the UI shows its error state.

## E2E happy path

`npm run test:e2e` builds and starts the production server with
`E2E_IN_MEMORY_DB=1` (no database needed) and runs
`e2e/workshops.spec.ts`: create a workshop → it appears in the list.
Point the same test at a deployment with
`PLAYWRIGHT_BASE_URL=https://<preview-url> npm run test:e2e`.
