# Task breakdown — KK-Regisztráció

> **Agent-run technical contract:** Claude Code or Codex executes every exact check and
> Git/API/browser operation, then records the evidence. The human approves scope,
> findings and progression; the participant does not reproduce command syntax.

`STATUS: C3-APPROVED-CONTRACT (trainer reference — a résztvevő saját csomagja ezt helyettesíti, ha APPROVED)`

## Input versions

- Constitution: C1 — [constitution.md](constitution.md)
- Spec: KK-REG C3 v1.0 — [spec.md](spec.md)
- Plan: P1-APPROVED-PLAN — [plan.md](plan.md)
- Human approval evidence: gate records in spec.md and plan.md (Kovács Rita — kitalált
  persona, 2026-07-13)

## Ordered tasks

| ID | Task/outcome | Exclusive scope | Accountable owner | Depends on/order | AC IDs | Agent-run verification | Evidence location | Status |
|---|---|---|---|---|---|---|---|---|
| TASK-01 | Pure domain: `Registration` types, `canCancel` with EXCLUSIVE 48h boundary, `createRegistration` validation + duplicate callback; unit tests incl. the exact-boundary case | `src/lib/registrations/domain.ts`, `domain.test.ts` | résztvevő | — (first) | AC-01, AC-02, AC-03 | `npm run test -- domain` | work item comment | ready |
| TASK-02 | `RegistrationRepo` port + in-memory adapter + ONE shared contract suite | `src/lib/registrations/repo.ts`, `memory-repo.ts`, `repo-contract.test.ts` | résztvevő | after TASK-01 | AC-03 | `npm run test -- repo-contract` | work item comment | ready |
| TASK-03 | File-backed adapter over `data/registrations.json` (temp+rename write, bootstrap from `data/registrations.seed.json`), passing the SAME contract suite; add the gitignore line | `src/lib/registrations/file-repo.ts`, `data/registrations.seed.json`, `.gitignore` | résztvevő | after TASK-02 | AC-03 | `npm run test -- repo-contract` | work item comment | ready |
| TASK-04 | API routes: `GET/POST /api/registrations` (400 invalid, 409 duplicate, 201 created) and `POST /api/registrations/[id]/cancel` (200, 409 `cancellation window closed`, 404 unknown) | `src/app/api/registrations/**` | résztvevő | after TASK-03 | AC-01, AC-02, AC-03 | Agent runs typecheck/tests and its available HTTP probe against `/api/registrations` | work item comment | ready |
| TASK-05 | `/regisztracio` page: form (name, email, workshop select), active list with cancel buttons, visible error surface for the 409 paths; Hungarian UI copy | `src/app/regisztracio/**` | résztvevő | after TASK-04 | AC-01, AC-02, AC-03 | Agent runs lint/build and browser-agent happy/failure paths at `/regisztracio` | work item comment | ready |

## Per-task execution contract

Before editing, the builder:

1. restates the linked ACs and scope;
2. reads repository instructions and canonical standards;
3. reports `DECISION REQUIRED` rather than inventing behavior;
4. runs the named checks and records command, exit code, and relevant output;
5. hands the artifact and evidence to an independent fresh-context review.

A task is done only when its ACs pass, accepted findings are fixed and re-verified, and
remaining risk has a human owner.

## Acceptance coverage matrix

Visszakövetési lánc a 3. modul mintája szerint (AC → scenario → task → check):

| AC ID | Scenario(s) | Owned task(s) | Dependencies/order | Agent-run check | Evidence location | Verdict |
|---|---|---|---|---|---|---|
| AC-01 | SC-01A, SC-01B | TASK-01, TASK-04, TASK-05 | TASK-01 → TASK-04 → TASK-05 | `npm run test -- domain` | work item comment | covered |
| AC-02 | SC-02A, SC-02B | TASK-01, TASK-04 | TASK-01 → TASK-04 | `npm run test -- domain` (exact 48h boundary case) | work item comment | covered |
| AC-03 | SC-03A | TASK-02, TASK-03, TASK-04 | TASK-02 → TASK-03 → TASK-04 | `npm run test -- repo-contract` | work item comment | covered |

## RUG execution and closed-gate handoff

- Builder restatement task: a C4 maker-blokk első lépése — a résztvevő (agentjével)
  visszamondja az AC-kat és a scope-ot, mielőtt fájlt módosít.
- Independent fresh-context reviewer task: module 4 — friss kontextusú reviewer a
  MAKER_SHA ellen (lásd [toolkit/golden-thread/README.md](../README.md)).
- Accepted-finding bounce-back owner/task: a résztvevő javít, FIX_SHA-t rögzít.
- Re-verification command and evidence location: `npm run typecheck && npm run lint &&
  npm run test` — work item comment.
- Closed-spec-gate packet location: this spec-package directory + work item comment.
- Statement that feature implementation has not started: igaz e csomag jóváhagyásakor;
  az implementáció a C4 maker-blokkban indul.

- [x] Every AC appears in the coverage matrix.
- [x] Every task has exactly one accountable owner and exclusive scope.
- [x] Dependencies and execution order are explicit, including review and bounce-back.
- [x] Every check is an executable command, not a generic test label.
- [x] Every evidence location is named before work starts.
- [x] No unresolved decision or instructional placeholder remains; `N/A` includes a reason.
- [x] Approved constitution, spec, and plan versions are recorded.
- [x] A human has approved entry into the later implementation phase.

## Decision and deviation log

| Decision/deviation | Owner | Options/impact or reason | Outcome | Evidence |
|---|---|---|---|---|
| D-01 exclusive 48h boundary | Kovács Rita (kitalált persona) | zárt vs. nyitott határ — a zárt (exclusive) határ ad egyértelmű, tesztelhető szabályt | RESOLVED | [spec.md](spec.md) |
| D-02 no auth in scope | Kovács Rita (kitalált persona) | auth kihagyása — a workload a rendszert validálja | RESOLVED | [spec.md](spec.md) |

## Common failures and Plan B

- **Hidden shared-file overlap:** pause; re-slice ownership before parallel edits.
- **Task exposes a product gap:** mark `BLOCKED` and return to the spec gate.
- **Configured check is unavailable:** record the failure; use the agreed local or
  trainer-owned fallback, but do not claim the original check passed.
- **Plan no longer fits the code:** document evidence and request plan re-approval;
  do not silently expand scope.
- **A résztvevő elakad a C4 blokk elején:** a tréner a `partial` snapshotból indít
  (catch-up), lásd [toolkit/golden-thread/README.md](../README.md).
