# AI-assisted fejlesztési workshop — indulj innen

Ez az egynapos, magyar nyelvű workshop azt tanítja meg, hogyan építs egy
[agent-ready repót](materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak): olyan
fejlesztési működést, amelyben a specifikáció, az emberi döntések, a független review,
a gépi kapuk és a bizonyítékok együtt tartják a minőséget.

> **A termék a hordozható fejlesztési keretrendszer.** A hozzá tartozó webalkalmazás
> egy kifejezetten kitalált [validációs workload](materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak):
> reprezentatív terhelés, amellyel bizonyítjuk, hogy a keretrendszer üzleti szabállyal,
> adattal, felülettel és szállítási folyamattal együtt is működik.

Workshop: **2026. július 14., 09:00–17:00, Budapest** · A tananyag magyar, a kód,
a promptok és az agentutasítások angol nyelvűek.

## Melyik útvonal a tiéd?

Válassz egy sort, és először csak a **„Most ezt tedd”** lépést nyisd meg.

| Útvonal | Neked szól, ha… | Most ezt tedd |
|---|---|---|
| **Résztvevő — a workshop előtt** | még a környezetedet készíted elő | Kövesd a telepítési útmutatót ([repo](materials/setup-guide.md) · [web](https://cspiya.github.io/wshp-ai-dev-2026/materials/setup-guide.html)) elejétől a végén lévő ellenőrzésig. |
| **Résztvevő — a workshop közben** | már a helyszínen dolgozol | Nyisd meg a B0 — Bevezető notebookot ([offline](materials/notebooks/00-bevezeto.html) · [web](https://cspiya.github.io/wshp-ai-dev-2026/materials/notebooks/00-bevezeto.html)), és végezd el a C0-diagnózist. |
| **Résztvevő — a workshop után** | a saját projektedbe vinnéd át a módszert | Indulj a hazavihető toolkitből ([repo](toolkit/README.md) · [web](https://cspiya.github.io/wshp-ai-dev-2026/toolkit/)), és válaszd ki a következő bevezetendő képességet. |
| **Tréner** | a nap menetét, kapuit és tartalék útvonalait készíted elő | Ellenőrizd a napirend ([repo](materials/agenda.md) · [web](https://cspiya.github.io/wshp-ai-dev-2026/materials/agenda.html)) első blokkjának célját, idejét és kimenetét. |
| **Közreműködő vagy agent** | ezen a repón dolgozol vagy review-t végzel | Olvasd el a gyökér működési szerződését ([repo](AGENTS.md) · [web](https://cspiya.github.io/wshp-ai-dev-2026/AGENTS.html)), mielőtt feladatot veszel fel. |

A teljes modulválasztó a [tananyag-notebookok indexében](materials/notebooks/README.md), a
nap központi gondolatmenete pedig a [big picture](materials/big-picture.md) dokumentumban található.

## Mit építünk, és mivel bizonyítjuk?

Az alábbi statikus áttekintésben a felső sor a maradandó termék, az alsó sor annak
kitalált rendszerpróbája. Az alkalmazás nem váltja ki és nem előzi meg a keretrendszert.

```text
TERMÉK — AGENT-READY FEJLESZTÉSI KERETRENDSZER

C0 üres repo → C1 repoidentitás → C2 közös szakmai léc → C3 munkaszerződés
→ C4 független review → C5 gépi kapuk → C6 rendszerpróba → C7 hordozhatóság

A teljes C0–C7 keretrendszert validálja ↓
KITALÁLT VALIDÁCIÓS WORKLOAD
üzleti szabály + adat + UI + preview + tesztek + review-evidence
```

Ugyanez szemantikus táblázatként:

| Checkpoint | Mit adunk hozzá a működéshez? | Milyen bizonyíték jelzi, hogy működik? |
|---|---|---|
| **C0 — Üres repo** | Van technikai alap, de még nincs közös cél, szabály, minőségi léc vagy bizonyítható „kész”. | Rögzített kiinduló állapot és következő döntés. |
| **C1 — A repo tudja, mi ő** | Küldetés, scope, szabályok, érinthető és tiltott területek, valamint valódi parancsok kerülnek a repóba. | Az ember és az agent ugyanabból a repoidentitásból indul. |
| **C2 — Van közös szakmai léc** | Egyetlen kanonikus engineering standard, Definition of Done, architekturális határok és gépesíthető szabályok adják a mércét. | A léc közös, hivatkozható és linttel vagy teszttel kikényszeríthető. |
| **C3 — A kérésből munkaszerződés lesz** | Jóváhagyott spec, terv, feladatok és elfogadási kritériumok. | Az implementáció előtt ellenőrizhető a feladat jelentése és határa. |
| **C4 — Szétválik a szerző és a bíráló** | Külön builder, friss kontextusú reviewer és visszaellenőrzött javítás alkot [RUG-loopot](materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak). | A review-megállapítások sorsa és a javítás bizonyítéka visszakövethető. |
| **C5 — A kötelező rész mechanikusan fut** | [Szabály, skill, hook és gépi gate](materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak), valamint projektmemória a megfelelő helyen. | A fontos elvárások nem csak promptként, hanem reprodukálható helyi ellenőrzésben és CI-ben élnek. |
| **C6 — Kitalált, reprezentatív rendszerpróba** | A teljes alkalmazási út validálja a fejlesztési keretrendszert. | A kitalált workload UI-, API-, adat- és preview-útja ellenőrzött. |
| **C7 — Hordozható operating model** | Legacy-átvitel, csapatműködés és 30/60/90 napos bevezetés. | Saját környezetre szabott, mérhető következő lépések. |

Az egyes checkpointok részletes artifact- és evidence-szerződése az
[agent-ready repo térképen](materials/agent-ready-repo.md) olvasható.

## A repó négy területe

| Terület | Szerepe a tanulási ívben | Első hasznos belépő |
|---|---|---|
| `materials/` | Magyar tananyag, napirend, fogalomtár és önálló HTML-notebookok. | [B0 — Bevezető](materials/notebooks/00-bevezeto.html) |
| [`toolkit/`](toolkit/) | Hazavihető szabályok, sablonok, review-folyamatok és mechanikus kapuk. | [Toolkit áttekintő](toolkit/README.md) |
| [`participant-starter/`](participant-starter/) | Szándékosan minimális technikai alap, amely köré a résztvevő felépíti a saját agent-ready működését. | [Starter útmutató](participant-starter/README.md) |
| [`reference-app/`](reference-app/) | Kitalált referencia-workload és követhető mintaút; a keretrendszer rendszerpróbája, nem a workshop elsődleges terméke. | [Referenciaalkalmazás áttekintő](reference-app/README.md) |

### Munkatér a gyakorlatokhoz

A workshop során három testvérmappát használunk. A forrásanyagot olvassuk, a saját
munkát külön repóban végezzük, a nem publikus futási bizonyítékot pedig külön tartjuk:

```text
workshop-lab/
├── workshop-source/    ← ez a workshop-repo; olvasási forrás
├── participant-repo/   ← a saját, verziózott munka
└── workshop-evidence/  ← helyi, privát futási bizonyítékok
```

A pontos tulajdonosi és `cd`-szabályokat a
[notebookok munkatér-szerződése](materials/notebooks/README.md#közös-munkatér-szerződés)
rögzíti.

## Gyors tájékozódás

- A nap sorrendje és időkerete: [napirend](materials/agenda.md)
- A workshop teljes logikája: [big picture](materials/big-picture.md)
- Állomás → eredmény → bizonyíték térkép: [agent-ready repo](materials/agent-ready-repo.md)
- Kifejezések és .NET-párhuzamok: [fogalomtár](materials/fogalomtar.md)
- Modulok sorrendben: [tananyag-notebookok](materials/notebooks/README.md)
- Hogyan készült az anyag: [építési napló — 1. nap](materials/epitesi-naplo/day-1.md)

## Közreműködőknek

This public repository contains participant-shareable material and the invented reference
workload only. Internal design, production, sales, and delivery run-of-show artifacts stay
outside the repository. Work state lives in the
[wshp-ai-dev-2026 Linear project](https://linear.app/wenova/project/wshp-ai-dev-2026-3eae5243953d)
(workspace members only).

Before changing anything, follow [AGENTS.md](AGENTS.md) and [PARALLEL-WORK.md](PARALLEL-WORK.md):
one Linear issue, one branch, one worktree, an independent RUG review, trace evidence, and
human approval before any merge to `main`.

---

© Wenova · Workshop delivery: 2026-07-14 · License: materials MIT unless noted otherwise.
