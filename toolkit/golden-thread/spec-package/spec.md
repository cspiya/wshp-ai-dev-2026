# Feature specification — KK-Regisztráció

`STATUS: C3-APPROVED-CONTRACT (trainer reference — a résztvevő saját csomagja ezt helyettesíti, ha APPROVED)`

Contract ID/version: KK-REG C3 v1.0
Constitution version/link: C1 — [constitution.md](constitution.md)
Human product owner: Kovács Rita (kitalált persona)

## Problem and observable outcome

- User/business problem (magyar szándék, KITALÁLT): a résztvevők névvel és
  e-mail-címmel jelentkezhessenek meghirdetett műhelyekre; a regisztráció a műhely
  kezdete előtt 48 óráig mondható le; ugyanarra a műhelyre ugyanazzal az e-mail-címmel
  ne lehessen két aktív regisztráció.
- Observable outcome: a `/regisztracio` oldalon űrlap + aktív lista lemondás-gombokkal;
  az API listáz, létrehoz és lemond; minden elutasítás látható hibaüzenettel jár.
- Out of scope: bejelentkezés, e-mail-értesítés, várólista, több nyelv, adatbázis
  (a tár file-backed JSON), fizetés.
- Why now: ez a nap egyetlen, központi validációs munkadarabja (C3→C7 golden thread).

## Actors and boundaries

- Actors and authorization: névtelen látogató (nincs auth — tudatos egyszerűsítés,
  lásd resolved decision D-02).
- Systems/data touched: `data/registrations.seed.json` (read-only invented catalog +
  seed rows), `data/registrations.json` (runtime store, gitignored).
- Privacy/public-content constraints: kizárólag kitalált adat; e-mail minták
  `example.invalid` domainnel.
- Existing contracts that must remain stable: `npm run typecheck && npm run lint &&
  npm run test` zöld marad; a starter meglévő oldalai változatlanok.
- Allowed file/module scope: `src/lib/registrations/**`, `src/app/api/registrations/**`,
  `src/app/regisztracio/**`, `data/**`.
- Forbidden decisions or areas: új npm függőség; a 48 órás határ értelmezésének
  megváltoztatása; valós adat bevitele.

## Acceptance criteria

Use observable language and link detailed scenarios from [given-when-then.md](given-when-then.md).

| ID | Observable behavior | Scenario | Required evidence |
|---|---|---|---|
| AC-01 | A valid registration (name + valid email + existing workshop) is created as `active` and appears in the list; invalid input is rejected with HTTP 400 and a visible error. | SC-01A, SC-01B | `npm run test -- domain` + manual UI check |
| AC-02 | Cancellation succeeds strictly earlier than 48 hours before the workshop start; at EXACTLY 48 hours before start (exclusive boundary) and inside the window it is rejected with HTTP 409 `cancellation window closed`, and the stored registration stays `active`. | SC-02A, SC-02B | `npm run test -- domain` (exact-boundary case included) |
| AC-03 | A second ACTIVE registration for the same email + workshop is rejected with HTTP 409 `duplicate-registration`; a cancelled registration does not block re-registration. | SC-03A | `npm run test -- repo-contract` + `npm run test -- domain` |

## Failure and edge behavior

- Invalid input: blank name → `name-required`; malformed email → `email-invalid`;
  unknown workshop id → `unknown-workshop`; all HTTP 400.
- Missing/duplicate/conflicting state: duplicate active registration → HTTP 409;
  cancel of unknown or already-cancelled id → HTTP 404.
- Authorization/ownership denial: N/A — no auth in scope (resolved decision D-02).
- External dependency failure: missing store file → recreated from the seed file;
  missing seed → empty catalog, empty list (no crash).
- Concurrency/time/locale considerations: single-user demo store; timestamps ISO 8601
  UTC; boundary rule evaluated with millisecond precision in the domain.
- State that must remain unchanged on failure: minden elutasított kérés után a tárolt
  regisztrációk változatlanok (rejected cancel leaves status `active`).

## Evidence required for done

- Automated tests and exact commands: `npm run test -- domain`,
  `npm run test -- repo-contract`, teljes kapu: `npm run typecheck && npm run lint && npm run test`.
- Manual verification: `npm run dev` → `/regisztracio`: sikeres regisztráció,
  duplikátum-hiba felülete, lemondás.
- Documentation/decision record: this spec package; deviations a work item kommentben.
- Required independent reviewer roles: friss kontextusú független reviewer (module 4).
- Evidence location: work item (Linear issue) comment — command, exit code, output tail,
  MAKER_SHA.

## Open decisions

Implementation cannot assume unresolved product behavior. Minden döntés lezárva:

| Decision | Owner | Deadline | Options and observable impact | Status |
|---|---|---|---|---|
| D-01: a 48 órás határ pontosan 48 óránál zárt vagy nyitott? | Kovács Rita (kitalált persona) | 2026-07-13 | KIZÁRÓ határ: pontosan 48 órával a kezdés előtt már NEM mondható le (a nyitott változat elutasítva). | RESOLVED — exclusive boundary (AC-02) |
| D-02: kell-e bejelentkezés a regisztrációhoz? | Kovács Rita (kitalált persona) | 2026-07-13 | Nem — a workload a rendszert validálja, nem az auth-ot; e-mail azonosít. | RESOLVED — no auth in scope |

## Builder restatement

Before planning or editing, the builder restates:

- problem and observable outcome;
- every acceptance criterion (AC-01, AC-02 with the EXCLUSIVE boundary, AC-03);
- in-scope/out-of-scope and stable contracts;
- unresolved decisions (none — D-01 and D-02 are resolved);
- planned evidence (commands above + MAKER_SHA).

Mismatch returns to specification; it is not corrected only in chat.

## Human spec gate

Gate verdict: `APPROVED`

- Contract version approved: KK-REG C3 v1.0
- Approved by: Kovács Rita (product owner — kitalált persona)
- Approved at: 2026-07-13T10:30:00Z
- Remaining owned risks: file-backed store nem konkurens — a tréner vállalja (demo-környezet).
- Next action: plan ([plan.md](plan.md)) → tasks ([tasks.md](tasks.md)) → C4 maker block.
