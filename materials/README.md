# Tananyag-navigátor — innen indulj

Ez a workshop egyetlen, végigvezetett építési ív: **C0 üres repóból C7 hordozható
agent-ready működési modell** lesz. Az alkalmazás nem a nap fő terméke, hanem az a
validációs terhelés, amely bizonyítja, hogy a felépített rendszer valószerű, de kitalált
helyzetben is működik.

> **Első alkalommal vagy itt?** Résztvevőként kezdd a
> [workshop előtti útvonallal](#resztvevo), majd a workshopon mindig a
> [napi térképen](#napi-terkep) keresd meg az aktuális időt és checkpointot.

**Megjelenítési módok:** [webes tananyag](index.html) ·
[publikált webes tananyag](https://cspiya.github.io/wshp-ai-dev-2026/materials/) ·
[forrás a GitHubon](https://github.com/cspiya/wshp-ai-dev-2026/tree/main/materials) ·
offline: klónozd a repót, majd nyisd meg a `materials/index.html` fájlt.

## Válassz útvonalat

<a id="resztvevo"></a>
### Résztvevő

1. **Előtte:** végezd el a [felkészülési útmutatót](setup-guide.md), majd olvasd el a
   [napirendet](agenda.md) és a [nagy képet](big-picture.md).
2. **Közben:** nyisd meg az aktuális notebookot a [napi térképből](#napi-terkep), és csak a
   `participant-repo/` mappában végezz résztvevői feature-munkát.
3. **Utána:** fejezd be az utolsó hiányzó checkpoint bizonyítékát, majd a
   [G7 önellenőrzésével](notebooks/07-team-adoption.html) készíts 30/60/90 napos tervet.

### Tréner

Ez a nyilvános útvonal nem tartalmaz belső run-of-show vagy hozzáférési adatot.

1. **Előtte:** ellenőrizd a [napirendet](agenda.md), a [setup és Plan B lépéseket](setup-guide.md),
   valamint a [notebook-szerződést](notebooks/README.md).
2. **Közben:** a [napi térképen](#napi-terkep) kövesd az időt, az elkészítendő artifactot és a
   látható evidence-et; elakadásnál használd az adott notebook Plan B-jét.
3. **Utána:** a C0–C7 audit és a [napló](epitesi-naplo/) alapján válaszd szét a humán és az
   agent-loop tanulságait. A belső szállítási forgatókönyv nem része ennek a publikus repónak.

### Contributor vagy agent

1. **Előtte:** olvasd el a gyökér `AGENTS.md`-et és a
   [kanonikus anyagstandardot](../toolkit/standards/material-standards.md); munkát csak kiosztott
   Linear issue-n kezdj.
2. **Közben:** egy issue = egy branch = egy worktree; az issue-spec és a lease komment mutatja,
   hol tart a munka. Ne hozz létre külön handoff-fájlt.
3. **Utána:** futtasd a material-validátorokat, kérj friss kontextusú review-t, és az issue-ban
   rögzítsd a commit SHA-t, a bizonyítékot és a maradék kockázatot.

## A három munkatér határa

Mindhárom mappa ugyanabban a választott `workshop-lab/` könyvtárban legyen:

| Mappa | Gazda | Mire való | Mi nem kerül ide? |
|---|---|---|---|
| `workshop-source/` | tréner / tananyag | Olvasd innen a tananyagot, toolkitet és a referencia-workloadot. | Résztvevői feature-munka és privát evidence. |
| `participant-repo/` | résztvevő | Itt épül a saját agent-ready repo, a spec, a kód és a verziózott bizonyíték. | Workshop-forrás módosítása, titok vagy személyes adat. |
| `workshop-evidence/` | résztvevő, lokálisan | Nem publikus képernyőkép és helyi ellenőrzési nyom. | Titok, ügyféladat és automatikusan publikálandó artifact. |

Minden parancs előtt ellenőrizd a munkakönyvtárat. A notebook `cd` lépése mondja meg, ha váltani kell.

<a id="napi-terkep"></a>
## A nap térképe: idő → checkpoint → bizonyíték

A sorok sorrendje a követendő tananyag-sorrend. A **Checkpoint** oszlop mutatja, meddig jutottál;
az **Artifact** az elkészített munkadarab, az **Evidence** pedig az ellenőrizhető bizonyíték.

| Idő | Blokk | Checkpoint | Artifact | Látható evidence | Notebook |
|---|---|---|---|---|---|
| 09:00–09:45 | Bevezető, C0-diagnózis | C0 | saját kiinduló állapot és kockázattérkép | kitöltött diagnózis, kimondott emberi kapuk | [B0 — Bevezető](notebooks/00-bevezeto.html) |
| 09:45–10:45 | Agent-ready alap és szállítópálya | C1–C2 | repoalkotmány, `AGENTS.md`, standard és első kapuk | futó parancsok, zöld és szándékosan bukó gate | [G1 — Greenfield setup](notebooks/01-greenfield-setup.html) |
| 11:00–11:45 | Spec-vezérelt SDLC + BA-kapu | C3 | jóváhagyott spec-package | Given–When–Then kritériumok és BA-döntés | [G2 — Spec-driven](notebooks/02-spec-driven.html) |
| 11:45–12:30 | Orchestrátor + Repeat-Until-Good | C4 | builder/reviewer/fixer futásnyom | deduplikált finding, verifikált fix, re-review | [G3 — RUG](notebooks/03-orchestrator-rug.html) |
| 13:15–14:00 | Szabályok, skillek, hookok, memória | C5 | megfelelő rétegbe tett szabály és mechanikus guard | pozitív futás + negatív fixture exit code-ja | [G4 — Mechanikus garanciák](notebooks/04-rules-skills-hooks.html) |
| 14:00–14:45 | Rendszerpróba: QA, preview, adat, E2E | C6 | reprezentatív validation workload | unit/contract/E2E + preview/API/DB bizonyítéklánc | [G5 — QA és E2E](notebooks/05-qa-e2e-token.html) |
| 15:00–16:15 | Legacy-transzfer | C6 → C7 | karakterizációs háló és kijelölt seam | befagyasztott jelenlegi viselkedés, regressziós teszt | [G6 — Legacy](notebooks/06-legacy-dotnet.html) |
| 16:15–17:00 | Csapatbevezetés és záró audit | C7 | owner-, eval- és 30/60/90 terv | teljes C0–C7 audit és következő jóváhagyott lépés | [G7 — Team adoption](notebooks/07-team-adoption.html) |

A szünetekkel és tréneri vágási pontokkal együtt a [napirend](agenda.md) az időzítés kanonikus forrása.

## Hol tartok? — C0–C7 önpozicionálás

Az első olyan sort válaszd, amelynek bizonyítékát még nem tudod megmutatni. **Onnan folytasd**;
ne a fájlnévből vagy emlékezetből következtess.

| Állapot | Akkor vagy itt, ha… | Következő lépés |
|---|---|---|
| C0 · Üres repo | van repo, de nincs közös cél, szabály és bizonyítható kész állapot | B0 diagnózis, majd G1 |
| C1 · A repo tudja, mi ő | mission, scope, instrukció és valódi parancsok már láthatók | add hozzá a közös szakmai lécet |
| C2 · Közös szakmai léc | maker és reviewer ugyanazt a standardot és DoD-t használja | alakítsd a kérést jóváhagyható speccé |
| C3 · Munkaszerződés | a spec, scope és Given–When–Then kritérium ember által jóváhagyott | futtasd külön szerzővel és bírálóval |
| C4 · Független review | a finding reprodukált, a fix visszaellenőrzött és nyomkövetett | tedd mechanikussá a kötelező szabályt |
| C5 · Mechanikus kapuk | pozitív és negatív futás bizonyítja, hogy a gate valóban blokkol | terheld valószerű, összetett workloaddal |
| C6 · Rendszerpróba | az üzleti szabálytól a preview/adat/E2E bizonyítékig zár a lánc | tedd hordozhatóvá modellre, legacyra és csapatra |
| C7 · Operating model | van owner, eval, trace, toolkit és 30/60/90 bevezetési terv | válaszd ki a következő reprezentatív feature-t |

A checkpointok részletes definíciója: [Az agent-ready repo](agent-ready-repo.md).

## Háttér és visszakeresés

- [Big picture](big-picture.md) — miért ez az építési sorrend, és mi a workshop elsődleges terméke.
- [Fogalomtár](fogalomtar.md) — szakszavak magyar magyarázattal és .NET-párhuzamokkal.
- [Mérnöki standardok](mernoki-standardok.md) — hogyan kap ugyanazt a lécet a maker és a reviewer.
- [Pluginek és skillek](plugins-es-skillek.md) — eszközök, döntések és korlátok.
- [Notebook author/reviewer szerződés](notebooks/README.md) — tananyag-készítési és review-szabályok.
- [Építési napló](epitesi-naplo/) — hogyan épült a workshop ugyanazzal a módszerrel, amelyet tanít.
