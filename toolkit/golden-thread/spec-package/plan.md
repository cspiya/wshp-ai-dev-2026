# Implementation plan — KK-Regisztráció

> **Agent-run technical contract:** exact commands are implementation evidence for
> Claude Code or Codex. The human supplies decisions and acceptance; the participant
> does not type or paste the syntax.

`STATUS: C3-APPROVED-CONTRACT (trainer reference — a résztvevő saját csomagja ezt helyettesíti, ha APPROVED)`

## Input contract

- Spec ID/version: KK-REG C3 v1.0 — [spec.md](spec.md)
- Constitution version: C1 — [constitution.md](constitution.md)
- Approval evidence: spec gate `APPROVED` by Kovács Rita (kitalált persona), 2026-07-13T10:30:00Z
- Acceptance criteria covered: AC-01, AC-02, AC-03
- Scope/file ownership: `src/lib/registrations/**`, `src/app/api/registrations/**`,
  `src/app/regisztracio/**`, `data/**` — a résztvevő saját workspace-én belül kizárólagos.
- Canonical engineering standard: [toolkit/standards/engineering-standards.md](../../standards/engineering-standards.md)

## Current-state evidence

- Relevant entry points: starter `src/app/` (App Router), `src/components/ui/`
  (shadcn/ui local source: Button, Card), `src/lib/utils.ts`.
- Existing tests/contracts: `src/lib/utils.test.ts` (vitest smoke) — must stay green.
- Constraints discovered: no database in the starter; no new npm dependencies allowed;
  vitest only picks up `src/**/*.test.{ts,tsx}`.
- Agent-run check commands confirmed: `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run build`.
- Plan assumptions that require validation: file store is single-user (demo);
  workshops catalog is read-only seed data.

## Smallest complete slice

| Step | Change and files/modules | Acceptance criteria | Agent-run verification | Owner |
|---|---|---|---|---|
| 1 | Pure domain: types, `canCancel` (exclusive 48h), `createRegistration` validation + duplicate callback — `src/lib/registrations/domain.ts` + `domain.test.ts` | AC-01, AC-02, AC-03 | `npm run test -- domain` | résztvevő |
| 2 | `RegistrationRepo` port + in-memory adapter + ONE shared contract suite — `repo.ts`, `memory-repo.ts`, `repo-contract.test.ts` | AC-03 (storage semantics) | `npm run test -- repo-contract` | résztvevő |
| 3 | File-backed adapter (`data/registrations.json`, temp+rename write, seed bootstrap) passing the SAME contract suite — `file-repo.ts`; gitignore addition | AC-03 | `npm run test -- repo-contract` | résztvevő |
| 4 | API routes: `GET/POST /api/registrations`, `POST /api/registrations/[id]/cancel` — composition root wires the file adapter | AC-01, AC-02, AC-03 (HTTP contract) | Agent runs typecheck and HTTP probes with its available API tooling | résztvevő |
| 5 | `/regisztracio` page: form, workshop select, active list with cancel, visible error surface (Hungarian UI copy) | AC-01, AC-02, AC-03 (observable UI) | Agent runs lint/build, then browser-agent happy and failure paths | résztvevő |

## Architecture and data impact

- Boundary/dependency direction: UI/API → port → adapters; domain imports nothing.
- Stable contracts preserved: existing starter pages and checks untouched.
- Schema/migration impact: none — JSON seed + gitignored runtime store.
- Authorization/privacy impact: none in scope (resolved D-02); invented data only.
- Compatibility/locale/time impact: ISO 8601 UTC everywhere; injected clock in domain,
  real clock at the composition root.

## Risks, alternatives, and rollback

- Chosen approach and why: file-backed JSON store — zero new dependencies, inspectable
  during the workshop, and forces a real port/adapter + contract-test conversation.
- Alternative rejected and why: in-memory only (no persistence across restarts —
  demo would lose state); SQLite/DB (new dependency, out of scope for the day).
- Risk / mitigation: concurrent writes could interleave → single-user demo store,
  temp-file + rename keeps the file parseable; contract suite pins semantics.
- Safe rollback/reversal: delete the slice directories and the gitignore line —
  no other file is touched.
- Residual risk requiring human ownership: none beyond the owned demo-store risk in
  [spec.md](spec.md).

## Plan gate and handoff

- [x] Spec and constitution versions are approved.
- [x] Plan does not add product behavior.
- [x] Scope and exclusive file ownership are agreed.
- [x] Every AC maps to a change and evidence.
- [x] Actual check commands are identified.
- [x] Reviewer roles are selected (independent fresh-context reviewer, module 4).
- [x] Human approved the plan or recorded an owned exception.
- [x] Every instructional placeholder is replaced, removed, or recorded as `N/A` with reason.

- Plan verdict: `APPROVED`
- Approved by/at: Kovács Rita (kitalált persona) / 2026-07-13T11:00:00Z
- Plan version: P1-APPROVED-PLAN
- Output plan version for [tasks.md](tasks.md): P1
