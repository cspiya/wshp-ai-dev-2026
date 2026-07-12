# Big picture — honnan indulunk és hová akarunk eljutni

*Wenova AI-Assisted Development Workshop — 2026.07 · a teljes anyag „északi csillaga"*

> Ez a dokumentum a workshop és a hozzá épülő referencia-projekt **teljes íve**: mi a kiinduló probléma,
> mi a célállapot, és miért pont ezen az úton megyünk. Minden további anyag (notebookok, építési napló,
> fogalomtár) ehhez a képhez igazodik. Szakszavak: [fogalomtár](fogalomtar.md).

## A workshop központi tézise

> **Nem egy webalkalmazást építünk AI-val. Egy megbízható
> [agent-ready fejlesztési keretrendszert](fogalomtar.md#agent-ready-repo) építünk, majd egy
> [validációs munkaterheléssel](fogalomtar.md#validation-workload) bizonyítjuk, hogy működik.**

A nap **elsődleges terméke** az agent-ready repo: szabályokkal, kanonikus standarddal, spec-kapuval,
[RUG-folyamattal](fogalomtar.md#rug), mechanikus gate-ekkel és visszakereshető bizonyítékokkal. Az alkalmazás
a rendszer **validációs workloadja**: reprezentatív üzleti, architekturális és infrastruktúra-terhelés, amelyen
kiderül, hogy a működési modell valóban alkalmas-e szoftverfejlesztésre. A teljes checkpoint-sor:
[Az agent-ready repo](agent-ready-repo.md).

| Kanonikus kérdés | Válasz ebben a repóban |
|---|---|
| Mi a termék? | Az agent-ready fejlesztési keretrendszer. |
| Mi az alkalmazás? | A keretrendszert próbára tevő validációs workload. |
| Hol él a munka állapota? | A [Linear-issue spec-, lease- és trace-adataiban](fogalomtar.md#linear-work-state); nincs külön handoff-fájl. |
| Milyen adat kerülhet a nyilvános példákba? | Csak [életszerű, de kifejezetten KITALÁLT](fogalomtar.md#invented-data) minta; ügyfél- és személyes adat nem. |

**A modell nem a módszer.** A tartós minőséget a repóban élő szerződések és visszacsatolási körök adják;
a modell, provider és coding agent cserélhető végrehajtó. Kiesés, korlátozás, technikai hiba, magas költség
vagy egy jobb modell megjelenése nem kényszerítheti ki a teljes fejlesztési működés újratervezését. A váltást
reprezentatív evalon, változatlan acceptance criteria és evidence-léc mellett validáljuk.

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

**A célközönség kiindulópontja:** tapasztalt fejlesztő- és BA-csapatok .NET / MS-SQL /
TFS–Azure DevOps környezetben, működő termékekkel és legacy kódbázissal. A kérdésük nem az, hogy „mi az az
AI", hanem: **hogyan kell ezt profin, iparági legjobb gyakorlat szerint csinálni — és hogyan vezethető be
a saját (részben legacy) világunkba?**

## 2. Hová akarunk eljutni — a célállapot

**A nap végén (személyes szint):**
- Mindenkinek van egy **saját agent-ready fejlesztési rendszere** a saját GitHub-repójában: repo-szabály,
  kanonikus standard, spec/plan/tasks, humán kapu, RUG, mechanikus ellenőrzések és run log.
- Van egy **reprezentatív, élő alkalmazási út**, amely nem puszta sikerélmény, hanem a fejlesztési
  rendszer end-to-end acceptance tesztje: bizonyítja, hogy üzleti szabállyal, adattal, hibával és
  deploymenttel is lehet vele dolgozni.
- Mindenki **végigcsinálta** (nem csak látta) a teljes kört: spec → terv → implementáció → verifikáció,
  emberi kapukkal; futtatott RUG-review-t; írt szabályt és hookot; látta, hogyan fogja meg a független
  bíráló azt, amit a zöld pipeline átengedett.
- Mindenki hazaviszi a **toolkitet**: referencia-architektúra, orchestrátor, sablonok, checklisták —
  másnap a saját projektjén használható.

**A workshop után (szervezeti szint):**
- 30/60/90 napos bevezetési út: egy squad, egy repo, spec-kapuk és metrikák → az egyéni tudásból
  **csapat-szokás**.
- A legacy környezetre (.NET / MS-SQL / Azure DevOps) is van adaptált playbook: biztonsági háló
  (characterization tesztek), strangler-fig modernizáció, agent-integráció a meglévő eszközláncba.

## 3. Az út — miért ez a sorrend?

| Szakasz | Miért itt van? |
|---|---|
| **Elméleti bevezető** (rövid!) | Közös fogalmi alap kell (agent, kontextus, spec-driven, RUG) — de csak annyi, hogy a gyakorlat érthető legyen. A tudás a csinálásból jön. |
| **Üres repo → agent-ready repo** | Előbb a fejlesztési működést építjük fel: mission, határok, standard, valódi gate-ek. A technikai starter csak hordozó, nem kész keretrendszer. |
| **Spec + RUG + mechanikus garanciák** | Minden következő blokk ugyanahhoz a repohoz ad egy új képességet. A résztvevő nem különálló toolokat lát, hanem fokozatosan felépít egy működési rendszert. |
| **Saját projekt mint validation workload** | A tudás akkor bizonyított, ha a rendszer reprezentatív fejlesztési terhelést is elbír. A referencia-app a másolható golden path; a saját alkalmazás a keretrendszer valós rendszerpróbája. |
| **Modell- és eszközcsere próba** | A működés akkor hordozható, ha ugyanazt a feladatot másik modellel vagy agent harnessszel is végig tudjuk vinni a spec, DoD és gate-ek újraírása nélkül. A váltás eredményét minőség, költség, latencia és review-terhelés alapján mérjük. |
| **Legacy blokk ezután** | Most már van viszonyítási alap: „így néz ki jól" → „így visszük be egy meglévő enterprise rendszerbe". A TFS/Azure DevOps demó kézzelfogható, de nem kell hozzá résztvevői környezet. |
| **Csapat + bevezetés a végén** | Az egyéni élményből itt lesz szervezeti terv — amikor már mindenki átélte, mit érdemes bevezetni. |

## 4. Mi épül a repóban, és miért?

```
wshp-ai-dev-2026/
├── materials/            ← tananyag (magyarul): fogalomtár, big picture, építési napló, notebookok
├── toolkit/              ← hazavihető készlet: orchestrátor, szabályok, hookok, sablonok, checklisták
├── participant-starter/  ← a résztvevő kiindulója: minimál starter, ebből épül a saját oldal
└── reference-app/        ← a referencia-implementáció: a „golden path", amiről mindenki másol
```

- **`reference-app`** — a mintakód: egy **képzés-webshop** (`workshops/` kurzus-CRUD + bejelentkezés
  (**Neon Auth** — a userek a saját Postgresünkben!) + `registrations/` jelentkezés és **visszamondás**
  státusz-szabályokkal + `pricing/` tiszta üzleti logika: listaár − kupon − csoportkedvezmény + ÁFA +
  `checkout/` fizetési folyamat). *Miért ez a téma?* (1) Az árazási és lemondási szabályok a saját
  működését [**életszerű, de KITALÁLT**](fogalomtar.md#invented-data) szabályokon gyakoroljuk — a
  BA-gyakorlaton magyar üzleti szabályból
  lesz angol elfogadási kritérium és tesztelt domain-függvény. (2) A fizetés `PaymentPort` mögött fake
  adapterrel épül (végigkattintható, tesztelhető), és később valódi adapterre cserélhető **a checkout-kód
  érintése nélkül** — ez maga a ports-and-adapters lecke. Az architektúra (vertical slice + kikényszerített
  boundary-k) maga a tananyag: **a jó architektúra az AI-minőség első számú karja** („egy modul = egy
  agent munkaterülete" → kevesebb token, kisebb hibaterjedés, párhuzamosítható agent-munka).
- **`participant-starter`** — szándékosan minimális technikai hordozó. Nem agent-ready késztermék: a
  résztvevő a workshopon építi köré a működési rendszert, majd az alkalmazással validálja azt.
- **`toolkit`** — a workshop elsődleges, maradandó termékének hordozható alkatrészkészlete: bármely
  projektben az agent-ready operating model kiindulópontja.
- **`materials`** — a tudás írott formája, magyarul, minden döntésnél a „miérttel".

## 5. Hogyan készül maga az anyag? (dogfooding — a folyamat a termék)

**A workshop-anyagot ugyanazzal a módszerrel építjük, amit tanítunk.** Minden feladat egy
[Linear-issue](fogalomtar.md#linear-work-state) (= a spec, elfogadási kritériumokkal); builder-agent
implementál; **független, friss kontextusú review**
(8 szempontú bírálat) ellenőrzi; a hibák bounce-back körben javulnak, amíg minden zöld — ez a
**Repeat-Until-Good** élesben. Az építés közben történteket az [építési napló](epitesi-naplo/) rögzíti —
a hibáinkkal együtt, mert **a megfogott hibák a legjobb tananyag** (lásd: Day 1, amikor a zöld CI után a
review 10 valódi hibát talált).

Ez egyben a modellfüggetlenség élő próbája is. A részfeladatokat különböző agentek folytathatják, mert az élő
munkaállapot a Linear-issue leírásában, lease- és trace-kommentjeiben van; **külön handoff-fájlt nem tartunk**.
A Git-commit a verziózott eredmény. A végrehajtó lecserélhető, miközben a közös spec, standard,
review-protokoll és mechanikus ellenőrzés változatlan marad. A tananyag minőségét a keretrendszer fogja össze,
nem egyetlen modell emlékezete vagy stílusa.

## 6. Térkép a többi dokumentumhoz

| Doksi | Mit találsz benne |
|---|---|
| [fogalomtár](fogalomtar.md) | Minden szakszó egy helyen (.NET-párhuzamokkal) |
| [építési napló](epitesi-naplo/) | Naponta: mit csináltunk, milyen döntéseket hoztunk és **miért** |
| [pluginek és skillek](plugins-es-skillek.md) | Mit használunk + a plugin/skill-rendszer korlátai |
| [setup-guide](setup-guide.md) | Résztvevői felkészülés (fiókok, telepítés) |
| [agenda](agenda.md) | A nap időrendje |
| notebooks/ | A modulonkénti tananyag (a napló + big picture tartalmából készül) |
