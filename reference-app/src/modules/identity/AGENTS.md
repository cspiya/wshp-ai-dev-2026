# identity module — agent instructions

- Scope your work to this folder; a change here must not require edits in other
  modules. If it does, the contract is wrong — stop and flag it.
- Only `identity.contract.ts` is public. Never export internals for convenience.
- `domain/` stays pure: no imports from platform, infra, React, or Next.
- Every use-case in `application/` gets a Vitest test next to it.
- Acceptance criteria live in `acceptance/*.feature` (English, Given-When-Then);
  each criterion maps to at least one test.
- Local checks before you call it done:
  `npm run typecheck && npm run lint && npm run test`
