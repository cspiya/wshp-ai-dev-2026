# `identity` module — boundary-demo stub (the golden path is `workshops/`)

One bounded context = one vertical slice = one subagent's working set.
This module is deliberately kept as the **minimal empty-module boundary demo**:
it shows the smallest shape a module can have, and the lint-boundary regression
tests (`src/platform/lint-boundaries.test.ts`) reference its files as fixtures.
**Do NOT copy this to add a feature** — copy the fully-built golden path,
[`src/modules/workshops/`](../workshops/README.md) (schema + tRPC CRUD + UI +
tests; see `docs/adr/0001-workshops-is-the-golden-path.md`).

## Layout

| Folder | What lives here | May import |
|---|---|---|
| `domain/` | Entities, value objects, pure logic | **nothing outward** (pure TS only) |
| `application/` | Use-cases (commands/queries) + ports (interfaces) | `domain/` |
| `infra/` | Drizzle schema + adapters implementing the ports | `application/` ports, `@/platform/*` |
| `ui/` | React components for this slice only | `application/`, `@/components/ui/*` |
| `acceptance/` | Gherkin `.feature` acceptance criteria (map to tests) | — |
| `identity.contract.ts` | The module's public API — the ONLY import surface for other modules | — |

## Invariants

- Other modules import **only** `identity.contract.ts` (lint-enforced).
- Auth is a **stub** in this workshop — real auth/RBAC is deliberately out of scope.
- *(convention)* Inside the module use relative imports; the `@/` alias is for
  crossing boundaries.
