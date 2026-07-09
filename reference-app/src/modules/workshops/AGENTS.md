# workshops module — agent instructions

- Scope your work to this folder; a change here must not require edits in other
  modules. If it does, the contract is wrong — stop and flag it.
- Only `workshops.contract.ts` is public. Never export internals for
  convenience, and export only what a consumer actually uses today.
- The module exports FACTORIES; it never composes itself. Adapter choice and
  wiring happen in the composition root (`src/platform/api/root.ts`).
- `domain/` stays pure: no imports from platform, infra, React, or Next.
  Today it holds only the entity Zod schemas (domain vocabulary); business
  rules arrive with the `pricing` module (WEN-141) — don't invent them early.
- The `WorkshopRepo` port lives in `application/`; `infra/` implements it.
  It exists because persistence is a boundary that actually varies (root
  AGENTS.md) — NOT because there are "two implementations". The in-memory
  double is a test double, and a test double never counts as the second
  implementation that licenses an interface. Don't write a double to justify
  a port; justify the port by the boundary, then double it for tests.
- Every adapter must pass the shared port-contract suite
  (`infra/workshop-repo.contract.test.ts`) — that is what keeps the double
  faithful to the real adapter (ordering, timestamp shape, snapshots).
- Every use-case change needs a matching router contract test in
  `application/workshops.router.test.ts` (Vitest, test double — no DB).
- Seed/fixture data stays GENERIC (public repo): "Sample Workshop: …" titles,
  rounded fake prices, far-future dates. Never a real engagement's
  title/date/price/capacity.
- Acceptance criteria live in `acceptance/workshops.feature` (English,
  Given-When-Then); each scenario maps to at least one test.
- Schema changes (`infra/schema.ts`) require `npm run db:generate` and
  committing the new migration under `drizzle/`.
- Local checks before you call it done:
  `npm run typecheck && npm run lint && npm run test`
  (plus `npm run test:e2e` when you touched ui/ or the page wiring).
