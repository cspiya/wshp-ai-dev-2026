# Project constitution — KK-Regisztráció (trainer reference)

> **Agent-run technical contract:** exact commands below are selected and executed by
> Claude Code or Codex. The human approves behavior, scope and evidence; the participant
> is never required to reproduce the syntax.

`STATUS: C3-APPROVED-CONTRACT (trainer reference — a résztvevő saját csomagja ezt helyettesíti, ha APPROVED)`

Ez a csomag a workshop KITALÁLT munkadarabjához készült referencia. Minden név,
e-mail-cím, dátum és üzleti adat kitalált. Az üzleti szándék magyarul, a technikai
szerződés (ID-k, parancsok, kritériumok) angolul szerepel.

## Identity and mission

- Product/repository mission: a résztvevői starter repo (Next.js App Router +
  TypeScript + Tailwind + shadcn/ui) agent-ready fejlesztési rendszerré alakítva;
  a KK-Regisztráció az egyetlen, kitalált validációs workload, amely a spec-kaputól
  a review-zott eredményig végigmegy.
- Primary users and outcomes: workshop-résztvevők; kimenet egy működő, tesztelt,
  review-zható regisztrációs szelet.
- Explicit non-goals: éles üzemeltetés, adatbázis, autentikáció, e-mail-küldés,
  fizetés — ezek a napon kívül esnek.

## Non-negotiable boundaries

- Allowed modules/data: `src/lib/registrations/**`, `src/app/api/registrations/**`,
  `src/app/regisztracio/**`, `data/registrations.seed.json`; runtime store:
  `data/registrations.json` (gitignored).
- Forbidden modules/data: `src/components/ui/**` átírása a feature kedvéért; új npm
  függőség; bármely, a szelethez nem tartozó fájl.
- Stable public contracts: `RegistrationRepo` port (list/create/findActiveByEmail/cancel);
  API status codes (400 invalid, 404 unknown, 409 duplicate / window closed, 201 created).
- Authorization and privacy invariants: nincs valós személyes adat; minden minta-adat
  kitalált (`example.invalid` domainű e-mail-címek).
- Public-repository hygiene: no client names, pricing, invite links, secrets, or real
  personal data — invented sample data only.
- Supported compatibility/locale/time assumptions: minden időpont ISO 8601 UTC;
  a lemondási határ 48 óra, KIZÁRÓ (exclusive) határértékkel; a domain befecskendezett
  órát (injected clock) kap, a UI/API a valós `Date`-et használja.

## Canonical standards and real gates

- Repository instructions: `AGENTS.md` (participant workspace root).
- Engineering standard: [toolkit/standards/engineering-standards.md](../../standards/engineering-standards.md).
- Required check commands:
  - Format/lint: `npm run lint`
  - Type/build: `npm run typecheck` (release-készültséghez: `npm run build`)
  - Unit/contract/integration: `npm run test`
  - End-to-end: the agent starts the app and uses the browser agent on `/regisztracio`;
    manual browser execution is an honestly labeled Plan B, never an automation PASS
  - Security/public-content: invented-only sample data review a diffben
- Evidence location: a work item (Linear issue) kommentje — parancs, exit code, kimenet-vég.

## Decision authority

| Decision type | Human owner | Agent may decide? | Escalation path |
|---|---|---|---|
| Product behavior | Kovács Rita (product owner — kitalált persona) | no | `DECISION REQUIRED` |
| Architecture inside approved boundaries | résztvevő (fejlesztő) | with evidence | review |
| Security/privacy exception | tréner | no | stop and escalate |
| Scope change | Kovács Rita (kitalált persona) | no | return to spec gate |

## Change control

- Constitution version: C1
- Approved by: Kovács Rita (product owner — kitalált persona)
- Approved at: 2026-07-13T10:00:00Z
- Next review: a workshop napján, a C4 maker-blokk előtt
- Supersedes: none

A feature that conflicts with this constitution is `BLOCKED` until a human owner changes
the constitution or the feature. The implementation agent must not invent an exception.

## Constitution gate

- [x] Mission and non-goals are explicit.
- [x] Boundaries and stable contracts are named.
- [x] Real check commands and evidence location are known.
- [x] Decision owners are named.
- [x] No unresolved contradiction exists.
- [x] Human approval, version, and timestamp are recorded.
