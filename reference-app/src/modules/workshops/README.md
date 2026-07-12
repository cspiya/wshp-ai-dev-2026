# `workshops` module — THE golden-path slice

The first fully-built vertical slice of the training webshop: the workshop
catalog (course CRUD). **To add a feature module, copy this folder's layout
and imitate its patterns** (ADR:
[docs/adr/0001-workshops-is-the-golden-path.md](../../../docs/adr/0001-workshops-is-the-golden-path.md)).
The adjacent slices follow the same shape: `registrations/` (status flow),
`pricing/` (pure domain logic), and `checkout/` (PaymentPort + fake adapter).

## Layout

| Piece | What lives here |
|---|---|
| `domain/workshop.ts` | Workshop entity as Zod schemas — the single source of validation for API, form, and tests. Read-side dates are strict UTC ISO. Pricing rules belong to the separate `pricing` slice. |
| `application/workshops.router.ts` | Use-cases as a tRPC router factory + the `WorkshopRepo` port |
| `application/workshops.router.test.ts` | Router contract tests over the port's in-memory double (no DB) |
| `infra/schema.ts` | Drizzle `workshops` table — migrations via `npm run db:generate` |
| `infra/drizzle-workshop-repo.ts` | The real adapter (Neon over `@/platform/db`), bounded `list()` (first 50 by date) |
| `infra/in-memory-workshop-repo.ts` | Test double (contract tests + the no-DB e2e server) |
| `infra/timestamps.ts` | Read-side timestamp normalization shared by both adapters (+ unit test) |
| `infra/workshop-repo.contract.test.ts` | ONE shared contract suite every adapter must pass (Drizzle leg runs when `TEST_DATABASE_URL` is set) |
| `infra/seed.ts` | Generic demo rows + `seedDemoWorkshops(db)` — run via the thin `scripts/seed.ts` |
| `ui/` | shadcn table + create/edit form (React Hook Form + Zod resolver, same schemas) |
| `acceptance/workshops.feature` | Given-When-Then criteria — each maps to a test |
| `workshops.contract.ts` | The module's ONLY public surface — factories + UI entry, nothing speculative |

The route shell `src/app/workshops/page.tsx` renders `WorkshopsView` from the
contract. The module never composes itself: the **composition root**
(`src/platform/api/root.ts`) picks a repo adapter (Drizzle by default,
in-memory only under the local-e2e-only `E2E_IN_MEMORY_DB=1` seam, which is
hard-blocked on Vercel) and injects it into `createWorkshopsRouter`.

## Why the port exists (and when yours should)

`WorkshopRepo` is justified because **persistence is a boundary that actually
varies** (root AGENTS.md: DB, payment vendor, LLM provider) — the store can be
swapped under the use-cases. It is NOT justified by "having two
implementations": the in-memory repo is a **test double**, and a test double
never counts as a second implementation. Don't copy this pattern by writing a
double to license an interface — ask whether your dependency is a genuinely
varying boundary. If it isn't: one implementation ⇒ no interface.

The shared contract suite (`infra/workshop-repo.contract.test.ts`) is the
flip side of that deal: whatever implements the port must pass the same tests,
so the double cannot drift from the real adapter.

## Scope notes

- `list()` is bounded (first 50 by date) — unbounded lists don't ship, even in
  a teaching skeleton.
- There is deliberately **no `getById`**: nothing consumes it yet. It returns
  when a detail view needs it (YAGNI — see the ADR).

## Running against a database

- `npm run db:generate` / `db:push` — create/apply migrations (needs `DATABASE_URL`)
- `npm run db:seed` — insert generic sample workshops (idempotent by title)
- Without a `DATABASE_URL`, the app still builds and renders; workshop queries
  fail with a clear message and the UI shows its error state.
- To run the Drizzle leg of the repo contract suite:
  `TEST_DATABASE_URL=<disposable branch url> npm run test` (CI skips it).

## E2E happy path

`npm run test:e2e` builds and starts the production server with
`E2E_IN_MEMORY_DB=1` (no database needed) and runs `e2e/workshops.spec.ts`:
create a workshop → it appears in the list → delete it → it disappears (the
delete step doubles as cleanup on shared databases). Point the same test at a
deployment with `PLAYWRIGHT_BASE_URL=https://<preview-url> npm run test:e2e`.
