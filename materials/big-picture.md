# Big picture — honnan indulunk és hová akarunk eljutni

*Wenova AI-Assisted Development Workshop — 2026.07 · a teljes anyag „északi csillaga"*

> Ez a dokumentum a workshop és a hozzá épülő referencia-projekt **teljes íve**: mi a kiinduló probléma,
> mi a célállapot, és miért pont ezen az úton megyünk. Minden további anyag (notebookok, építési napló,
> fogalomtár) ehhez a képhez igazodik. Szakszavak: [fogalomtár](fogalomtar.md).

---

## 1. Honnan indulunk — az alapprobléma

**A szoftverfejlesztés éppen munkamódot vált.** Az AI-eszközök (coding agentek) ma már nem „okos
autocomplete-ek": képesek specifikációt írni, tervezni, implementálni, tesztelni és dokumentálni. Ez két
dolgot borít fel egyszerre:

1. **Az egyéni munka szintjén:** a fejlesztő ideje áthelyeződik a *gépelésről* a *irányításra és
   validálásra*. Aki ezt prompt-trükkökkel próbálja megoldani, az kiszámíthatatlan minőséget kap — aki
   folyamattal (spec-kapuk, review-hurkok, szabályok, tiszta kontextus), az megbízhatót. **A módszertan a
   termék, nem a prompt.**
2. **A csapat szintjén:** a fejlesztés annyira felgyorsul, hogy a szűk keresztmetszet máshová kerül — a
   **jó specifikáció, a review és a tesztelés** lesz a drága erőforrás (ezt hívjuk „demand shortage"
   jelenségnek). Ez felértékeli az üzleti elemzőt és a minőségbiztosítási fegyelmet.

**A konkrét kiindulópontunk (a résztvevők valósága):** tapasztalt fejlesztő- és BA-csapat, .NET / MS-SQL /
TFS–Azure DevOps környezetben, működő termékekkel és legacy kódbázissal. A kérdésük nem az, hogy „mi az az
AI", hanem: **hogyan kell ezt profin, iparági legjobb gyakorlat szerint csinálni — és hogyan vezethető be
a saját (részben legacy) világunkba?**

## 2. Hová akarunk eljutni — a célállapot

**A nap végén (személyes szint):**
- Mindenkinek van egy **saját, nulláról felépített, élő weboldala** a saját GitHub-repójában — nem azért,
  mert a weboldal a cél, hanem mert ez a **bizonyíték**, hogy a módszer működik a kezük alatt.
- Mindenki **végigcsinálta** (nem csak látta) a teljes kört: spec → terv → implementáció → verifikáció,
  emberi kapukkal; futtatott RUG-review-t; írt szabályt és hookot; látta, hogyan fogja meg a független
  bíráló azt, amit a zöld pipeline átengedett.
- Mindenki hazaviszi a **toolkitet**: referencia-architektúra, orchestrátor, sablonok, checklisták —
  másnap a saját projektjén használható.

**A workshop után (szervezeti szint):**
- 30/60/90 napos bevezetési út: egy squad, egy repo, spec-kapuk és metrikák → az egyéni tudásból
  **csapat-szokás**. (A Wenova-ív: educate → transform → build; learn → change → create.)
- A legacy környezetre (.NET / MS-SQL / Azure DevOps) is van adaptált playbook: biztonsági háló
  (characterization tesztek), strangler-fig modernizáció, agent-integráció a meglévő eszközláncba.

## 3. Az út — miért ez a sorrend?

| Szakasz | Miért itt van? |
|---|---|
| **Elméleti bevezető** (rövid!) | Közös fogalmi alap kell (agent, kontextus, spec-driven, RUG) — de csak annyi, hogy a gyakorlat érthető legyen. A tudás a csinálásból jön. |
| **Greenfield először** | Zöldmezőn a legjobb gyakorlat **tisztán** tanítható — nincs legacy-teher, minden döntés friss. Aki a tiszta mintát ismeri, az tudja majd adaptálni a nehezebb terepre; fordítva nem megy. |
| **Saját projekt (golden thread)** | A tudás akkor tapad, ha a sajátodon csinálod. A tréner referencia-appja a **másolható minta**; a résztvevő saját oldala a **gyakorlóterep**. |
| **Legacy blokk ezután** | Most már van viszonyítási alap: „így néz ki jól" → „így visszük be a meglévő rendszerbe". Demó a saját Billzone-projektünkön (TFS/Azure DevOps), kézzelfogható, de nem kell hozzá résztvevői környezet. |
| **Csapat + bevezetés a végén** | Az egyéni élményből itt lesz szervezeti terv — amikor már mindenki átélte, mit érdemes bevezetni. |

## 4. Mi épül a repóban, és miért?

```
wshp-ai-dev-2026/
├── materials/            ← tananyag (magyarul): fogalomtár, big picture, építési napló, notebookok
├── toolkit/              ← hazavihető készlet: orchestrátor, szabályok, hookok, sablonok, checklisták
├── participant-starter/  ← a résztvevő kiindulója: minimál starter, ebből épül a saját oldal
└── reference-app/        ← a referencia-implementáció: a „golden path", amiről mindenki másol
```

- **`reference-app`** — a mintakód: egy **képzés-jelentkezés mini-app** (`workshops/` kurzus-CRUD +
  `registrations/` jelentkezés-státuszfolyam + `pricing/` tiszta üzleti logika: listaár − kupon −
  csoportkedvezmény + ÁFA). *Miért ez a téma?* Mert az árazási szabályai a saját ajánlatunk **valódi**
  szabályai — a BA-gyakorlaton így igazi magyar üzleti szabályból lesz angol elfogadási kritérium és
  tesztelt domain-függvény. Az architektúra (vertical slice + kikényszerített boundary-k) maga a tananyag:
  azt demonstrálja, hogy **a jó architektúra az AI-minőség első számú karja** („egy modul = egy agent
  munkaterülete" → kevesebb token, kisebb hibaterjedés, párhuzamosítható agent-munka).
- **`participant-starter`** — szándékosan butított kiinduló: 15 perc alatt zöld build + élő preview, hogy
  az első élmény a *siker* legyen, ne a konfiguráció.
- **`toolkit`** — a workshop után ez a maradandó érték: bármely projektbe bedobható.
- **`materials`** — a tudás írott formája, magyarul, minden döntésnél a „miérttel".

## 5. Hogyan készül maga az anyag? (dogfooding — a folyamat a termék)

**A workshop-anyagot ugyanazzal a módszerrel építjük, amit tanítunk.** Minden feladat egy Linear-issue
(= a spec, elfogadási kritériumokkal); builder-agent implementál; **független, friss kontextusú review**
(8 szempontú bírálat) ellenőrzi; a hibák bounce-back körben javulnak, amíg minden zöld — ez a
**Repeat-Until-Good** élesben. Az építés közben történteket az [építési napló](epitesi-naplo/) rögzíti —
a hibáinkkal együtt, mert **a megfogott hibák a legjobb tananyag** (lásd: Day 1, amikor a zöld CI után a
review 10 valódi hibát talált).

## 6. Térkép a többi dokumentumhoz

| Doksi | Mit találsz benne |
|---|---|
| [fogalomtár](fogalomtar.md) | Minden szakszó egy helyen (.NET-párhuzamokkal) |
| [építési napló](epitesi-naplo/) | Naponta: mit csináltunk, milyen döntéseket hoztunk és **miért** |
| [pluginek és skillek](plugins-es-skillek.md) | Mit használunk + a plugin/skill-rendszer korlátai |
| [setup-guide](setup-guide.md) | Résztvevői felkészülés (fiókok, telepítés) |
| [agenda](agenda.md) | A nap időrendje |
| notebooks/ | A modulonkénti tananyag (a napló + big picture tartalmából készül) |
