# C0–C7 útlevél — a nap pecsétgyűjtője

Nyomtasd ki vagy töltsd ki digitálisan. Egy pecsét akkor jár, ha a hozzá tartozó
evidence-fájl létezik és megnyitható — **pecsét kizárólag evidence-fájlra adható,
sosem gyorsaságra**. Minden evidence a saját workspace-ed melletti
`workshop-evidence/` mappában él.

| Checkpoint | Mit igazol | Evidence-fájl | Pecsét |
|---|---|---|---|
| **C0 — környezet** | A gépeden minden eszköz fut (workshop doctor: PASS) | `workshop-evidence/C0-setup.md` | ☐ |
| **C1 — repo-identitás** | A repód friss agentnek is elmondja a célt, a scope-ot és a határokat | saját repo: `AGENTS.md` + `docs/engineering-standard.md` | ☐ |
| **C2 — közös léc és kapuk** | A kapu el is tud bukni: PASS → szándékos FAIL → helyreállított PASS | a negatív próba naplója + `workshop-evidence/module-05-quality-gate.md` | ☐ |
| **C3 — jóváhagyott spec** | Ötfájlos csomag explicit emberi döntéssel (APPROVED) | `constitution.md`, `spec.md`, `given-when-then.md`, `plan.md`, `tasks.md` | ☐ |
| **C4 — készítő lépés** | A jóváhagyott csomagból valódi commit lett, zöld kapukkal | `workshop-evidence/C4-maker.md` (benne a MAKER_SHA) | ☐ |
| **C5 — független review** | Lezárt review-tábla, javítás, indoklással elvetett hamis pozitív | `workshop-evidence/C5-review.md` (benne a FIX_SHA) | ☐ |
| **C6 — rendszerpróba** | Rétegzett bizonyítás: unit → contract → API → felület → adat | `workshop-evidence/C6-rendszerellenorzes/` (a 00–06 fájlok) | ☐ |
| **C7 — átültetés** | Memóriapróba új sessionben + kétagentes scorecard + 30/60/90 | `workshop-evidence/C7-memoria.md` + a három bevezetési fájl | ☐ |

## Evidence-bingó (3×3)

Egy mező akkor ikszelhető, ha az állítást evidence-fájl bizonyítja — a mező sarkába
írd oda a fájl nevét. Sor, oszlop vagy átló: bingó.

| Elutasított hamis pozitív (REJECTED + indoklás) | Zöld kontraktus-teszt két adapteren | Agent-vezérelt böngésző-bizonyíték |
|---|---|---|
| **REPLAY őszintén jelölve** | **MAKER_SHA + FIX_SHA lánc** | **Új-session memóriapróba** |
| **409-es hibaút a felületről** | **Snapshotból catch-up (jelölve)** | **A 47 perces puffer nem kellett** |

## A szabály

Pecsét és pont KIZÁRÓLAG evidence-fájlra adható, sosem gyorsaságra. Ha nincs fájl,
nem történt meg — és ez nem büntetés, hanem a nap központi tanulsága: a bizonyíték
a fejlesztési rendszer terméke, nem utólagos papírmunka.
