# Given–When–Then scenarios — KK-Regisztráció

> **Agent-run technical contract:** the exact checks in this executable specification
> are run by Claude Code or Codex and returned as evidence. They are not participant
> command-entry instructions.

`STATUS: C3-APPROVED-CONTRACT (trainer reference — a résztvevő saját csomagja ezt helyettesíti, ha APPROVED)`

**Magyar szándék (KITALÁLT):** a résztvevő névvel és e-mail-címmel regisztrálhat egy
meghirdetett műhelyre; a regisztráció a kezdés előtt 48 óráig mondható le — pontosan
48 órával a kezdés előtt már nem; ugyanarra a műhelyre ugyanazzal az e-mail-címmel nem
lehet két aktív regisztráció. Az alábbi végrehajtható szerződés angol.

All sample data is invented. The domain receives an injected clock, so every time-based
scenario is deterministic.

## SC-01A — valid registration is created and listed (AC-01)

**Given** the workshop `ws-2026-08-alap` exists in the invented catalog<br>
**And** no active registration exists for `panna.pelda@example.invalid` on that workshop<br>
**When** a visitor registers with name `Példa Panna` and that email<br>
**Then** the API responds `201` with an `active` registration<br>
**And** the registration appears in the list returned by `GET /api/registrations`

## SC-01B — invalid input is rejected (AC-01, failure path)

**Given** the workshop `ws-2026-08-alap` exists<br>
**When** a visitor submits a blank name or the email `not-an-email`<br>
**Then** the API responds `400` with error code `name-required` or `email-invalid`<br>
**And** no registration is created

## SC-02A — cancellation strictly before the 48h boundary succeeds (AC-02)

**Given** an `active` registration for a workshop starting at `2026-08-25T09:00:00Z`<br>
**And** the injected clock reads `2026-08-23T08:59:59.999Z` (one millisecond earlier than 48h before start)<br>
**When** the participant cancels the registration<br>
**Then** the registration status becomes `cancelled` with a recorded `cancelledAt`

## SC-02B — cancellation at EXACTLY 48h before start is rejected (AC-02, exclusive boundary)

**Given** an `active` registration for a workshop starting at `2026-08-25T09:00:00Z`<br>
**And** the injected clock reads `2026-08-23T09:00:00.000Z` (exactly 48 hours before start)<br>
**When** the participant requests cancellation<br>
**Then** the request is rejected — HTTP layer: `409` with body `{ "error": "cancellation window closed" }`<br>
**And** the persisted registration remains `active` and `cancelledAt` stays `null`

## SC-03A — duplicate active registration is rejected (AC-03)

**Given** an `active` registration for `panna.pelda@example.invalid` on `ws-2026-08-alap`<br>
**When** a visitor registers again with the same email on the same workshop<br>
**Then** the API responds `409` with error code `duplicate-registration`<br>
**And** only one active registration exists for that email + workshop<br>
**And** after cancelling the first registration, a new registration for the same pair succeeds

## Test mapping

| Scenario | AC | Test level/file | Agent-run check | Boundary values | Unchanged state on failure |
|---|---|---|---|---|---|
| SC-01A | AC-01 | unit — `src/lib/registrations/domain.test.ts` | `npm run test -- domain` | trimmed name, lowercased email | n/a |
| SC-01B | AC-01 | unit — `src/lib/registrations/domain.test.ts` | `npm run test -- domain` | blank name, malformed email | store unchanged |
| SC-02A | AC-02 | unit — `src/lib/registrations/domain.test.ts` | `npm run test -- domain` | window minus 1 ms | n/a |
| SC-02B | AC-02 | unit — `src/lib/registrations/domain.test.ts` | `npm run test -- domain` | EXACTLY 48h (exclusive) | status stays `active` |
| SC-03A | AC-03 | contract — `src/lib/registrations/repo-contract.test.ts` | `npm run test -- repo-contract` | active vs cancelled duplicate | single active row |

- Required fake/real adapter contract: `MemoryRegistrationRepo` and
  `FileRegistrationRepo` run the SAME shared contract suite (contract equality).
- Browser-agent observation: the agent starts the app, opens `/regisztracio`, and
  records the created row, duplicate error and cancel flow. Manual execution is an
  honestly labeled Plan B, never an automation PASS.
