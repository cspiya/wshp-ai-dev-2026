# ADR 0001: `workshops` is the golden path — copy this structure

- **Status:** accepted
- **Date:** 2026-07-09
- **Context:** WEN-117 (first real vertical slice), decisions D9+D10
  (reference app = training mini-webshop)

## Context

The reference app teaches agents (and humans) by imitation: instead of
documenting an architecture abstractly, the repo ships one fully-built
vertical slice as the concrete template. Until now the golden path was the
`identity/` structure stub — folders and a contract, but no real schema,
use-cases, UI, or tests to imitate.

The app's business domain is a **training mini-webshop**: `workshops/`
(course catalog CRUD) now, then `registrations/` (status flow with
cancellation), `pricing/` (pure domain function), and `checkout/`
(PaymentPort + fake adapter), with auth via Neon Auth.

## Decision

`src/modules/workshops/` is **THE golden path**. To add a feature module,
copy its folder layout and imitate its patterns:

- Zod entity schemas in `domain/` — one source of validation for the tRPC
  input, the React Hook Form resolver, and the tests.
- Use-cases as a tRPC **router factory** in `application/`, plus a port
  (`WorkshopRepo`) only because it genuinely varies: a Drizzle adapter and an
  in-memory test double. One implementation ⇒ no interface.
- Drizzle table in `infra/schema.ts`; drizzle.config.ts globs every module's
  `infra/schema.ts`, so each slice owns its schema and migrations.
- shadcn UI + form in `ui/`, exposed through the contract and rendered by a
  thin `src/app` route shell.
- `acceptance/*.feature` (Given-When-Then) mapping 1:1 to router contract
  tests, plus ONE Playwright happy path (`e2e/workshops.spec.ts`) that runs
  locally with `E2E_IN_MEMORY_DB=1` and against previews via
  `PLAYWRIGHT_BASE_URL`.
- The module's ONLY public surface is `workshops.contract.ts` (lint-enforced).

The `identity/` module stays as the **minimal empty-module boundary demo**
(the lint-boundaries regression tests reference its file paths); it is no
longer the golden path.

## Consequences

- Agents adding `registrations/`, `pricing/`, `checkout/` pattern-match a
  working slice instead of inventing structure — consistency for free.
- Every new module inherits the same test strategy (schema-level rejection,
  router contract tests over a double, one browser happy path).
- The in-memory adapter doubles as the no-database e2e backend, so the
  Playwright suite needs no Neon until preview wiring lands (SETUP-STATUS).
- When `pricing/` (WEN-141) lands, real business logic gets its home in
  `domain/` — the golden path then also demonstrates pure domain functions.
