# A nap forgatókönyve — instruktori vezérfonal (2026-07-14)

> Egyetlen építési ív, 09:00-tól 17:00-ig: **üres repo → agent-ready fejlesztési rendszer →
> real-life validáció → legacy-transzfer → csapatbevezetés**. Az elsődleges termék nem a
> webalkalmazás, hanem az ismételhető, szabályozott és bizonyítható fejlesztési működés — az app
> csak a [validációs workload](../big-picture.md). Az időrács forrása az [agenda](../agenda.md),
> a résztvevők a [napirend-oldalt](../napirend/index.html) látják; a modulhatárok ott 5–15 perccel
> eltérhetnek, a teremben ez a fájl a mérvadó, a modulok tartalma és kimenete azonos.

**Előadás/gyakorlat filozófia:** az instruktori beszéd állványzat, nem tartalom-átadás. Minden
blokkban a hallgató épít, és minden blokk egy megnevezett munkadarabbal zárul, amely a következő
blokk bemenete. A közös ellenőrzés (checkpoint) soha nem marad el — ha vágni kell, a gyakorlat
utolsó iterációja megy, nem az ellenőrzés; a **C4 készítő lépés (4. blokk eleje) ugyanígy nem
vágható** (részletek a végén: „Ha csúszik a nap").

| Blokk | Idősáv | Előadás | Gyakorlat | Közös ellenőrzés |
|---|---|---:|---:|---:|
| 1. Bevezető + setup-ellenőrzés | 09:00–09:45 | 20 perc | 17 perc | 8 perc |
| 2. Üres repo → agent-ready repo v0 | 09:45–10:45 | 12 perc | 38 perc | 10 perc |
| Szünet | 10:45–11:00 | — | — | — |
| 3. Spec-vezérelt SDLC + BA-kapu | 11:00–11:45 | 12 perc | 25 perc | 8 perc |
| 4. Orchestrátor + Repeat-Until-Good (C4 készítő + C5 review) | 11:45–12:30 | 5 perc | 32 perc | 8 perc |
| Ebéd | 12:30–13:15 | — | — | — |
| 5. A keretrendszer megerősítése | 13:15–14:00 | 12 perc | 25 perc | 8 perc |
| 6. A keretrendszer rendszerpróbája | 14:00–14:45 | 10 perc | 27 perc | 8 perc |
| Szünet | 14:45–15:00 | — | — | — |
| 7. Legacy blokk (.NET / MS-SQL / Azure DevOps) | 15:00–16:15 | 18 perc | 45 perc | 12 perc |
| 8. Csapat operating model + 30/60/90 | 16:15–16:50 | 10 perc | 18 perc | 7 perc |
| 9. Agent-ready repo audit, zárás | 16:50–17:00 | 3 perc | — | 7 perc |

**Deck-jelölések:** minden blokk fejlécében `Deck:` sor mondja meg, mit vetítesz. A Gamma-linkek a
Drive `10_Internal/02_Production/decks/README.md` linklapján élnek (publikus repóba nem kerülnek);
a Gamma-mappa neve: „AI workshop – 2026.07.14". Minden decknek van markdown Plan B-je ugyanabban a
Drive-mappában; a D1-nek offline HTML-ikre is: `materials/instruktor/eloadas/d1.html`.

---

## 08:30 · Terem-előkészítés (résztvevők érkezése előtt)

1. **Welcome-képernyő kivetítése:** futtasd a Drive `02_Production/entry/start-welcome.cmd`-t —
   bemásolja az érzékeny QR-eket (wifi, Discord) a repo git-ignorált `local/` mappájába, és
   fullscreenben nyitja a `materials/instruktor/entry/welcome-projected.html`-t. Ellenőrizd:
   MINDHÁROM QR-panel látszik (wifi · tananyag · Discord).
2. **Nyomtatott QR-lapok az asztalokon** (`entry/qr-print-a4.html` — előző este nyomtatva).
3. **Deckek megnyitva külön fülekön** a Drive linklapról: D1, D2, D3 (v2!) — plusz a D1 HTML-iker
   tartalékként. A 15:00-s Azure DevOps nézet bejelentkezve egy külön ablakban.
4. Wifi-gyorspróba telefonnal a kivetített QR-ről; `workshop-passport` és Evidence-bingó nyomtatva
   az 1. blokk végi osztáshoz.

---

## 09:00–09:45 · Bevezető — agentikus fejlesztés alapfogalmai, setup-ellenőrzés (→ [1. modul: Szerepek és korlátok](../modulok/01-agentikus-fejlesztes/index.html))

- **Deck:** D1 „AI gyorstalpaló" (~12 perc) + D2 „Eszköztérkép" (~15 perc) — a setup-ellenőrzés
  érkezéstől PÁRHUZAMOSAN fut, ezért fér el ~27 perc vetítés a nyilvános időrács változása nélkül;
  a közös ellenőrzés 8 perce érintetlen. D2 appendix-diák élőben átugorhatók.
- **Fő üzenet:** **Az AI-t gyors junior kollégaként kell vezetni, nem varázslatként kezelni.**
- **Időfelosztás:** ~27 perc előadás (D1+D2, a párhuzamos setup mellett) + 10 perc gyakorlat
  (repo-diagnózis) + 8 perc közös ellenőrzés
- **Nyitó képernyő (érkezéstől kivetítve):** a welcome-képernyő (08:30-as rutin); az 1. blokk
  gyakorlatától váltás a [repo-térkép oldalra](../repo-terkep/index.html) — a repo öt területe és
  a C0–C7 aranyfonál. Erre az oldalra küldesz vissza mindenkit, aki a nap során elveszik: „nézd
  meg, melyik állomáson állsz".
- **Amit elmondasz (beszédvázlat):**
  - „A mai nap take-home üzenete már az első percben kimondható: az AI-t gyors junior kollégaként
    kell vezetni, nem varázslatként kezelni. Egy junior is akkor dolgozik jól, ha van célja, határa
    és valaki ellenőrzi."
  - „Nem egy webalkalmazást építünk ma. Egy agent-ready fejlesztési keretrendszert építünk, és az
    alkalmazással bizonyítjuk, hogy működik. A modell és a coding tool cserélhető végrehajtó — a
    minőségi lécet a repo, a gate-ek és az evidence tartja." (Kivetítve: a [big
    picture](../big-picture.md) központi tézise.)
  - „Három réteg van, és ezt egész nap szét fogjuk választani: a nyelvi modell csak következtet; a
    coding agent eszközökkel olvas, ír és parancsot futtat; a fejlesztési rendszer pedig
    szabályokkal, tesztekkel és emberi döntésekkel keretezi. Mint a fordító, az IDE és a
    build-rendszer hármasa." (Mutasd a modul-oldal „Mentális modell: három különböző réteg"
    ábráját.)
  - „A kontextus nem a teljes repo. Öt lépésben szűkítünk: teljes repo → érintett terület →
    szabályok és döntések → fájlok és tesztek → következő lépés. És három stop-kérdés van: mi a cél?
    mi tiltott? ki dönt? Ha bármelyik hiányzik, az agent találgatni fog." (Mutasd a
     kontextus-tölcsér ábrát.)
  - „A nagyobb kontextusablak nem azt jelenti, hogy minden benne lévő szabály egyformán megbízhatóan
    érvényesül. Nincs igazolt, minden modellre érvényes 150–200-as kemény plafon; a biztos tanulság:
    az irreleváns részlet és a versengő constraint rontja a jel–zaj arányt. Ezért delegálunk: az
    orchestrator a célt, az állapotot és a kapukat tartja, a subagent pedig csak a saját minimum
    elégséges csomagját kapja.” (Mutasd a [módszertan orchestration-ábráját](../modszertan/index.html#orchestration).)
  - „»Nézd át és javítsd meg« — ez nem kérés, ez kockázat. A végrehajtható kérésben benne van az
    eredmény, a scope, a korlát és a pontos ellenőrzés. Nézzétek meg a modul-oldal példapárját: a
    homályos és a végrehajtható diagnózis-kérést."
  - „Az önellenőrzés nem független review: ugyanabból a gondolatmenetből indul, mint a készítés.
    Délelőtt ezt a különbséget építjük be a folyamatba — jegyezzétek meg, a 4. modulban visszatér."
- **Amit a hallgatók csinálnak:**
  1. (érkezéstől, párhuzamosan) Felkészülés-ellenőrzés a [felkészülési
     oldal](../felkeszules/index.html) és a [setup-guide](../setup-guide.md) szerint: `git
     --version`, `gh --version`, `node --version`, `claude --version` fut; a repóban indított
     `claude`-ban a `/mcp` négy szerveréből Linear, Neon és Vercel OAuth-tal zöld (a GitHub
     ismert inkompatibilitás miatt hibázhat — ilyenkor a setup-guide kerülőút-doboza él:
     `gh auth status` zölddel a résztvevő teljes értékű); a Claude böngésző-bővítmény telepítve
     és bejelentkezve. **Aki kész, a szomszédjának segít** — a scoop-telepito.cmd-s telepítés a
     leggyakoribb elakadás.
  2. (28. perctől) Megnyitja a saját gyakorlórepóját, és a README + gyökér agent-utasítás alapján
     egy mondatban leírja, mit épít a repo — ha nem derül ki, ez az első ismeretlen.
  3. Felderíti a határokat (hol szabad dolgozni, mi tiltott) és legalább egy futtatható ellenőrzési
     parancsot, várt és tényleges eredménnyel.
  4. Szétválasztja a szerepeket (modell / agent / ember / független ellenőrző), és rögzít legalább
     három ismeretlent — mindhez válaszadó szerepet és tiltott feltételezést.
  5. Megnevez egy következő emberi döntést, és elkészíti a modul kimenetét:
     **`workshop-evidence/01-helyzetkep.md`**.
  6. (37. perctől) Társ-visszamondás: fájlcsere, a társ csak a fájlból mondja vissza a
     megengedett/tiltott feltételezéseket és az ellenőrzési parancsot.
- **Ezt ellenőrzöd a teremben:**
  - Minden gépen zöld a `/mcp` három kötelező szervere (Linear, Neon, Vercel) és lefut a
    `claude --version`; GitHub-pirosnál `gh auth status` zöld = rendben — aki ezeken túl is piros,
    azt a 2. blokk elején külön veszed.
  - Létezik a `workshop-evidence/01-helyzetkep.md`, benne 3 ismeretlen válaszadó szereppel és külön
    várt/tényleges ellenőrzési eredmény.
  - Legalább egy párnál meghallgatod a visszamondást: egyezik-e a leírt határokkal.
  - **A blokk végén kiosztod a C0–C7 útlevelet és az Evidence-bingót**
    ([workshop-passport](../../toolkit/checklists/workshop-passport.md), nyomtatva vagy letöltve),
    és kimondod a szabályt: pecsét és pont kizárólag evidence-fájlra jár, sosem gyorsaságra.
- **Tipikus elakadás + Plan B:** nincs használható saját repo → a tréner kitalált
  starter-pillanatképe, a fájl első sora „PLAN B — kitalált starter-pillanatkép alapján".
  Leggyakoribb hiba: a hiányzó információt valószínű részlettel pótolják — ilyenkor ismeretlenként
  kell rögzíteni, döntési felelőssel. OAuth-elakadásnál a setup-guide időkeretes Plan B-je él:
  lokális munka, a preview-t a tréner közös demója pótolja.
- **Átvezetés:** „A diagnózis megmutatta, mit nem tudhat az agent a repótokról — a következő hatvan
  percben pontosan ezt a hiányt írjuk be a repóba tartós, futtatható szabályként."

## 09:45–10:45 · Üres repo → agent-ready repo v0 (→ [2. modul: A repo felkészítése](../modulok/02-repo-felkeszitese/index.html))

- **Deck:** D3 „Agentikus fejlesztés — big picture, módszertan, pofonok, a mai terv" (~12 perc,
  a Dia 4b KULCSKONCEPCIÓ — AI-first/AI-natív — lassan, kétszer kimondva; az Insert-diák NEM itt
  mennek, hanem a 4. és 5. blokkban).
- **Fő üzenet:** **Nem app-vázat, hanem fejlesztési rendszert bootstrapelünk.**
- **Időfelosztás:** 12 perc előadás + 38 perc gyakorlat + 10 perc közös ellenőrzés
- **Amit elmondasz (beszédvázlat):**
  - „Nem app-vázat bootstrapelünk, hanem fejlesztési rendszert. A jó prompt elpárolog a session
    végén; a repo szabályai maradnak — egy friss agentnek chatelőzmény nélkül is meg kell értenie a
    célt és a határokat."
  - „A lánc így épül: cél + scope + határok → repo-szabályok → Definition of Done → futtatható helyi
    parancsok → branch/worktree → PR + CI + preview. A szabály leírja az elvárást, a DoD közös
    döntéssé teszi, a kapu futtathatóan ellenőrzi." (Mutasd a „Mitől lesz egy repo AI-agentekkel
    művelhető?" ábrát.)
  - „A hierarchia: a gyökér AGENTS.md a keret, a mérnöki standard a részletek, a parancstábla a
    végrehajtás. A közelebbi szabály csak szigoríthat, sosem lazíthat." (Mutasd a szabály-hierarchia
    ábrát.)
  - „Egy kapu attól valódi, hogy el is tud bukni. Ezért a gyakorlatban szándékosan elrontjuk a
    typecheck-et egy hamis típusú konstanssal, és megnézzük, hogy a kapu megnevezi-e a hibás fájlt.
    Zöld próba negatív próba nélkül csak remény."
  - „Három munkaterületet választunk szét: a workshop forrásrepója, a saját résztvevői repó és az
    issue-nkénti worktree-k. Egy munkadarab — egy gazda — egy munkaterület."
  - „A preview nem helyettesíti a kapukat: egy pontos commit ember által vizsgálható megjelenítése.
    És ha egy távoli szolgáltatás nem érhető el, az eredménye NOT RUN vagy BLOCKED — soha nem PASS."
- **Amit a hallgatók csinálnak:**
  1. (0–8) Szétválasztja a három munkaterületet (forrásrepo / saját repo / worktree).
  2. (8–20) A saját repó gyökerében megírja vagy pontosítja az `AGENTS.md`-t: cél, scope, tiltott
     műveletek, emberi döntési pontok, nyelv, kötelező standardok linkje.
  3. (20–32) Elkészíti a `docs/engineering-standard.md`-t és a Definition of Done táblát — minden
     feltételhez pontos parancs és elvárt eredmény.
  4. (32–47) Friss agentbeszélgetésnek (chatelőzmény nélkül) átadja a próbát: sikeres út (`npm run
     typecheck`, `lint`, `test`, `build`), majd negatív próba (`src/__workshop-negative__.ts` hamis
     típussal → typecheck FAIL), majd helyreállítás (törlés → ismét PASS). 15 perc után megállítja
     és rögzíti, hol tart.
  5. (47–60) Bekapcsolja az issue → branch → worktree rendet, és elhelyezi a CI-t + preview-t (vagy
     Plan B-ként rögzíti).
  Kimenet: **gyökér agent-utasítás + mérnöki standard + DoD + egy sikeres és egy szándékosan hibás
  próba naplója**.
- **Ezt ellenőrzöd a teremben:**
  - `AGENTS.md` a repo gyökerében és `docs/engineering-standard.md` létezik; a DoD tábla parancsokat
    tartalmaz, nem óhajokat.
  - A negatív próba naplójában a FAIL megnevezi a `src/__workshop-negative__.ts` fájlt, és törlés
    után ugyanaz a parancs ismét PASS.
  - Szúrópróba: egy friss agent a repóból helyesen visszamondja a célt és a scope-ot.
- **Tipikus elakadás + Plan B:** CI vagy preview nem érhető el → helyi ellenőrzések futnak, a távoli
  eredmény `NOT RUN — service unavailable` vagy `BLOCKED`, soha nem PASS. Ha a sikeres helyi út sem
  fut, a modul nincs kész — ez megállási szabály, nem szégyen. Hibánál a sorrend: állj meg →
  rögzítsd a parancsot/commitot/kimenetet → reprodukálható? → csak utána javíts.
- **Átvezetés:** „A repo mostantól tudja, mit szabad. De azt még nem tudja, mit *akarunk* — a szünet
  után a homályos üzleti kérésből csinálunk jóváhagyható munkaszerződést."

## 10:45–11:00 · Szünet

15 perc. Instruktorként: mérd fel, ki maradt le a negatív próbánál, és őket a 3. blokk elején
párosítsd össze egy kész résztvevővel. Készítsd elő kivetítésre a 3. modul öt-fájl ábráját.

## 11:00–11:45 · Spec-vezérelt SDLC + a BA-kapu (→ [3. modul: Specifikációból végrehajtható terv](../modulok/03-specifikacio/index.html))

- **Deck:** — (a modul-oldal ábráiból vetítesz)
- **Fő üzenet:** **A specifikáció az agent munkaszerződése.**
- **Időfelosztás:** 12 perc előadás + 25 perc gyakorlat + 8 perc közös ellenőrzés
- **Amit elmondasz (beszédvázlat):**
  - „A specifikáció az agent munkaszerződése. Implementáció csak jóváhagyott, végigkövethető
    csomagból indulhat — a bizonytalanságot nem kódba rejtjük, hanem döntési pontra visszük."
  - „Öt fájl, öt kérdés: constitution — mit nem sérthetünk meg; spec — mit és milyen feltételekkel
    változtatunk; given-when-then — milyen megfigyelhető példák igazolják; plan — milyen sorrendben;
    tasks — mi a következő kis lépés és ellenőrzése." (Mutasd a „Hogyan függ össze az öt spec-fájl?"
    ábrát.)
  - „A jóváhagyás állapotgép: DRAFT → HUMAN REVIEW → APPROVED, BLOCKED vagy DECISION REQUIRED.
    Önjóváhagyás nincs, és az agent nem hagyhat jóvá — a bizonytalanság külön állapot, nem
    hallgatólagos engedély." (Mutasd az állapotgép-ábrát.)
  - „A visszakövetés konkrét: az AC-02 elfogadási feltételt az SC-02A forgatókönyv teszi példává, a
    TASK-04 valósítja meg, a CHECK-04 ellenőrzi. Ha egy feladat nem vezethető vissza AC-hez,
    valószínűleg felesleges."
  - „BA-knak külön: az átadás nem egyirányú dokumentumküldés. A fejlesztő kötelessége a rejtett
    döntést visszaküldeni, nem kitalálni. A magyar üzleti szabályból itt lesz angol, tesztelhető
    elfogadási kritérium."
- **Amit a hallgatók csinálnak:**
  1. (5–11) A kapott (vagy saját, kitalált) üzleti kéréshez rögzíti a scope-ot három listában: benne
     van / nincs benne / nyitott döntés.
  2. (11–17) Megfigyelhető elfogadási feltételeket ír `AC-01`, `AC-02`… azonosítókkal — viselkedést,
     nem megoldási ötletet.
  3. (17–23) Minden AC-hez legalább egy normál és egy hibautas Given–When–Then forgatókönyvet ír.
  4. (23–28) Elkészíti a `plan.md`-t (csak függőségi sorrend és ellenőrzési stratégia) és a
     `tasks.md`-t — minden feladatnál AC + forgatókönyv + futtatandó ellenőrzés hivatkozással.
  5. (28–32) Megnevezi a döntéshozót és rögzíti az állapotot: APPROVED / BLOCKED / `DECISION
     REQUIRED — owner — next decision point`.
  Kimenet: **ötfájlos csomag (`constitution.md`, `spec.md`, `given-when-then.md`, `plan.md`,
  `tasks.md`) + explicit emberi döntés.** A MAKER_SHA a következő blokk elején, a C4 lépésben
  készül el.
- **Ezt ellenőrzöd a teremben:**
  - Mind az öt fájl létezik, és a spec.md-ben ott a hármas scope-lista.
  - Szúrópróba egy AC-n: van hibautas forgatókönyve, és a tasks.md-ből visszakövethető az
    ellenőrzésig.
  - A csomagon explicit állapot van — nem „kb. kész", hanem APPROVED / BLOCKED / DECISION REQUIRED,
    névvel.
  - Az APPROVED állapotú csomagok száma — aki BLOCKED/DECISION REQUIRED, annak a 4. blokk elején
    a tréneri referencia-csomag jár.
- **Tipikus elakadás + Plan B:** megoldásnak álcázott feltétel („legyen Redis cache") → átírni
  megfigyelhető viselkedésre; kapcsolódás nélküli feladat → AC-hez kötni vagy törölni; hiányzó
  döntéshozó → DECISION REQUIRED, az agent nem hagyhatja jóvá; nincs elérhető BA → a tréner kitalált
  kéréscsomagja, de a döntési pont akkor is rögzítve; nincs APPROVED saját csomag a C4 lépéshez →
  a tréner referencia-csomagja (`toolkit/golden-thread/spec-package/`, fejléce
  `C3-APPROVED-CONTRACT`); elakadt implementáció → `partial`/`known-good` snapshot, jelölt
  Execution mode-dal.
- **Átvezetés:** „Van jóváhagyott szerződésünk ÉS egy valódi commitunk. Most megnézzük, mi
  történik, amikor egy tőle független, friss kontextus pontosan ezt a commitot bírálja el."

## 11:45–12:30 · Orchestrátor + Repeat-Until-Good (→ [4. modul: Független review és javítási ciklus](../modulok/04-fuggetlen-review/index.html))

- **Deck:** D3 Insert B4-1 („a builder hamisat jelentett") + B4-2 („a bíráló is tévedett —
  shadcn-eset") — 2×~2 perc az 5 perces előadásban.
- **Fő üzenet:** **A szerző és a bíráló ne ugyanaz a kontextus legyen.**
- **Időfelosztás:** 5 perc előadás + 32 perc gyakorlat + 8 perc közös ellenőrzés
- **Amit elmondasz (beszédvázlat):**
  - „A szerző és a bíráló ne ugyanaz a kontextus legyen. Az önellenőrzés ugyanabból a
    gondolatmenetből indul, mint a készítés — a közös vakfolt megmarad. A független review a
    feladatból és a tényleges munkadarabból indul, friss kontextussal."
  - „Ez a Repeat-Until-Good kör: builder rögzített commitot ad át → friss reviewer bizonyítékkal
    alátámasztott megállapításokat ír → minden megállapítást ellenőrzünk → a javító csak az
    elfogadottakat módosítja új commitban → újraellenőrzés zár." (Mutasd a szerep-elválasztás
    ábrát.)
  - „A review-megállapítás még nem tény. Előbb ellenőrizni kell, aztán elfogadni vagy indokoltan
    elvetni. Saját anyagunk építésénél is előfordult, hogy a review magabiztosan tévedett — a
    szabály: verify before implementing."
  - „Ezt a False-positive Hunter gyakorlaton a saját bőrötökön tapasztaljátok: a broken snapshot
    egy valódi, minden kapun átcsúszó hibát ÉS egy hamis pozitív csalit tartalmaz. A pecsét kettős:
    a valódi hibához futtatható bizonyíték, a csalihoz indoklással rögzített REJECTED."
  - „Az orchestrator agent koordinálhatja az átadásokat, de nem veheti át az ellenőrző szerepét. És
     az emberi review meg a gépi kapu nem helyettesíti egymást: a gép a determinisztikus hibát fogja,
     az ember a szándékot és a kockázatot.”
  - „Az orchestration itt kontextus-izoláció is. A builder a jóváhagyott specet, scope-ot, standardot
    és gate-et kapja; a friss reviewer a specet, ugyanazt a standardot és a tényleges artifactot —
    de nem a builder gondolatmenetét. Az orchestratorhoz mindkettőtől tömör eredmény, evidence és
    bizonytalanság tér vissza, nem a teljes nyers log.”
  - „A dogfooding-bizonyíték: ezt az anyagot is így építettük — zöld CI után a független review
    valódi hibákat talált. A zöld pipeline szükséges, nem elégséges."
- **Amit a hallgatók csinálnak:**
  1. (0–20) **C4 készítő lépés — NEM VÁGHATÓ:** a készítő szerepű agent a jóváhagyott csomagból
     implementálja a KK-Regisztráció szeletet a saját workspace-ben (első lépésként visszamondja az
     elfogadási feltételeket és a scope-ot); a kapuk zöldjéig iterál: `npm run typecheck && npm run
     lint && npm run test`; majd commit + `git rev-parse HEAD` → **MAKER_SHA**, evidence:
     `workshop-evidence/C4-maker.md`. Ha 10 perc után sincs zöld kapu: tréneri `partial` vagy
     `known-good` snapshot (`toolkit/golden-thread/README.md`), az evidence-ben `Execution mode:
     SNAPSHOT`. Utána a szerepek szétválnak: maker / friss reviewer / fixer.
  2. (20–26) Review-csomag összeállítása: spec, a `MAKER_SHA` diffje (`git show MAKER_SHA`),
     futtatási parancsok, ismert korlátok. A reviewer friss kontextusban indul (a
     `toolkit/skills/rug-review` skill vagy a `toolkit/orchestrator/README.md` kézi kontraktusa
     szerint) — a készítő gondolatmenetét nem kapja meg.
  3. (26–36) **False-positive Hunter a broken snapshottal:** a tréner kiosztja az előre elrontott,
     kitalált változatot (`toolkit/golden-thread/fixtures/snapshots/broken`) — annak is, akinek
     nincs saját diffje. Kettős feladat: (a) a valódi hiba megtalálása és futtatható bizonyítása
     (a 48 órás lemondási határ pontos határeset-tesztje, amely elbukik, miközben minden kapu
     zöld); (b) a hamis pozitív csali elvetése bizonyítékkal (a fájl-adapter visszaolvasása
     verify-before-swap guard, nem hiba). Minden megállapítás azonosítót, helyet, súlyosságot és
     bizonyítékot kap.
  4. (22–28) Minden tétel `ACCEPTED` vagy `REJECTED` — futtatási eredménnyel vagy konkrét
     indoklással.
  5. (28–36) A fixer csak az elfogadott tételeket javítja, ÉS visszaállítja a hiányzó
     határeset-tesztet, hogy a kapu fogja a regressziót; rögzíti a `FIX_SHA`-t; (36–42) ugyanaz a
     reviewer újraellenőrzi a javítást és legalább egy regressziós kockázatot.
  6. (42–45) A visszakövetési tábla lezárása a `workshop-evidence/C5-review.md`-ben; egy
     ellenőrzött, ismétlődő hiba kijelölése az 5. modulnak.
  Kimenet: **MAKER_SHA + review-megállapítás-tábla + elutasított hamis pozitív indoklással +
  FIX_SHA + újraellenőrzési eredmény, teljes visszakövetéssel a `workshop-evidence/C5-review.md`
  fájlban**.
- **Ezt ellenőrzöd a teremben:**
  - A REV-táblában nincs nyitott HIGH súlyosságú tétel — ha van, az átadás BLOCKED.
  - MAKER_SHA és FIX_SHA különbözik és mindkettő visszakereshető; az elvetett tételeknél indoklás
    áll, nem csak „nem értek egyet".
  - A hamis pozitív csalinál REJECTED áll, írásos indoklással — aki ACCEPTED-ként „javította",
    azzal átbeszéled: verify before implementing.
  - Legalább egy tételnél megnézed: a bizonyíték tényleg megismételhető (parancs + eredmény).
- **Tipikus elakadás + Plan B:** nincs friss reviewer → a tréner előkészített, kitalált diffje egy
  valóban friss kontextusú ellenőrzővel — az önellenőrzést nem nevezzük függetlennek; nem
  reprodukálható megállapítás → nem javítunk találomra, ellenőrizetlennek jelöljük; a vizsgált
  commit review közben változik → a review leáll, új csomag készül; a teljes RUG-kör nem fér az
  időbe → a `toolkit/orchestrator/trace/sample-run.md` valós trace-én mutatod be, az evidence-ben
  `Execution mode: REPLAY`.
- **Átvezetés:** „Ebéd után arról lesz szó, hogy ami most kézi fegyelem volt — a review-tanulság —
  hogyan válik mechanikus garanciává, ami akkor is véd, amikor senki nem figyel."

## 12:30–13:15 · Ebéd

45 perc. Instruktorként: jelöld fel, kiknél maradt nyitott HIGH tétel vagy hiányzó ötfájlos
csomag — ők a délutáni gyakorlatokban a tréneri kitalált csomagokkal dolgozzanak, hogy ne
torlódjon a lemaradás.

## 13:15–14:00 · A keretrendszer megerősítése — szabályok, skillek, hookok (→ [5. modul: Tartós tudás és automatizált védelem](../modulok/05-szabalyok-es-kapuk/index.html))

- **Deck:** D3 Insert B5-1 („szabály gazda nélkül = rés") — ~2 perc nyitány, utána a modul-oldal.
- **Fő üzenet:** **A prompt kérés; a hook és a gépi kapu garancia.**
- **Időfelosztás:** 12 perc előadás + 25 perc gyakorlat + 8 perc közös ellenőrzés
- **Amit elmondasz (beszédvázlat):**
  - „A prompt kérés; a hook és a gépi kapu garancia. Délelőtt találtunk egy valódi, ismétlődő hibát
    — most abból építünk tartós védelmet, hogy soha többé ne kelljen észben tartani."
  - „Két külön döntés van, és a legtöbb zavar abból jön, hogy összemossák. Egy: hol éljen a tudás —
    szabály (tartós elvárás), skill (ismételhető eljárás), kötelező ellenőrzési pont (blokkoló
    döntés) vagy projektmemória (visszakereshető háttér). Kettő: mi indítsa el — közvetlen parancs,
    hook, pre-commit vagy CI; az MCP külső eszközt kapcsol be." (Mutasd a kétlépcsős döntési ábrát.)
  - „A hook nem a kapu alternatívája, hanem az egyik indítója. Ugyanazt az ellenőrző parancsot
    futtathatja a pre-commit hook és a CI is — egy tudás, egy fájl, több bekötési pont."
  - „A védelem bizonyítéka egyetlen fixture három állapota: PASS → szándékos FAIL → helyreállított
    PASS, ugyanazzal a paranccsal. Ha a hibás állapot nem a várt okból bukik, a védelem nincs kész."
  - „A projektmemória nem automatikus igazságforrás: a jelenlegi kóddal és dátummal összevetett,
    hivatkozott háttér. Elavult emléknél az agent emberi döntést kér, nem csendben követi."
- **Amit a hallgatók csinálnak:**
  1. (0–8) Elolvassa a 4. modul ellenőrzött megállapítását, és kimondja, milyen ismétlődő kockázatot
     kell csökkenteni.
  2. (8–18) Besorolási gyakorlat: a modul-oldal négy esete (publikus fájl tiltott azonosítója,
     ismételt review-eljárás, döntési napló, feladatkezelő-hozzáférés) — mindhez felelősség +
     indítási mód, majd összevetés a megoldókulccsal.
  3. (18–25) Kiválaszt egy igazolt megállapítást, és leírja a normál meg a tiltott állapot pontos
     elvárt eredményét.
  4. (25–37) Létrehozza a `fixtures/module-05-placeholder.md` fixture-t, és a toolkit ellenőrzőjével
     bizonyítja a blokkolást: tiszta tartalommal PASS (kilépési kód 0) → tiltott sablonjelölő
     mintával FAIL (nem nulla, a fájlnév a hibaüzenetben) → visszaállítva ismét PASS.
  5. (37–45) Rögzíti a választott indítási módot (közvetlen / hook / pre-commit / CI) és az
     eredménysort a kimenetben: **`workshop-evidence/module-05-quality-gate.md`**.
- **Ezt ellenőrzöd a teremben:**
  - A bizonyítékfájlban ott a `0 → nem nulla → 0` kilépésikód-sor, ugyanazzal a paranccsal és
    ugyanazon a fájlon.
  - A négy besorolásnál az eltérések egysoros indoklást kaptak — nem csak átmásolták a
    megoldókulcsot.
  - A választott indítási mód meg van nevezve, és illik a kockázathoz (pl. publikus tartalom →
    pre-commit + CI).
- **Tipikus elakadás + Plan B:** nincs megbízható esemény, amihez hook köthető → nem építünk
  törékeny automatizmust: ugyanaz a parancs pre-commitból vagy CI-ből fut, és ez a bekötési pont a
  bizonyítékfájlba kerül. Ha a FAIL nem a várt okból történik (pl. a parancs maga hibás), a védelem
  nincs kész — előbb a próbát kell megjavítani.
- **Átvezetés:** „Megvannak a gépi kapuk. A következő 45 percben megnézzük, hogy az egész rendszer —
  böngészőtől az adatbázisig — kibírja-e egy valódi felhasználói út terhelését."

## 14:00–14:45 · A keretrendszer rendszerpróbája (→ [6. modul: Ellenőrzés a böngészőtől az adatbázisig](../modulok/06-rendszerellenorzes/index.html))

- **Deck:** — (modul-oldal + élő demó; a design-lépésnél mutasd meg a
  `participant-starter/DESIGN-GUIDELINE.md` „Agent-driven design chain" szekcióját)
- **Fő üzenet:** **Az alkalmazás azt bizonyítja, hogy a fejlesztési rendszer valós helyzetben is működik.**
- **Időfelosztás:** 10 perc előadás + 27 perc gyakorlat + 8 perc közös ellenőrzés
- **Amit elmondasz (beszédvázlat):**
  - „»A tesztek zöldek« önmagában nem rendszerbizonyíték. Ugyanazt a kitalált felhasználói utat
    követjük a böngészőben, az API-ban és az aktív adattárolóban — egyetlen egyedi azonosítóval
    összekötve." (Mutasd a szekvencia-ábrát: böngésző → API → adat, sikeres + hibás ág.)
  - „A tesztrétegek kockázat szerint osztoznak: hibás üzleti számítás → unit; az adapter eltér a
    szerződéstől → contract; a látható út rétegek között szakad meg → E2E. Egy kockázatot nem fedünk
    le három drága teszttel megszokásból."
  - „A rétegzett bizonyítás a SAJÁT szeleteteken fut — minden parancsolt lépés létezik a
    workspace-etekben: unit (a 48 órás határeset), contract (két adapter, egy szerződés), API
    (`Invoke-RestMethod`, 201 + 409), felület (sikeres + látható hibaút), adat
    (`data/registrations.json` előtte/utána). Az aktív adatforrás a fájl-alapú LOKÁLIS tár —
    őszintén kimondjuk: nem külső adatbázis."
  - (Stretch demó, nevesített, vágható) „Az élő, adatbázisos utat a
    [referencia-appon](../../reference-app/README.md) mutatom meg: ugyanaz a port-szerződés,
    preview környezettel és Neon adatbázissal. A teljes app felépítése az építési naplóban
    dokumentált. Ez tréneri demó, nem résztvevői feladat."
  - „Minden eredményfájl közös fejléccel indul: STATUS, SOURCE_SHA, ENVIRONMENT, ADAPTER. Ha nem
    tudod, melyik commit fut és melyik adapterrel, az eredményed nem eredmény. És a memóriabeli
    adapter nem igazol adatbázis-futást — a contract test egyenlőséget bizonyít, de a rendszerpróba
    aktív forrása a fájl-tár."
  - „Kontextus-büdzsé: hibánál nem a teljes naplót öntjük az AI-ba, hanem kizárásos szűkítéssel a
    legszűkebb eltérést adjuk át."
- **Amit a hallgatók csinálnak:**
  1. (0–5) Létrehozza a `workshop-evidence/C6-rendszerellenorzes/` mappát, és a
     `00-eredet-es-verzio.txt`-be rögzíti a négymezős fejlécet (STATUS=LOCAL, SOURCE_SHA = a 4.
     modul FIX_SHA-ja, ENVIRONMENT, ADAPTER=file-store) + build + UTC-időpont.
  2. (5–14) **Unit réteg:** `npm run test` → `01-unit.txt`, kiemelve a 48 órás pontos határeset
     tesztje. **Contract réteg:** `npm run test -- repo-contract` → `02-contract.txt`, kimondva:
     a memória-adapter kontraktus-egyenlősége bizonyított, az aktív forrás a fájl-tár.
  3. (14–24) **API réteg:** először elmenti a kiinduló adatállapotot (`Get-Content
     data\registrations.json` — ez a `05-data.txt` „előtte" fele), majd futó `npm run dev` mellett
     PowerShell-ből `Invoke-RestMethod`: POST (201) + GET (lista) + második POST ugyanazzal az
     e-maillel → 409 duplicate → parancs + válasz a `03-api.txt`-be.
  4. (24–33) **Felületi réteg:** a `/regisztracio` oldalon sikeres út (új jelentkezés a listában,
     MÁSIK egyedi kitalált e-maillel) + látható hibaút (duplikált e-mail → hibaüzenet a felületen);
     képernyőkép → `04-ui.png`. **Browser Boss Fight:** ha az agent vezérli a böngészőt (Claude
     `--chrome` / Codex `@Browser`) és ő hajtja végre + dokumentálja → extra pecsét; kézi
     végrehajtás = `Execution mode: MANUAL` (nem replay).
  5. (33–40) **Adat réteg:** `Get-Content data\registrations.json` újra → `05-data.txt` („utána");
     a különbség pontosan az új rekordok. Őszinte megfogalmazás: aktív, perzisztens LOKÁLIS
     adatforrás, nem külső adatbázis.
  6. (40–45) `06-kovetkeztetes.md`: mit igazolnak a rétegek, mi maradt ellenőrizetlen, egyezik-e
     minden fejléc, mi volt a `04-ui.png` végrehajtási módja (AGENT/MANUAL). Kimenet: **a hétfájlos
     evidence-mappa**.
- **Ezt ellenőrzöd a teremben:**
  - A mappában megvan mind a hét fájl (00–06), a négymezős fejléc a szöveges fájlokban azonos, és a
    SOURCE_SHA a review utáni commit.
  - Az egyedi kitalált e-mail mindhárom rétegben (API, felület, adat) követhető; a 409-es hibaútnál
    tényleg nem jött létre új rekord.
  - A `04-ui.png` végrehajtási módja jelölt (AGENT → extra pecsét, vagy MANUAL); senki nem állít
    külső adatbázist a fájl-tárról.
- **Tipikus elakadás + Plan B:** nem fut a saját szelet → catch-up a tréner `known-good`
  snapshotjából scratch branchen (`toolkit/golden-thread/README.md`), a fejlécben a
  snapshot-állapot SHA-ja — a futásokat a résztvevő így is maga végzi; semmi nem fut → a tréner
  SHA-hoz és adapterhez rögzített, kitalált REPLAY-csomagja, minden átvett fájlban `STATUS=REPLAY`
  — élő URL-t vagy PASS-t kitalálni tilos. Verzióeltérésnél vagy ismeretlen tesztparancsnál
  megállás; éles vagy személyes adat soha.
- **Átvezetés:** „Greenfieldben bizonyított a rendszer. A szünet után jön a nehezebb kérdés: hogyan
  visszük be ugyanezt egy meglévő, ismeretlen viselkedésű legacy kódbázisba?"

## 14:45–15:00 · Szünet

10 perc a rácson + ráhagyás. Instruktorként: készítsd elő a .NET/tSQLt demókörnyezetet és az Azure
DevOps nézetet a legacy blokkhoz; ellenőrizd, kinél hiányzik a 6. modul evidence-mappája.

## 15:00–16:15 · Legacy blokk: .NET / MS-SQL / Azure DevOps (→ [7. modul: Legacy rendszer biztonságos változtatása](../modulok/07-legacy-rendszer/index.html))

- **Deck:** D4 „Legacy — billzone.eu sztori" HA elkészült (WEN-336, Codex-sáv); fallback: a
  modul-7 oldal + a régi „M7 — Code + Agentic v2" Gamma.
- **Fő üzenet:** **Előbb biztonsági háló, utána modernizáció.**
- **Időfelosztás:** 18 perc előadás (benne a TFS/Azure DevOps demó) + 45 perc gyakorlat + 12 perc
  közös ellenőrzés
- **Amit elmondasz (beszédvázlat):**
  - „Előbb biztonsági háló, utána modernizáció. A cél nem a teljes rendszer megértése, hanem egy
    megfigyelhető üzleti út körülhatárolása, védelme és visszaállítható változtatása."
  - „Először szétválasztjuk a jelenlegi megfigyelt viselkedést a kívánt jövőbelitől. A
    characterization teszt a *jelenlegit* rögzíti — akkor is, ha az üzletileg »rossz«. A kívánt
    szabály külön üzleti döntés." (Mutasd a védtelen vs védőhálós út ábrát.)
  - „Egy teszt attól háló, hogy fog: a kitalált ShippingThresholdLab példában a `subtotal >= 10000`
    feltételt `>`-ra rontjuk, és a határeset-teszt FAIL-t ad — visszaállítás után újra három PASS.
    Ha a mutáció után is minden zöld, a háló nem bizonyított, és a kódhoz nem nyúlunk."
  - „Ezután jön a seam: a `ShippingPolicy` cserepont, azonos szerződéssel a régi és az új út előtt.
    Egyetlen Strangler-lépés, egyetlen pilot-útvonal, előre rögzített stop-szabállyal és
    rollback-kel. »Visszacsináljuk« — az nem terv; kapcsoló, csomag vagy parancs, felelőssel."
  - (Demó, ~5 perc) „Ugyanez a működés a meglévő enterprise eszközláncban: Azure DevOps-ban mutatom,
    hogyan él a spec-kapu, a PR-review és a pipeline-kapu TFS/Azure DevOps környezetben — ehhez nem
    kell résztvevői környezet, csak nézzétek."
  - „Zöld build nem bizonyítja a viselkedés megőrzését; a mutációt elkapó characterization teszt
    igen."
- **Amit a hallgatók csinálnak:**
  1. (0–8) Kiválaszt egyetlen megfigyelendő üzleti utat a 6. modul eredményéből, a maradó
     kockázattal együtt.
  2. (18–30) Végigköveti a kitalált .NET példát: három characterization eset (tipikus, határérték,
     összetett), megfigyelt eredménnyel — futtatható saját példa hiányában a toolkit letölthető
     `LegacyShop` mintáján.
  3. (30–40) Ellenőrzi a kontrollált mutáció bukását: baseline 3 PASS → mutáció után az érintett
     teszt FAIL → visszaállítás után ismét 3 PASS.
  4. (40–60) Kijelöli a seamet, a legkisebb viselkedéssemleges változtatást és egyetlen
     Strangler-lépést, stop-szabállyal és konkrét rollback-kel.
  5. (60–75) Kitölti a **`legacy-entry-plan.md`**-t a modul sablonszerkezete szerint (Mission and
     scope / Observed behavior / Safety net evidence / Smallest reversible change / Stop and
     rollback) — három megfigyelt sor `OBSERVED`, `UNKNOWN` vagy `DECISION REQUIRED` státusszal.
- **Ezt ellenőrzöd a teremben:**
  - A `legacy-entry-plan.md`-ben pontosan három megfigyelt sor van forrással és státusszal — kívánt
    jövőbeli szabály nem szerepel tényként.
  - A Safety net szekcióban ott a baseline / mutáció-FAIL / visszaállított PASS hármas, `Execution
    mode: LOCAL` vagy `REPLAY` jelöléssel.
  - A rollback konkrét (kapcsoló, csomag vagy parancs + felelős), és van megnevezett tiltott
    refaktor.
- **Tipikus elakadás + Plan B:** nincs .NET SDK vagy nem fut a minta → REPLAY mód a legacy
  toolkit-útmutató három megnevezett eredményfájljával; mivel mutációs és visszaállítási eredmény
  nincs a csomagban, azok `UNKNOWN`, a háló `BLOCKED` — a terv elkészülhet, de kódváltoztatás és
  „kész" állítás tilos. További tipikus hibák: a kívánt szabály belecsúszik a baseline-ba
  (szétválasztani); mutáció után is zöld (a tesztet javítjuk, nem a kódot visszük tovább); nincs
  seam (az első lépés csak cserepont-létrehozás legyen).
- **Átvezetés:** „Egyéni szinten mindent láttatok: greenfield, rendszerpróba, legacy. Az utolsó
  munkás blokkban ebből csapatműködést csinálunk — mérhető pilottal, nem lelkesedéssel."

## 16:15–16:50 · Csapat operating model + modell-/eszközcsere + 30/60/90 (→ [8. modul: Csapatszintű bevezetés](../modulok/08-csapatbevezetes/index.html))

- **Deck:** D5/a „A jövő + hogyan tovább" HA elkészült (WEN-337, Codex-sáv); fallback: modul-8 oldal.
- **Fő üzenet:** **A minőség a keretrendszer tulajdonsága legyen, ne egyetlen modellé.**
- **Időfelosztás:** 10 perc előadás + 18 perc gyakorlat + 7 perc közös ellenőrzés — a modul-oldal 45
  percre méretezett; a teremben a „Homokóra" kitöltött példát használjuk állványzatnak, nem nulláról
  írunk
- **Amit elmondasz (beszédvázlat):**
  - „A minőség a keretrendszer tulajdonsága legyen, ne egyetlen modellé. Ha a modell, a provider
    vagy az ár változik, a spec, a DoD és a gate-ek maradnak — a váltást reprezentatív evalon
    mérjük, nem hangulaton."
  - „Az eszközválasztás nem bevezetés. A csapatnak felelős szerep, szűk és visszafordítható pilot,
    mérhető jel és emberi döntési pont kell." (Mutasd a modul áttekintő ábráját.)
  - „A kontrollált eval nálunk konkrét: a befagyasztott feladat a broken snapshot review-ja — ma
    délelőtt már láttátok. Claude ÉS Codex ugyanazt kapja, és ugyanazt a scorecardot töltitek ki:
    helyesség, evidence-minőség, emberi beavatkozások száma, eltelt idő, maradék kockázat. A
    kitöltött scorecard az evidence. Az eval döntést készít elő, nem automatikusan győztest hirdet."
  - „Párban dolgozóknál Build–Review–Swap váltó: a két kör között a készítő és a reviewer szerepet
    ÉS agentet is cserél — a pecsét a váltó teljesítéséért jár."
  - „És az utolsó próba: a memória nem kapu, hanem visszakereshetőség — a repo maga a memória.
    Zárjátok be a sessiont, nyissatok újat, és kérdezzétek meg: mi a cél, milyen döntések születtek,
    mik a korlátok, mi a következő lépés? Az agentnek az AGENTS.md + spec-csomag + evidence alapján
    kell rekonstruálnia, memória-trükk nélkül."
  - „Nézzétek a kitalált Homokóra-példát a modul-oldalon: a B változat kevesebb téves
    megállapítással és idővel találta meg ugyanazt a magas hibát, ezért az ment pilotba — a 30.
    napon mégis »javítandó« lett a kapu, mert egy magas súlyú megállapítás nyitva maradt. Így néz ki
    az őszinte mérés."
  - „A 30/60/90 minden kapuja külön emberi döntés: a naptári idő nem jogosít fel bővítésre. A 60/90
     alapállapota: DECISION REQUIRED.”
  - „Az autonómia nem egyenlő azzal, hogy bekapcsolunk egy loopot. A Goal, `/loop` vagy schedule csak
    új futást indít. 24/7-ben heartbeat, független watchdog, liveness/readiness/progress health,
    checkpoint, idempotens retry, megfigyelhetőség és kill switch kell. Self-healing csak ismert
    hibára, korlátozott playbookkal történhet; ismeretlen vagy ismétlődő hibánál megáll és embert
    riaszt.” (Mutasd a [supervision-ábrát](../modszertan/index.html#autonomia).)
- **Amit a hallgatók csinálnak:**
  1. (0–5) **Projektmemória-próba új sessionben (C7):** session lezárása → ÚJ session a
     workspace-ben → a négy kérdés („mi a cél, milyen döntések születtek, mik a korlátok, mi a
     következő lépés?") → az agent az AGENTS.md + spec-csomag + evidence alapján rekonstruál,
     forráshivatkozással. Evidence: `workshop-evidence/C7-memoria.md` (a rekonstruált állapot + mi
     hiányzott; a hiány repo-fájlban pótlandó, nem a chatben).
  2. (5–12) **Kétagentes scorecard:** a broken snapshot review-ja mint befagyasztott feladat,
     Claude-dal ÉS Codex-szel; a scorecard (helyesség / evidence-minőség / emberi beavatkozások /
     idő / maradék kockázat) kitöltve a `model-harness-eval.md`-be — párban Build–Review–Swap
     váltóval (szerep- és agentcsere a két kör között).
  3. (12–18) `agent-ready-audit.md` (leggyengébb képesség + kitalált felelős szerepálnév) és
     `adoption-30-60-90.md` (30 napos pilot hatókör, mérések) — a Homokóra-példa átszabásával, nem
     nulláról; a 60/90 állapota `DECISION REQUIRED — owner — next decision point`.
  4. (checkpoint) Egy társ **csak a fájlokból** visszamondja: leggyengébb képesség, felelős szerep,
     következő feladat, mérés, leállási feltétel.
  5. **Ha legalább 6 perc időelőny van:** „Linear autopilot” kártyás dry-run a
     [módszertan oldal állapotgépe](../modszertan/index.html#linear-autopilot) szerint. Öt szerep:
     scheduler, orchestrator, worker, watchdog, emberi kapu. Egy hiba-kártyánál a csoport dönt:
     idempotens retry, rollback, quarantine vagy stop + eszkaláció. Nincs élő automatikus merge vagy deploy.
  Kimenet: **a három bevezetési fájl + `workshop-evidence/C7-memoria.md` + kitöltött kétagentes
  scorecard, kitalált szerepnevekkel**.
- **Ezt ellenőrzöd a teremben:**
  - A három fájl nem mond ellent egymásnak: ugyanaz a hiány, ugyanaz a szerep, ugyanaz a következő
    döntés fut végig rajtuk.
  - A `C7-memoria.md`-ben forráshivatkozás áll (melyik fájlból jött a rekonstrukció), és a hiány
    repo-pótlásként jelölt, nem chat-jegyzetként.
  - A scorecard mind az öt szempontra kitöltött mindkét agentre; pecsét csak evidence-re jár,
    sosem gyorsaságra.
  - Minden bővítéshez mérési feltétel tartozik, és a 60/90 tényleg DECISION REQUIRED.
  - Csak kitalált szerepálnevek szerepelnek — valódi név, ügyfél vagy belső azonosító nem.
- **Tipikus elakadás + Plan B:** hiányzó saját eredmény vagy valódi felelős → a tréner kitalált
  felmérése és szerepálnevei, teljes kitalált 30 napos pilottal; csak egy agent érhető el → a
  scorecard másik oszlopát a tréner kitalált mintafutása adja, jelölve; új session nem indítható →
  a memóriapróba kérdéseit a társ teszi fel, és a válasz kizárólag repo-fájlokból adható.
  Megállási szabály: ha a referenciafeladat, a leállási feltétel vagy a döntéshozó szerep
  hiányzik, a csomag nincs kész.
- **Átvezetés:** „Utolsó tíz perc: közösen megnézzük, mit visztek haza ténylegesen — nem érzésre,
  hanem audit-szemmel."

## 16:50–17:00 · Agent-ready repo audit, zárás, Q&A, visszajelzés

- **Deck:** D5/b záró diák (ha D5 elkészült; fallback: szóban) + a visszajelzés-QR kivetítése
  (WEN-340 Google Form URL — a Discord-csatornába is posztold ugyanekkor).
- **Fő üzenet:** **A hazavihető eredmény az ismételhető operating model és annak bizonyítékcsomagja.**
- **Időfelosztás:** 3 perc előadás + 7 perc közös ellenőrzés (audit + visszajelzés)
- **Amit elmondasz (beszédvázlat):**
  - „A hazavihető eredmény nem a mai app, hanem az ismételhető operating model és a
    bizonyítékcsomagja. Nézzétek végig a saját láncotokat: helyzetkép → repo-szerződés → ötfájlos
    spec → review-nyomvonal → gépi kapu → rendszereredmény → legacy-terv → három bevezetési fájl. Ez
    együtt az agent-ready repo audit."
  - „Holnapi első lépés: egyetlen jóváhagyott referenciafeladat a saját csapatban, ugyanezzel a
    körrel. Ne vezessetek be mindent egyszerre — egy squad, egy repo, egy pilot."
  - „Két perc Q&A, aztán visszajelzés — konkrétan: mi volt a leggyengébb blokk, és mit használnátok
    már holnap."
- **Amit a hallgatók csinálnak:**
  1. Végigpipálja a saját munkadarab-láncát a [napirend-oldal](../napirend/index.html) táblázata
     alapján — ami hiányzik, azt otthoni pótlásként jelöli, nem késznek.
  2. Kijelöli és kimondja: a leggyengébb képesség, a felelős szerep és a következő referenciafeladat
     (a 8. modul fájljaiból).
  3. Kitölti a visszajelzést.
- **Ezt ellenőrzöd a teremben:**
  - Mindenki meg tudja nevezni a következő, saját csapatban jóváhagyható lépését.
  - A hiányzó munkadarabok „pótlandó" jelölést kaptak, nem hallgatólagos PASS-t.
- **Tipikus elakadás + Plan B:** ha elfogy az idő, az audit-visszamondás párban, írásban történik
  (két perc), és csak a következő lépés hangzik el közösen.
- **Zárómondat:** „A módszer akkor él, ha kedden reggel az első feladatot már issue-spec-kapu-review
  körben viszitek — a repo és a toolkit ehhez már a tiétek."

---

## Ha csúszik a nap

Vezérelv (a napirend-oldalról): a Plan B nem a tanulási cél elhagyása — a gépelést rövidítsd
előkészített mintával, de a döntés, az ellenőrzés és a résztvevő saját kimenete maradjon.
**Soha nem a közös ellenőrzést vágjuk, hanem a gyakorlat utolsó iterációját.**

A vágható sáv az [agenda](../agenda.md) **47 perces nevesített puffere**: M2 második szabálykör
10p · M4 második RUG-kör 8p · M5 második hook-kör 7p · M7 Azure DevOps kiegészítés 15p ·
M8 eval-mélyítés 7p. Csúszásnál ezekhez nyúlsz, ebben a sorrendben az adott blokkon belül.

**Deck-vágási sorrend** (ha az előadás-sáv csúszik): először a D2 appendix-diák esnek ki, majd a
D1 appendixek, aztán a D3 insertek szűkülnek blokkonként egyre; a D4/D5 deck bármikor
talk-overré alakítható a modul-oldal fölött. A D3 Dia 4b (AI-natív KULCSKONCEPCIÓ) és a
blokkonkénti Fő üzenet kimondása nem vágható.

| Blokk | Ezt vágd (sorrendben) | Ez nem vágható |
|---|---|---|
| 1. Bevezető | A réteg- és tölcsér-ábra magyarázatát rövidítsd; a 7 diagnózis-lépésből elég 4 (cél, határok, ellenőrzés, ismeretlenek) | A setup-ellenőrzés, a társ-visszamondás és az útlevél/bingó kiosztása |
| 2. Repo | **Második szabálykör (10p):** a 47–60. perc (worktree-rend + CI/preview elhelyezés) instruktori demóvá alakítható | A friss agentes negatív próba (FAIL → helyreállított PASS) |
| 3. Spec | Szűkíts egyetlen AC-ra (egy normál + egy hibautas forgatókönyv); a constitution átvehető a tréneri mintából | Az explicit döntési állapot rögzítése — csúszásnál a spec-iterációt rövidítsd; a C4 készítő lépés a 4. blokk eleje, és ott NEM vágható |
| 4. Review | **Második RUG-kör (8p):** a regressziós újraellenőrzés szűkíthető egyetlen tételre; a review-csomag sablonból tölthető | Minden HIGH tétel lezárása vagy BLOCKED jelölése, és a False-positive Hunter kettős pecsétje (bizonyított hiba + indokolt REJECTED) |
| 5. Kapuk | **Második hook-kör (7p):** a besorolási gyakorlat közösen, szóban is elvégezhető | A PASS → FAIL → PASS hármas ugyanazon a fixture-ön |
| 6. Rendszerpróba | A reference-app stretch demó (preview + Neon) és a Browser Boss Fight extra pecsét elhagyható; a felületi hibaút közös demóként is futhat | A négymezős fejléc (STATUS/SOURCE_SHA/ENVIRONMENT/ADAPTER) és a rétegzett mag: unit (48 órás határeset) → API (201 + 409) → adat (előtte/utána) |
| 7. Legacy | **Azure DevOps kiegészítés (15p):** a demó 2 percre húzható; a kitalált példa végigkövetése (18–30. perc) rövidíthető | A mutáció-bukás ellenőrzése és a `legacy-entry-plan.md` stop/rollback szekciója |
| 8. Bevezetés | **Eval-mélyítés (7p):** a scorecard második agent-futása tréneri kitalált mintából pótolható (jelölve); az eval-fájl a Homokóra-példa átszabásával készül, nem nulláról | A memóriapróba (`C7-memoria.md`), a fájlok konzisztencia-visszamondása és a 60/90 DECISION REQUIRED |
| 9. Zárás | A Q&A rövidíthető | A következő jóváhagyható lépés kimondása |

Ha egy blokk több mint 15 percet csúszik: az adott modul Plan B-csomagjára váltasz (tréneri
kitalált minta), és a lemaradó résztvevő a **döntést és az ellenőrzést** végzi el a kész anyagon —
a gépelést nem pótoljuk a következő blokk rovására.
