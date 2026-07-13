# Workshop readiness review — 2026-07-13

> **Cél:** döntési és javítási terv a 2026-07-14-i, 09:00–17:00 közötti workshophoz. Ez a dokumentum nem módosítja a tananyagot; a jelenlegi állapotot értékeli, és nagy, összefüggő munkacsomagokat javasol.
>
> **Vizsgált baseline:** `17e4b71ead06c22247f5182aaf7064de16a574ba`. A review alatt egy másik munkamenetben megjelent, még nem commitolt setup- és agentkonfigurációs fájlok nem részei ennek az értékelésnek. Ezeket integrálás előtt ugyanazon elfogadási feltételekkel kell ellenőrizni.

## Vezetői összefoglaló

Az anyag **nem azért rövid, mert kevés benne a szöveg**. A nyolc HTML-modul együtt nagyjából 12 000 szónyi, vizuálisan kidolgozott tartalom, és a napirend 405 aktív percet oszt ki. A renderelési ellenőrzés 8 modul × 2 nézetben 16/16 sikeres volt.

A valódi probléma az, hogy a nap **nem hajtható végre egyetlen folytonos résztvevői útként**. A specifikáció elkészül, de nincs utána kijelölt implementációs blokk; a következő modul már egy commitolt maker artifactot feltételez. Később a böngésző–API–adatbázis bizonyítást kérjük, miközben a participant starterben nincs API, adatbázis, contract test vagy Playwright. A hookokat, skilleket, workflowkat, Goals-t és projektmemóriát többnyire elmagyarázzuk, de a résztvevő nem telepíti, nem futtatja és nem látja őket saját munkáján működni.

Ezért a jelenlegi anyag:

- **előadásként kitöltheti a napot**, de túl nagy része válhat magyarázattá, papírgyakorlattá vagy oktatói demóvá;
- **hands-on workshopként nem tekinthető még go állapotúnak**, mert a résztvevői út több helyen blokkolódik;
- jó alapot ad egy erős naphoz, mert a szükséges professzionális építőelemek jelentős része már létezik a repóban, csak nincs bekötve a tanulási ívbe.

**Ajánlott döntés:** ne készüljenek újabb mikrofadatok. A meglévő backlogból három nagy munkacsomag vigye célba a workshopot: indulásra kész környezet, végrehajtható teljes nap, majd delivery acceptance és fallback. A vizuális polish és a további auditmunka fagyjon be, amíg a teljes út egyszer emberi segítség nélkül végig nem fut.

## Mit vizsgált a review?

- a gyökér-, material-, toolkit-, starter- és reference app dokumentációt;
- a nyolc kanonikus HTML-modult és azok belső időtervét;
- a setup guide-ot, a napirendet és a navigációs belépési pontokat;
- a participant starter tényleges képességeit;
- a reference app setup- és technikai státuszát;
- a repóban már meglévő hook-, skill-, orchestrator-, memory-, CI- és preview-eszközöket;
- a workshop projekt előző napi és jelenleg nyitott Linear backlogját;
- a modulok desktop és mobil renderelését.

Nem történt teljes interaktív böngészős click-through: a review környezetében nem volt csatlakoztatott böngészőprofil. Ezt a mai dry-run során kötelező pótolni. A mostani vizuális bizonyíték statikus render és képi ellenőrzés, nem felhasználói interakcióteszt.

## Go / no-go állapot

| Terület | Állapot | Indok |
|---|---|---|
| Tartalmi volumen | Zöld | A nyolc modul és a beszélgetési pontok elegendők egy teljes naphoz. |
| Vizuális minőség | Zöld | A 16 renderelt nézet mind átment; a modulok egységesek és diagramgazdagok. |
| Teljes időterv | Sárga | A napirend kitölti a 8 órát, de a modulok saját időkerete és a külön napirendi oldal nem teljesen egyezik. |
| Első indulás | Piros | Nincs egyetlen, idempotens bootstrap és doctor út a nulláról az első sikeres parancsig. |
| Végrehajtható golden thread | Piros | A spec és a review között hiányzik az implementáció; később a kért technikai rétegek sincsenek a starterben. |
| Agentikus dogfooding | Piros | A meglévő hookok, skillek és RUG workflow nincsenek a résztvevői útba bekötve. |
| Plan B / replay | Piros | Vannak elszigetelt replay- és evidence-minták, de nincs a modulokhoz és C0–C7 checkpointokhoz kötött egységes fallback csomag. |
| Legacy blokk | Sárga | Van használható labor, de a szükséges .NET előfeltétel nincs a setupban, és a blokk aránya túl nagy a hiányzó középső szakaszhoz képest. |
| Holnapi delivery | Feltételes | Csak a P0 út, a trainer-owned checkpointok és legalább egy teljes dry-run után vállalható biztonsággal. |

## Az idő nem hiányzik — a végrehajtható munka hiányzik

A hivatalos napirend 480 percéből 75 perc szünet és ebéd, tehát 405 perc aktív workshopidő. A modulok oldalain megadott idők összege ettől eltér, és a zárás egyes helyeken duplán jelenik meg. Ez önmagában kezelhető, de ma egyetlen kanonikus trainer run-of-show-ra kell feloldani.

A jelenlegi tartalomból becslés szerint **2,5–3,5 óra valóban végrehajtható, blokkolásmentes résztvevői munka** áll össze. A fennmaradó idő könnyen az alábbiak valamelyikévé válik:

- hosszú oktatói magyarázat;
- olyan gyakorlat, amely csak dokumentumot ír, de nem változtat működő rendszert;
- előre elkészült referenciaalkalmazás bemutatása résztvevői munka helyett;
- elakadás környezeti vagy előfeltétel-problémán;
- improvizált fallback bizonyíték nélkül.

A cél tehát nem még több magyarázó szöveg, hanem **több előkészített, futtatható munkadarab és átadási pont**.

## A fő törés: nincs végigfutó golden thread

A teljes napnak ugyanazt az egy, lifelike but invented üzleti változtatást kellene végigvinnie:

```text
üzleti brief
  → specifikáció és acceptance criteria
  → végrehajtható terv
  → maker implementáció
  → fresh-context review
  → verified fix / repeat until good
  → skill + hook + quality gate
  → preview deploy
  → browser → API → data bizonyíték
  → memória és trace
  → modell-/eszközcsere
  → csapatbevezetési döntés
```

Ehelyett jelenleg több, egymástól részben elszakadt példa következik. A legkritikusabb szakadás a 3. és 4. modul között van:

1. A 3. modul specifikációs dokumentumokat állít elő.
2. Nincs kijelölt idő, instrukció vagy workload az implementációra.
3. A 4. modul már commitolt maker outputot és `MAKER_SHA`-t feltételez.

Ez nem kisebb hiányosság, hanem a workshop központi gyakorlati ívének blokkoló hibája.

A második nagy törés a 6. modulnál van:

1. A modul böngésző → API → aktív adatforrás bizonyítékot, unit-, contract- és E2E-tesztet kér.
2. A participant starterben nincs API, adatbázis, contract réteg vagy Playwright.
3. A nap korábbi részében egyik modul sem építi ezeket fel.

Itt egyértelműen választani kell:

- vagy a résztvevők egy előkészített, írható vertical-slice workloadból dolgoznak;
- vagy a participant starter kapja meg a minimális szükséges rétegeket;
- vagy kimondjuk, hogy ez trainer demo, és adunk hozzá teljes replay/evidence csomagot.

A mostani implicit keverék nem tartható.

## P0 — amit holnap előtt kötelező rendezni

### 1. Egyetlen központi workload és checkpointlánc

Készüljön egy rövid, központi, teljesen kitalált üzleti brief, amelyet minden modul ugyanazzal azonosítóval és fogalomkészlettel használ. Ehhez legyenek verziózott checkpointok:

- `C0` — nyers repo és környezeti baseline;
- `C1` — érvényes mission, scope és repo-instrukció;
- `C2` — agent-ready repo, működő guardraillel;
- `C3` — ember által elfogadott spec/plan/tasks;
- `C4` — commitolt maker implementáció;
- `C5` — fresh review, javítás, re-verification és trace;
- `C6` — preview + browser/API/data evidence;
- `C7` — auditálható handoff, memória és csapatbevezetési döntés.

Mindegyik checkpointnál legyen meghatározva:

- a bemenet;
- a résztvevő konkrét művelete;
- az AI konkrét szerepe;
- a várt output;
- a gépi ellenőrző parancs;
- az evidence helye;
- a blokkolt állapot és a fallback.

### 2. Az implementációs szakasz pótlása

A specifikáció után legalább 45–60 perc kell egy valódi, korlátozott vertical slice elkészítésére. Enélkül nincs mit review-zni, javítani, deployolni vagy böngészőben bizonyítani.

A slice legyen elég kicsi ahhoz, hogy egy nap alatt elkészüljön, de tartalmazzon:

- egy felhasználói UI-utat;
- egy API- vagy server action határt;
- egy perzisztens vagy determinisztikusan helyettesíthető adatforrást;
- egy happy pathot és egy szándékos hibautat;
- legalább egy unit/contract és egy browser evidence pontot.

A trainernek legyen kész jó implementációja, részleges snapshotja és ismert hibás változata is. A résztvevő ne nulláról találja ki az architektúrát.

### 3. Automatizált preflight és bootstrap

A setup guide leírása helyett két, PowerShellből és POSIX shellből hívható, idempotens belépési pont kell.

`workshop-doctor` feladata:

- Git, Node és csomagkezelő verzió ellenőrzése;
- Claude Code és Codex elérhetőségének ellenőrzése;
- a legacy út választása esetén .NET SDK ellenőrzése;
- böngésző, Chrome extension vagy beépített Browser út ellenőrzése;
- szükséges accountok és környezeti változók állapotának ellenőrzése titkok kiírása nélkül;
- portok és alapvető hálózati függőségek ellenőrzése;
- összesített `PASS`, `BLOCKED` vagy `REPLAY` eredmény.

`workshop-bootstrap` feladata:

- a szükséges könyvtárstruktúra létrehozása;
- a participant workload biztonságos előkészítése;
- `git init` és dependency install;
- agent adapter választása: Claude, Codex vagy mindkettő;
- baseline teszt és első checkpoint elkészítése;
- többszöri futás esetén ne rontsa el a már működő környezetet.

Ne készüljön veszélyes, mindent törlő reset script. Helyreállításhoz checkpoint tag, patch, új munkakönyvtár vagy trainer snapshot használható.

### 4. Valódi Plan B minden kockázatos gyakorlatra

A „ha nem működik, az oktató megmutatja” nem fallback. Minden hálózat-, account-, modell-, deploy- vagy böngészőfüggő blokkhoz kell:

- előre elkészített kezdő snapshot;
- várt diff;
- rövid képernyőfelvétel vagy screenshot-sor;
- parancskimenet;
- teszt- és browser evidence;
- pontos instrukció, hogy mikor váltunk replay módra;
- pontos instrukció, hogyan térünk vissza a fő útba.

Különösen hiányzik ez az 1., 3., 4., 6. és 8. modulból.

### 5. Egyetlen kanonikus run-of-show

A `materials/agenda.md`, a külön napirendi oldal és a modulok belső időterve legyen egy forrásból levezethető. Jelenleg eltér többek között:

- az ebéd és a délutáni szünet hossza;
- a 8. modul hossza;
- a záró 10 perc kezelése.

Holnap az oktató előtt egy percre lebontott lap legyen, minden blokknál:

- tanítás;
- résztvevői végrehajtás;
- ellenőrzés;
- buffer;
- normál, lassú és replay út;
- hard stop, ha csúszás van.

## P1 — amitől a tananyag tényleg azt csinálja, amit tanít

### Repo-szintű operációs rendszer, nem csak elmélet

A repóban már megvan a professzionális működés több fontos eleme:

- AGENTS-szabályok és kanonikus standardok;
- spec-first működés;
- RUG orchestrator, reviewer promptok és trace minta;
- determinisztikus hookok és protected-path guard;
- RUG review skill;
- CI-, preview- és material workflowk;
- projektmemória-minta;
- referenciaalkalmazás vertical slice-okkal és E2E bizonyítással.

A baseline állapotban ezek nem alkotnak egységes, telepített résztvevői rendszert. A workshop során a hallgató ténylegesen végezze el az alábbiakat:

1. töltse be a repo szabályait az AI-val;
2. próbáljon meg egy tiltott vagy hibás változtatást;
3. lássa, hogy a mechanikus guardrail megállítja;
4. telepítsen vagy aktiváljon egy workshop skillt;
5. futtassa a RUG workflowt friss reviewer kontextussal;
6. utasítson el egy hamis pozitív review findingot bizonyíték alapján;
7. javítsa a valódi findingot;
8. futtassa újra a gate-eket mindaddig, amíg a kimenet jó;
9. rögzítse a döntést és bizonyítékot a trace-ben;
10. nyisson új sessiont, és bizonyítsa, hogy a projektállapot visszatölthető.

### Goals: a „repeat until good” látható motorja

A Goals jelenleg hiányzik a tanulási ívből, pedig közvetlenül illeszkedik a kitartó, eredményalapú agentmunkához.

Codexben a Goal egy threadhöz kötött, tartós cél, amelyhez folytatás és evidence audit társul. A hivatalos leírás: [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex#how-goals-are-designed-in-codex).

Claude Code-ban a `/goal` session-szintű completion conditiont ad, és friss evaluatorral ellenőrzi a teljesülést; használható stop hookkal együtt. A hivatalos leírás: [Keep Claude working toward a goal](https://code.claude.com/docs/en/goal).

Javasolt gyakorlat:

- ugyanaz az elfogadási feltétel legyen a Goal alapja mindkét eszközben;
- a cél ne az legyen, hogy „írj kódot”, hanem hogy a C4 vagy C5 checkpoint bizonyítékai teljesüljenek;
- az agent csak akkor álljon meg, ha a tesztek, a reviewer verdict és az evidence is zöld;
- legyen timebox és emberi megszakítási pont, hogy a cél ne váljon kontroll nélküli futássá;
- a résztvevők hasonlítsák össze, hogyan teljesíti ugyanazt a completion conditiont a két eszköz.

### Hookok: kérésből ismételhető mechanikus guardrail

A workshopnak nem hook-fajtákat kell pusztán felsorolnia. A hook demonstrálható korai megállítás, de önmagában nem teljes biztonsági határ: ugyanaz a determinisztikus validator fusson hookból és CI- vagy pre-commit gate-ként is. Legyen egy élő negatív és pozitív demonstráció, kizárólag eldobható fixture-ön:

1. a résztvevő hook nélkül megpróbál egy védett fájlt vagy hibás artifactot módosítani;
2. aktiválja a meglévő deterministic guardot;
3. ugyanaz a művelet blokkolódik és érthető remediationt ad;
4. kijavítja az okot;
5. a hook engedi a szabályos műveletet;
6. a trace rögzíti a blokkot és az újraellenőrzést.

Codex támogat repószintű hook konfigurációt `.codex/hooks.json` vagy `.codex/config.toml` alatt, többek között tool-használat előtti és leállási eseményekkel. A tool-használat előtti hook nem fed le automatikusan minden lehetséges eszközutat, ezért a CI-gate továbbra is szükséges. Hivatalos leírás: [Hooks in Codex](https://learn.chatgpt.com/docs/hooks).

Claude esetén a projektutasítás nem kemény enforcement; a hivatalos memória dokumentáció is PreToolUse hookot javasol, ha determinisztikus blokkolás kell: [Manage Claude's memory](https://code.claude.com/docs/en/memory).

A közös üzleti szabály és validator legyen tool-neutral; csak az adapter és a konfiguráció legyen Claude- vagy Codex-specifikus.

### Skillek és workflowk: tényleges telepítés és használat

Az 5. modul jelenlegi fogalmi osztályozása helyett a résztvevő:

- telepítse a repóban meglévő review skillt;
- indítsa el ugyanazt a review workflowt;
- kapjon több szempontú findingokat;
- deduplikálja és bizonyítsa őket;
- adja vissza a buildernek;
- re-verify után zárja le a loopot.

Az oktató mutassa meg, hogy a workflow nem egy hosszú prompt, hanem szerepek, inputok, state transitionök, quality gate-ek és trace együttese.

### Projektmemória: új sessionből bizonyítsuk

Ne elég legyen memóriáról beszélni. A résztvevő a C5 után:

1. rögzítse a rövid, kanonikus projektállapotot;
2. zárja le a sessiont;
3. indítson új Claude- vagy Codex-sessiont;
4. kérje az aktuális cél, döntések, tiltások és következő lépés visszamondását;
5. hasonlítsa össze a visszatöltött állapotot a trace-szel;
6. bizonyítsa, hogy a memória nem helyettesíti a gate-et.

### Böngészőagent: a végső bizonyítás része

A jelenlegi kézi „nyisd meg az appot” lépést egészítse ki agentvezérelt út. A hivatalos OpenAI lehetőségek:

- a ChatGPT beépített Browser saját böngészőprofillal: [Browser](https://learn.chatgpt.com/docs/browser);
- a ChatGPT Chrome extension a felhasználó meglévő Chrome profiljában, `@Chrome` használattal: [Chrome extension](https://learn.chatgpt.com/docs/chrome-extension).

Edge-kompatibilitást ne ígérjünk ellenőrzött, támogatott útként addig, amíg ezt a mai célkörnyezetben ténylegesen nem próbáltuk ki. Legyen kézi böngészős fallback.

A browser agent feladata ne csak kattintgatás legyen:

- nyissa meg a previewt;
- hajtsa végre a happy pathot;
- hajtsa végre a hibautat;
- ellenőrizze a látható eredményt;
- gyűjtsön konzol- vagy hálózati bizonyítékot, ha rendelkezésre áll;
- kösse össze a UI eredményt az API- és adatállapottal;
- hiba után futtassa újra ugyanazt az ellenőrzést.

## Javasolt 09:00–17:00 tanulási ív

Nem szükséges kidobni a nyolc meglévő modult. Külső navigációként maradhatnak, de a résztvevő öt nagy laborívként élje meg őket.

| Idő | Nagy blokk | Résztvevői eredmény |
|---|---|---|
| 09:00–09:30 | Automatizált preflight és C0 | Mindenki `PASS`, `BLOCKED` vagy `REPLAY` állapotban van; senki sem bizonytalan fél-setupban. |
| 09:30–10:45 | Repo operating system | Agent-ready repo, ugyanaz a standard az AI-nál és a gépi gate-eknél; egy negatív guardrail-próba. |
| 10:45–11:00 | Szünet | — |
| 11:00–12:30 | Spec → maker → első bizonyíték | Elfogadott brief/spec, elkészült és commitolt vertical slice. |
| 12:30–13:15 | Ebéd | — |
| 13:15–14:45 | RUG → skill/hook → preview/browser/data | Fresh review, verified fix, aktív hook, preview és rendszerbizonyíték. |
| 14:45–15:00 | Szünet | — |
| 15:00–16:00 | Legacy safety net és transzfer | Characterization/contract gondolkodás ugyanarra a módszerre visszakötve. |
| 16:00–16:45 | Modellcsere és csapat operating model | Ugyanaz a frozen task két eszközzel; 30/60/90 bevezetési döntés. |
| 16:45–17:00 | C0–C7 audit és final boss | Bizonyítékcsomag és világos „mit viszek haza” zárás. |

A táblázat a teljes 405 aktív percet megmutatja, de ebből csak legfeljebb 360 perc lehet kötelező core út. A fennmaradó 45 perc név szerint megjelölt, csúszáskor elhagyható stretch/buffer:

- 15 perc repo operating-system vita és extra kérdések;
- 15 perc legacy transzfer mélyítés;
- 15 perc a második agentes összehasonlításból.

A 75 perces legacy blokk 60 percre csökkenthető. A felszabaduló időt az eddig hiányzó implementációs és evidence szakasz kapja. Ha a célcsoport miatt a legacy 75 perc kötelező, akkor más magyarázó részt kell rövidíteni; a maker blokkot nem szabad elhagyni.

## Modulszintű javítási lista

| Modul | Ami működik | Ami hiányzik vagy hibás | Javasolt változás |
|---|---|---|---|
| 1. Agentikus fejlesztés | Erős szemléleti alap és C0-keret | Setup kézi és Claude-központú; nincs Codex, doctor, bootstrap, browser check | A magyarázat előtt 30 perces automatizált preflight; mindkét agent útja és replay státusz |
| 2. Repo felkészítése | Jó mission/scope/AGENTS/standard gondolkodás; van kézi `PASS → FAIL → PASS` typecheck-próba | A valódi repóeszközök nincsenek telepítve; nincs protected-path hook, participant-owned validator és hook/CI közös enforcement-út | Starterbe bekötött közös standard, egy hook/validator és látható blokk–javítás–pass kör |
| 3. Specifikáció | Jó acceptance criteria és traceability | Nincs központi business brief; a feladatbontás mikroissue-k felé tolhat; nincs maker handoff | Egyetlen brief, nagy vertical-slice terv, explicit implementációs blokk és C3/C4 checkpoint |
| 4. Független review | Erős fresh-context és evidence szemlélet | Már létező maker commitot feltételez; nincs élő orchestrator/skill használat | A C4 artifacton futó valódi RUG workflow, false-positive rejection és bounce-back fix |
| 5. Szabályok és kapuk | Jó rule/skill/hook fogalmi szétválasztás | Főleg osztályozás; a validator placeholderként hat | Skill telepítés, hook aktiválás, tiltott művelet, remediation, re-run és trace |
| 6. Rendszerellenőrzés | Jó end-to-end bizonyítási ambíció | A starter nem tudja a kért UI/API/data/Playwright utat; deploy inkább referencia-demo | Előkészített írható workload, preview URL, agent browser és teljes replay pack |
| 7. Legacy rendszer | A leginkább futtatható/replayelhető labor | .NET nincs a setupban; aránytalanul sok időt kap a hiányzó makerhez képest | Doctorban opcionális legacy lane; 60 perces safety-net fókusz, a módszerre visszakötve |
| 8. Csapatbevezetés | Jó modellcsere és 30/60/90 keret | Goals, memória-visszatöltés és számszerű eval kevéssé gyakorlati; időkeret ellentmondásos | Frozen task A/B relay, Goal completion, új session proof, scorecard és C7 audit |

## Navigációs és tartalmi konzisztenciahibák

Ezek nem indokolnak külön issue-kat; a start-ready csomag részeként kell javítani őket.

- A gyökér-, materials- és participant starter belépési pontjai több helyen a nyugdíjazott notebook redirectekre mutatnak, miközben a kanonikus participant réteg a `materials/modulok/` oldalai alatt van.
- A participant starter néhány útja GitHub source/blob nézetre visz a résztvevői oldal helyett.
- A `workshop-evidence/` helye nem egyértelmű: egyes leírások sibling repóként, mások a participant repo részeként értelmezhetők.
- A napirend és a napirendi HTML eltérő ebéd-, szünet- és modulidőt használ.
- A 8. modul 45 + 10 perces megfogalmazása és a külön 10 perces zárás dupla időelszámolást okozhat.
- A reference app auth setup státusza nem teljes; ezt nem szabad kész, deploy-ready authként kommunikálni.
- A legacy előfeltételek között a .NET SDK-nak explicitnek kell lennie.
- A „tool-neutral” állítást a setupban tényleges Claude + Codex út támaszsza alá.

## A mai dry-run pontos protokollja

A dry-run ne olvasási review legyen, hanem időzített végrehajtás egy tiszta gép logikájával. Az oktató minden blokk végén csak akkor lépjen tovább, ha a checkpoint bizonyítéka létezik.

### Indulás előtt

- Tiszta vagy új résztvevői munkakönyvtárból indulás.
- Accountok, modellek és hálózat ellenőrzése.
- Claude-, Codex- és browser út külön ellenőrzése.
- Legacy lane esetén .NET ellenőrzése.
- Stopper, blocker log és kérdésparkoló megnyitása.
- Minden fallback artifact helyi elérhetőségének ellenőrzése.

### Minden blokkban rögzítendő

| Mérés | Kérdés |
|---|---|
| Kezdés és befejezés | Belefért-e az idősávba? |
| Trainer talk / participant work | Legalább az idő fele résztvevői végrehajtás volt-e? |
| Első siker ideje | Mennyi idő telt el az instrukciótól az első zöld eredményig? |
| Segítségigény | Hány résztvevő igényelne egyéni mentést? |
| AI-operálhatóság | Az instrukciót az agent is egyértelműen végre tudta hajtani? |
| Determinizmus | Ugyanaz a parancs ugyanazt az eredményt adta? |
| Checkpoint evidence | Megvan-e a diff, teszt, URL, screenshot vagy trace? |
| Fallback | Működött-e offline/replay módban? |
| Hard stop | Mi hagyható el tanulási veszteség nélkül csúszás esetén? |

### Kötelező próbák

1. Végigfuttatni a normál Claude utat.
2. Legalább a setupot, Goal-t, review-t és böngészőbizonyítást Codexszel is kipróbálni.
3. Szándékosan megszakítani egy hookkal védett műveletet.
4. Szándékosan beadni egy valódi és egy hamis review findingot.
5. Megszakítani a hálózati vagy deploy utat, és replay módra váltani.
6. Új sessionből visszatölteni a projektállapotot.
7. Ugyanazt a frozen eval feladatot két agenttel lefuttatni.
8. A végén C0–C7 auditot végezni anélkül, hogy az oktató fejben pótolna hiányzó bizonyítékot.

### Holnapi go feltételek

A workshop csak akkor tekinthető delivery-readynek, ha:

- a bootstrap tiszta környezetben kétszer egymás után sikeres;
- a résztvevő eljut C0-tól C7-ig;
- a 3. modul outputjából valóban elkészül a 4. modul inputja;
- a 6. modul evidence útja végrehajtható, nem csak elmondható;
- minden külső függőséghez van kipróbált replay artifact;
- a teljes normál út legfeljebb 405 aktív perc;
- legalább 45 perc összesített buffer vagy rövidíthető magyarázó rész azonosítva van;
- az auth és más ismert hiányosságok nem szerepelnek kész funkcióként;
- a trainer run-of-show egyetlen időforrást használ.

## Tegnapi backlog review: mit kell megtartani, összevonni vagy elengedni?

2026-07-12-én 83 issue jött létre. Ezek közül 71 Done, 9 Canceled, 1 Duplicate és csak 2 maradt Todo állapotban. Ugyanezen a napon a repó 185 commitot kapott. A HTML-redesign körben 45 issue szerepelt; ebből 13 volt közvetlen modul-tartalom, 32 pedig audit, foundation, integration, compatibility, polish vagy gate jellegű munka. Ez alátámasztja a felhasználói észrevételt: a végrehajtható tanulási ívhez képest túl sok energiát vitt el a feldarabolás és a felületi minőségbiztosítás.

Az elkészült eredményeket nem kell kidobni. Az issue-k viszont ne legyenek minták a következő kör tervezéséhez.

| Döntés | Issue-k / csoport | Indok |
|---|---|---|
| Megtartani és kibővíteni | **WEN-217** | Már most egy csomagban kezeli a trainer guide-ot, setupot, browser utat és scripteket. Ez legyen a teljes start-ready journey. |
| Beolvasztani WEN-217-be | **WEN-170, WEN-219** | A syllabus-szinkron és a starter handoff önmagában túl kicsi; ugyanannak a belépési útnak a része. |
| Újraspecifikálni, nem továbbvinni jelen formában | **WEN-129** | A régi notebook-központú spec elavult, és tévesen feltételezi, hogy minden gyakorlat replayelhető. Legyen ez az executable golden thread és dual-agent dogfooding csomag. |
| Megtartani delivery acceptance-ként | **WEN-124** | Ez a mai dry-run és a bizonyíték-alapú go/no-go helye. Ide csak delivery-critical elemek kerüljenek. |
| Részben beolvasztani WEN-124-be | **WEN-123** | A deck/checklist csak a stabil tartalmi gerinc után hasznos; a holnapi delivery pack részeként kezelendő. |
| Erősen szűkíteni vagy elengedni | **WEN-125** | Gyorsan változó, széles kutatási bevásárlólista. Csak az maradjon, amit holnap ténylegesen kimondunk vagy demózunk, és ami blokkoló pontossági kockázat. |
| Megtartani | **WEN-126, WEN-127** | A tényleges delivery és a post-workshop feldolgozás külön életciklus, indokolt nagy egység. |
| Holnap utánra tenni | **WEN-128** | Nem része a workshop működőképességének. |
| Befagyasztani | a lezárt shell/compatibility/polish issue-k | Az output megmarad, de új munkát csak akkor kapjon ez a terület, ha a dry-run konkrét blokkolót bizonyít. |
| Nem újranyitni | a már Canceled/Duplicate issue-k | Nem szolgálják a holnapi kritikus utat. |

## Pontosan három nagy munkacsomag

Nem javasolt új issue-k tömeges létrehozása. A meglévő issue-kból az alábbi három aktív végrehajtási egység elegendő.

### 1. WEN-217 — Start-ready participant + trainer journey

Magába olvasztja WEN-170 és WEN-219 tartalmát.

**Outcome:** a résztvevő egyetlen útvonalon eljut a nulláról az első zöld checkig, az oktató pedig ugyanebből a forrásból vezeti a napot.

**Scope:** doctor, bootstrap, pontos első kattintás/parancs, kanonikus navigáció, participant/starter/workload döntés, Claude + Codex setup, browser setup és kézi fallback, evidence könyvtár, .NET opcionális lane, percre bontott run-of-show.

**Nem scope:** további vizuális redesign, új modulok vagy marketinganyag.

### 2. WEN-129 — Executable full-day golden thread + dual-agent operating system

A jelenlegi issue spec teljes újraírásával, nem új issue-k sorával.

**Outcome:** ugyanaz az invented vertical slice végigmegy briefből C7-ig, és a workshop ténylegesen használja a tanított módszert.

**Scope:** központi brief, implementációs blokk, checkpoint snapshotok, RUG, fresh reviewer, verified fix, Goals, memory, közös standard, Claude/Codex adapterek, skill, hook, workflow, preview, browser/API/data evidence, legacy transzfer, frozen eval és model swap.

**Nem scope:** minden témához külön példa vagy külön issue.

### 3. WEN-124 — Delivery acceptance, fallbacks és wow/fun

Ez a jelenlegi review és a mai emberi dry-run nagy egysége. WEN-123 delivery-critical részei és WEN-125 szűkített tényellenőrzése ide kerülhet.

**Outcome:** bizonyítottan végigvihető 09:00–17:00 nap normál, lassú és replay útvonallal.

**Scope:** teljes időmérés, minden Plan B tényleges kipróbálása, trainer role-ok, blocker log, click-through, C0–C7 final audit, go/no-go döntés, deck/checklist csak a stabil gerinchez.

**Nem scope:** új tartalmi mikrofadatok vagy újabb általános auditkörök.

WEN-126 marad a holnapi emberi delivery gate; nem része a fenti építési munkának.

## Wow-effektus: a módszer működését kell látni

A legerősebb wow nem egy újabb látványos slide. Az, amikor a résztvevő ezt a láncot saját szemével látja:

1. az AI átvesz egy világos üzleti célt;
2. elkészíti a specifikációt és a megoldást;
3. egy másik AI valódi hibát talál;
4. egy hamis findingot bizonyíték alapján elutasítunk;
5. a repo blokkol egy veszélyes lépést;
6. a javítás után ugyanaz a gate zöldre vált;
7. a browser agent végigpróbálja a previewt;
8. az evidence összeköti a UI-t, API-t és adatot;
9. új session és másik modell is folytatni tudja a munkát;
10. a teljes történet visszajátszható a trace-ből.

Ez egyszerre bizonyítja a gyorsaságot, a minőséget, az irányíthatóságot és a modellfüggetlenséget.

## Fun faktor — bizonyítékért járjon pont, ne sebességért

### C0–C7 workshop passport

Minden csapat kap egy egyszerű checkpoint táblát. Pecséthez nem elég azt mondani, hogy „kész”; diff, teszt, URL, screenshot vagy trace kell. A cél minden checkpoint megszerzése, nem az, hogy ki generál több kódot.

### Build–review–swap relay

- Claude épít, Codex review-zik és browserrel bizonyít.
- A következő körben szerepcsere.
- A csapat összeveti a findingok pontosságát, a szükséges emberi beavatkozásokat és az időt.

### Break the build

A trainer ad egy kontrollált hibakártyát. A csapat akkor kap pontot, ha:

- a saját guardrailje állítja meg;
- a hibaüzenet elég jó a javításhoz;
- a fix után a teljes gate újra zöld;
- a trace megőrzi a történetet.

### False-positive hunter

Minden csapat kap egy szándékosan hibás reviewer findingot. A cél nem a vak javítás, hanem a bizonyíték-alapú elutasítás. Ez játékosan tanítja, hogy a review feedback nem gospel.

### Browser boss fight

A „final boss” egy előre definiált böngészős feladat happy és failure path-tal. Az agentnek meg kell találnia a hibát, a buildernek javítania kell, majd ugyanaz az ellenőrzés fut újra. Ha a live browser kiesik, ugyanennek replay evidence változata fut.

### Evidence bingo

A bingo mezői ne triviaelemek legyenek, hanem szakmai bizonyítékok: blokkolt hook, elutasított false positive, zöld contract test, preview URL, új sessionből visszatöltött döntés, modellcsere után azonos acceptance result.

## Mit ne csináljunk ma?

- Ne hozzunk létre újabb 30–50 issue-t.
- Ne legyen minden link-, mondat- vagy CSS-javítás külön branch.
- Ne induljon újabb általános audit a már elvégzett auditok fölé.
- Ne polisholjuk tovább a moduloldalakat a golden thread előtt.
- Ne építsünk új példát minden fogalomhoz; egy példát vigyünk végig mélyen.
- Ne ígérjük, hogy egy funkció támogatott vagy kész, ha a célgépen nincs ellenőrizve.
- Ne tekintsük a zöld render- és boundary-checkeket a tanulási út bizonyítékának.
- Ne várjuk a résztvevőtől, hogy workshop közben improvizálja az architektúrát, az adatmodellt vagy a fallbacket.

## Végső prioritási sorrend

1. **P0:** végrehajtható C0–C7 minimumút maker blokkal, valódi RUG loop-pal, egy telepített skilllel, közös validatorral és hookkal, valamint preview/browser/API/data bizonyítékkal.
2. **P0:** doctor/bootstrap, első 30 perc és kanonikus run-of-show.
3. **P0:** teljes replay pack, normál/replay váltási pontokkal.
4. **P1:** második agentre kiterjesztett Goals, memória, új session proof és model-swap.
5. **P1:** további hookok, workflow-polish, navigációs és setup-konzisztencia.
6. **P2:** wow/fun csomag a bizonyítékokra építve.
7. **Fagyasztva:** további vizuális polish és újabb mikrofadat-alapú audit.

## Záró megállapítás

A tananyag alapja erős, a vizuális kidolgozottsága jó, és a repóban szokatlanul sok professzionális agentikus építőelem már megtalálható. A hiány nem még több elmélet. A hiány az, hogy **a résztvevő ugyanazzal a valódi munkadarabbal, ugyanabban a repóban, megszakítás nélkül végigélje azt a professzionális folyamatot, amelyet tanítunk**.

Ha a következő munkakör ezt az egy végrehajtható gerincet építi meg, a nap nem ér véget egy óra alatt, és nem is nyúlik nyolcórás előadássá. A wow-effektust az adja majd, hogy az AI, a repo, a quality gate, a browser és az evidence együtt működik — nemcsak beszélünk róluk.
