# Spec-first munkacsomag — BA + fejlesztő

Ez a G2 labor a [spec-driven development](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak)
egyetlen, ismételhető átadási láncát gyakoroltatja:

`constitution → specify → plan → tasks → implement → verify`

A BA magyarul tisztázza a szándékot és a példákat. A repóba kerülő technikai
szerződés, [acceptance criteria](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak),
[Given–When–Then](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak) scenario,
[prompt](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak) és kód angol.
A labor a lezárt spec-kapunál megáll: **feature-implementációt nem indít, nem kér és nem
engedélyez**.

## Miért ez a sorrend?

- A **constitution** rögzíti a nem alku tárgyát képező szervezeti és repószabályokat.
- A **spec** a kérést megfigyelhető, jóváhagyható munkaszerződéssé alakítja.
- A **plan** a jóváhagyott viselkedésből készít technikai megközelítést.
- A **tasks** kis, tulajdonolt és külön ellenőrizhető munkadarabokra bont.
- Az **implement** kizárólag jóváhagyott szerződésből dolgozhat — de nem része ennek a labornak.
- A **verify** a kritériumokat futtatott [evidence-hez](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak)
  köti — ezt a labor csak előre megtervezi.

Gondoljatok rá úgy, mint egy .NET-es Azure Boards work itemre: a magyar üzleti igényből
SpecFlow-scenario lesz, a terv megnevezi az ASP.NET Core/SQL Server érintést, a taskok pedig
Azure DevOps build policy parancsaihoz és teszteredményeihez kötnek minden kritériumot.
A különbség az, hogy itt ezek nem szétszórt mezők: verziózott, kapuzott csomagot alkotnak.
Ez a hasonlat technikai minta, nem valós ügyfélrendszer leírása.

## Cél és pontos végállapot

Egy **INVENTED** workshop-regisztrációs igényt az előző G1 gyakorlatban elkészített
[agent-ready repóból](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak)
egy `C3-CLOSED-SPEC-GATE` átadási csomagig visztek. A csomagban jóváhagyott és verziózott
constitution, spec és plan, teljes task-/evidence-mátrix, valamint a független
[RUG](../../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak) végrehajtás indító
utasítása áll. Egyetlen feature-fájl sem változik.

## Előfeltétel és induló repóállapot

A labor csak akkor indulhat, ha mind igaz:

1. A G1 agent-ready checkpoint elkészült: a repó gyökerében olvasható agent-instrukció,
   kanonikus engineering standard és valóban futtatható ellenőrző parancsok vannak.
2. Van ember által Todo/In Progress állapotba tett, kizárólag ehhez a gyakorlathoz tartozó
   work item/issue, benne outcome, scope, korlátok és acceptance criteria.
3. A résztvevők a repó gyökerében, egy tiszta, az issue-hoz tartozó task branchen/worktree-ben
   állnak. A `git status --short` kimenete üres.
4. A `toolkit/spec-templates/` könyvtár elérhető, és a BA/product owner megnevezhető.
5. A feature jelenlegi állapota változatlan; a labor alatt kizárólag a
   `docs/spec-package/` munkapéldányai módosulhatnak.

Indulás előtt futtassátok a repó gyökerében:

```powershell
$env:G2_START_SHA = git rev-parse HEAD
Write-Output $env:G2_START_SHA
git branch --show-current
git status --short
Get-ChildItem toolkit/spec-templates -File
```

**Elvárt eredmény:** task branch neve, üres státusz és a hat sablonfájl listája. Ha nem ez
látszik, ne kezdjétek el az 1. lépést: váltsatok a kijelölt worktree-re, tegyétek félre a
nem ide tartozó munkát, vagy kérjetek trainertől tiszta G1 checkpointot.

## 35 perces páros labor — végrehajtható lépések

Minden promptot változtatás nélkül, angolul adjatok az agentnek. Az agent válaszát a BA és
a fejlesztő ellenőrzi; az agent nem adhat saját magának kapujóváhagyást.

### 1. Munkapéldányok létrehozása

**Előfeltétel:** az induló állapot ellenőrzése sikeres.

**Célfájlok:** `docs/spec-package/{constitution,spec,given-when-then,plan,tasks}.md`.

```powershell
New-Item -ItemType Directory -Force docs/spec-package | Out-Null
Copy-Item toolkit/spec-templates/constitution.md docs/spec-package/constitution.md
Copy-Item toolkit/spec-templates/spec.md docs/spec-package/spec.md
Copy-Item toolkit/spec-templates/given-when-then.md docs/spec-package/given-when-then.md
Copy-Item toolkit/spec-templates/plan.md docs/spec-package/plan.md
Copy-Item toolkit/spec-templates/tasks.md docs/spec-package/tasks.md
```

**Másolható agent prompt:**

```text
Read the repository instructions and canonical engineering standard. Inspect only; do not
edit feature files. Confirm that docs/spec-package contains fresh copies of the five
toolkit/spec-templates files, report the allowed documentation scope, and list the real
repository verification commands. Return DECISION REQUIRED for every missing prerequisite.
```

**Elvárt eredmény:** öt célfájl, a `docs/spec-package/**` scope visszamondása és valós
checklista.

**Evidence:** a parancsok kimenete és `git status --short` a work item kommentjében.

**Recovery / Plan B:** hiányzó sablonnál álljatok meg és kérjétek a G1 checkpointot; ne
hozzatok létre emlékezetből helyettesítő sablont.

### 2. Constitution lezárása

**Előfeltétel:** az 1. lépés öt fájlja létezik.

**Célfájl:** `docs/spec-package/constitution.md`.

**Másolható agent prompt:**

```text
Fill docs/spec-package/constitution.md from the repository instructions, canonical standard,
active issue, and actual check configuration. Do not invent rules or commands. Name human
decision owners, record constitution version C1, and leave no instructional placeholder.
If a field does not apply, write N/A with a reason. Do not edit any other file.
```

**Elvárt eredmény:** `C1` verziójú, emberi ownerrel és tényleges parancsokkal kitöltött
constitution; minden gate checkbox ellenőrizhető.

**Evidence:** constitution linkje/verziója és `git diff -- docs/spec-package/constitution.md`.

**Recovery / Plan B:** ismeretlen szabály vagy parancs esetén `DECISION REQUIRED — owner —
deadline`; a constitution kapu `BLOCKED`, a labor nem lép tovább.

### 3. Magyar szándékból bounded spec

**Előfeltétel:** a constitution `C1` ember által elfogadott.

**Célfájl:** `docs/spec-package/spec.md`.

**INVENTED magyar üzleti szándék:** „A résztvevő lemondhassa a saját, megerősített
regisztrációját, de a kezdés előtti 24 órában már ne változzon az állapot.”

**Másolható agent prompt:**

```text
Using constitution C1 and the active issue, fill docs/spec-package/spec.md in English for
the INVENTED Hungarian cancellation intent provided by the BA. Define observable outcome,
actors, authorization, in-scope and out-of-scope boundaries, stable contracts, failure
behavior, AC IDs, evidence types, and owned open decisions. Do not propose architecture or
implementation. Use N/A with a reason where appropriate; do not leave placeholders.
```

**Elvárt eredmény:** verziójelölt bounded spec, legalább happy és negatív AC-val, stabil
contracttal, unchanged-state elvárással és tulajdonolt döntésekkel.

**Evidence:** `docs/spec-package/spec.md` link/verzió és diff.

**Recovery / Plan B:** túl nagy scope esetén egyetlen végigérő viselkedés maradjon in scope;
a többi legyen név szerint out of scope. Ismeretlen termékviselkedés nem feltételezés, hanem
`DECISION REQUIRED`.

### 4. Végrehajtható acceptance scenario-k

**Előfeltétel:** a 3. lépés minden AC-ja azonosítóval rendelkezik.

**Célfájl:** `docs/spec-package/given-when-then.md`.

**Másolható agent prompt:**

```text
Replace the instructional examples in docs/spec-package/given-when-then.md with English
Given-When-Then scenarios for every acceptance criterion in docs/spec-package/spec.md.
Cover the happy path and the protected 24-hour negative path, including unchanged persisted
state. Map each scenario to an AC, exact planned check command, evidence location, and
meaningful boundary value. Do not write tests or feature code.
```

**Elvárt eredmény:** minden AC-hoz legalább egy megfigyelhető scenario és konkrét tervezett
evidence; a negatív ág állapotváltozatlansága explicit.

**Evidence:** AC → scenario → exact command táblázat a célfájlban.

**Recovery / Plan B:** nem tesztelhető `Then` esetén írjátok át megfigyelhető kimenetre; ha
ehhez üzleti döntés kell, térjetek vissza a 3. lépéshez.

### 5. Spec-kapu és verziózott contract

**Előfeltétel:** constitution, spec és scenario-k teljesek; minden döntés megoldott vagy a
kapu blokkolt.

**Célfájl:** `docs/spec-package/spec.md`; **kapuoutput:** `C3-APPROVED-CONTRACT`.

**Másolható agent prompt:**

```text
Review constitution C1, the spec, and all scenarios for contradictions, missing behavior,
unowned decisions, ambiguous scope, and missing evidence. Restate every AC and boundary.
Do not plan a solution. Recommend APPROVED, CHANGES REQUESTED, or BLOCKED with evidence;
only the named human product owner may record the final verdict, timestamp, and contract version.
```

**Elvárt eredmény:** az agent visszamondása és az ember által rögzített döntés. Csak
`APPROVED` esetén létezik `C3-APPROVED-CONTRACT`; más verdictnél nincs továbblépés.

**Evidence:** approver neve, UTC időpont, contract-verzió és spec commit/link.

**Recovery / Plan B:** BA/owner hiányában `BLOCKED`, owner és következő döntési időpont;
implementáció és tervezés nem indul.

### 6. Jóváhagyott, verziózott plan

**Előfeltétel:** érvényes `C3-APPROVED-CONTRACT` és `C1` constitution.

**Célfájl:** `docs/spec-package/plan.md`; **output:** `P1-APPROVED-PLAN`.

**Másolható agent prompt:**

```text
Create the smallest technical plan in docs/spec-package/plan.md from the approved C3 contract
and constitution C1. Inspect current code only as needed. Map every AC to files/modules,
owner, dependency, risk, and exact verification command. Add no product behavior and edit
no feature file. Recommend a plan verdict; only the named human approver may approve and
version it as P1-APPROVED-PLAN.
```

**Elvárt eredmény:** teljes AC-lefedettségű plan, valódi modulokkal/parancsokkal, kockázattal,
rollbackkal és emberi `P1-APPROVED-PLAN` kapudöntéssel.

**Evidence:** plan version/link, approver/timestamp és AC → plan step mátrix.

**Recovery / Plan B:** ha a plan új termékdöntést igényel, térjetek vissza a 3–5. lépéshez;
ha a kódállapot nem vizsgálható, a plan `BLOCKED`, és trainer-owned referencia-workloadon
folytatható később.

### 7. Teljes, rendezett task-/evidence-szerződés

**Előfeltétel:** `P1-APPROVED-PLAN`; jóváhagyás nélkül task nem generálható.

**Célfájl:** `docs/spec-package/tasks.md`.

**Másolható agent prompt:**

```text
Generate docs/spec-package/tasks.md only from C3-APPROVED-CONTRACT and P1-APPROVED-PLAN.
For every AC, create one or more ordered tasks with one accountable owner, exclusive scope,
explicit dependencies, exact verification command, and evidence location. Complete the
coverage matrix and prove that every AC is covered. Add an independent fresh-context review
task and bounce-back/re-verification path. Do not implement any task or edit feature files.
Replace every placeholder; use N/A with a reason only when genuinely inapplicable.
```

**Elvárt eredmény:** nincs hiányzó AC, owner, dependency/order, exact check vagy evidence
location; külön builder, fresh reviewer és bounce-back/re-verify feladat látszik.

**Evidence:** AC → owned task → dependency → exact command → evidence location mátrix.

**Recovery / Plan B:** hiányzó mezőnél a taskcsomag `BLOCKED`; ne egészítsétek ki
találgatással, hanem térjetek vissza a plan vagy spec tulajdonosához.

### 8. Zárt spec-kapu és RUG-átadás

**Előfeltétel:** a 7. lépés teljes csomagja; feature-fájl továbbra sem változott.

**Cél:** `C3-CLOSED-SPEC-GATE` evidence a work itemben.

**Másolható agent prompt:**

```text
Audit docs/spec-package for closed-spec-gate readiness. Verify approved versions C1, C3,
and P1; complete AC-to-task-to-check-to-evidence coverage; explicit dependency order;
resolved decisions; no instructional placeholders except N/A with reasons; and no changed
file outside docs/spec-package. Run the exact repository documentation/public/link checks.
Do not implement the feature. Return PASS or BLOCKED with command evidence and the exact
handoff instruction for an independent fresh-context RUG builder/reviewer loop.
```

**Elvárt eredmény:** `PASS` és az alábbi teljes handoff packet, vagy `BLOCKED` konkrét
hiányokkal. A labor itt véget ér; az implementáció egy későbbi, külön engedélyezett feladat.

**Evidence:** a következő fejezet minden sora és a futtatott parancsok exit code-ja.

**Recovery / Plan B:** bármely sikertelen check visszavisz a tulajdonolt korábbi lépéshez;
az eredeti check kiesésekor a fallback eredménye külön jelölendő, és az eredeti check nem
állítható sikeresnek.

## `C3-CLOSED-SPEC-GATE` handoff packet

A work itembe egyetlen visszakereshető kommentként kerüljön:

- issue/task azonosító, branch/worktree és dokumentációs scope;
- `C1` constitution, `C3-APPROVED-CONTRACT`, `P1-APPROVED-PLAN` link/verzió;
- approverek és UTC időpontok;
- minden AC → scenario → owned task → dependency/order → exact check → evidence location;
- megoldott döntések és `N/A` mezők indoklása;
- exact parancs, exit code és rövid eredmény minden mechanikus ellenőrzéshez;
- `git diff --name-only "$env:G2_START_SHA...HEAD"`, amely csak
  `docs/spec-package/**` fájlokat mutat;
- kijelentés: `No feature implementation started; feature files are unchanged.`;
- ismert maradó kockázat és emberi owner, vagy `None`;
- következő lépés: külön builder restatement → implement → verify → független fresh-context
  review → elfogadott findingok bounce-back javítása → re-verify.

## Kapuzáró mechanikus ellenőrzések

A labor elején beállított `G2_START_SHA` ugyanabban a shellben őrzi a kiinduló commitot.
Új shellben a work itembe rögzített értékkel állítsátok vissza a változót. Ezután futtassátok
a constitution „Required check commands” részében név szerint rögzített minden parancsot is.

```powershell
git diff --check "$env:G2_START_SHA...HEAD"
git diff --name-only "$env:G2_START_SHA...HEAD"
git grep -n -E 'DECISION REQUIRED|<[^>]+>' -- docs/spec-package
$unfinishedMarkers = 'T' + 'BD|T' + 'ODO|F' + 'IXME'
git grep -n -E $unfinishedMarkers -- docs/spec-package
```

A placeholder-scan elvárt eredménye üres. A sablonforrások szándékosan tartalmaznak kitöltési
jeleket; a kapu a kitöltött `docs/spec-package/` példányt vizsgálja. A relatív linkeknek létező
fájlra kell mutatniuk, a public-content guardnak és a smoke checknek sikeresnek kell lennie.

## Kész, ha

- mind a nyolc lépés evidence-e visszakereshető;
- a `C1`, `C3` és `P1` verzió ember által jóváhagyott;
- minden AC-hoz scenario, tulajdonolt és rendezett task, exact check és evidence location tartozik;
- nincs megoldatlan döntés vagy kitöltetlen mező; az `N/A` mindenhol indokolt;
- a mechanikus ellenőrzések és a kitöltött Markdown böngészős vizuális ellenőrzése sikeres;
- a diff csak `docs/spec-package/**`, feature-implementáció nem indult;
- a `C3-CLOSED-SPEC-GATE` packet készen áll a független RUG-loopra.

## Tipikus elakadások

- **Az agent megoldást implementálna:** állítsátok le, állítsátok vissza a feature-fájl
  változását a változtatás szerzőjével, és ismételjétek meg a scope-restatementet.
- **Plan jóváhagyás nélkül készül tasklista:** töröljétek a nem érvényes tasklistát; előbb
  ember által verziózott `P1-APPROVED-PLAN` kell.
- **Egy AC csak általános „teszteljük” sorhoz kötött:** adjatok exact parancsot, ownert és
  evidence locationt; enélkül a kapu blokkolt.
- **Nem értek egyet:** ne rejtsetek kompromisszumot a szövegbe; rögzítsetek tulajdonolt
  döntést opciókkal és megfigyelhető hatással, majd térjetek vissza a megfelelő kapuhoz.

## A sabloncsomag vizuális review rekordja

A résztvevői folyamat módosításakor a `README.md`-t Markdown-renderelő böngészőben, asztali
szélességen végig kell olvasni. Az evidence tartalmazza a dátumot, a renderelő nevét/URL-jét,
a vizsgált címsorokat, valamint a verdictet; szerkezeti vagy linkcheck önmagában nem elég.
