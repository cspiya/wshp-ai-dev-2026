# workshops module — agent instructions

- Scope your work to this folder; a change here must not require edits in other
  modules. If it does, the contract is wrong — stop and flag it.
- Only `workshops.contract.ts` is public. Never export internals for convenience.
- `domain/` stays pure: no imports from platform, infra, React, or Next.
  Today it holds only the entity Zod schemas (domain vocabulary); business
  rules arrive with the `pricing` module (WEN-141) — don't invent them early.
- The `WorkshopRepo` port lives in `application/`; `infra/` implements it.
  It exists because it genuinely varies (Drizzle adapter + in-memory test
  double). Do not add further ports without a second real implementation.
- Every use-case change needs a matching router contract test in
  `application/workshops.router.test.ts` (Vitest, test double — no DB).
- Acceptance criteria live in `acceptance/workshops.feature` (English,
  Given-When-Then); each scenario maps to at least one test.
- Schema changes (`infra/schema.ts`) require `npm run db:generate` and
  committing the new migration under `drizzle/`.
- Local checks before you call it done:
  `npm run typecheck && npm run lint && npm run test`
  (plus `npm run test:e2e` when you touched ui/ or the page wiring).
