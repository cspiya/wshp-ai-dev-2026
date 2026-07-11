# pricing module — agent instructions

- Only `pricing.contract.ts` is public.
- Domain code imports only Zod and uses integer minor units; never use floating-point money.
- Acceptance scenarios in `acceptance/pricing.feature` map to domain tests.
- The module exports factories and pure functions; composition stays in `src/platform/api/root.ts`.
