# Take-home toolkit — innen folytasd, ahol a repód tart

Ez a toolkit az [agent-ready repo](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak)
hordozható alkatrészkészlete. Nem kell mindent egyszerre bemásolni. Előbb keresd meg a repód
legutolsó **bizonyított** C0–C7 checkpointját, majd válaszd az alábbi legkisebb csomagot.
A checkpointok részletes jelentése az
[`agent-ready-repo.md`](../materials/agent-ready-repo.md#checkpointok) oldalon olvasható.

Az alkalmazás vagy más reprezentatív fejlesztési feladat a rendszer próbaterhelése; a hazavihető
termék maga az ismételhető működés: jóváhagyott
[spec](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak), elkülönített szerepek, mechanikus kapuk és
visszakereshető [evidence](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak).

> **Döntési szabály:** ne azt kérdezd, melyik komponenst másold ki, hanem azt, melyik következő
> képességet tudod a legkisebb csomaggal bizonyítani.

Ha még a workshop munkakörnyezete sincs bizonyítva, kezdd a
[`setup/` C0 doctor + bootstrap útjával](setup/README.md). Ez külön participant repót és
evidence-könyvtárat készít, majd ugyanazzal a diagnosztikával PASS, REPLAY vagy BLOCKED
eredményt ad Claude, Codex vagy mindkét agent használatához.

## Gyors döntési útvonal

| Amit ma bizonyítani tudsz | Következő útvonal | Következő bizonyítható képesség |
|---|---|---|
| A workshop eszközei vagy a külön participant munkatér még nincsenek bizonyítva | [C0 — doctor és bootstrap](setup/README.md) | A gép és a munkatér állapota futtatott evidence-ből, nem feltételezésből ismert. |
| A repó célja, határai és valódi parancsai még nincsenek a repóban | [C1 — repóidentitás](#c1--a-repó-tudja-mi-ő) | Az agent nem találgatja a munkateret és a szabályokat. |
| A repó szabályai megvannak, de a kérés még nem jóváhagyható munkaszerződés | [C3 — spec-kapu](#c3--a-kérésből-jóváhagyott-munkaszerződés-lesz) | A viselkedés, scope és bizonyítás implementáció előtt ellenőrizhető. |
| Van jóváhagyott spec, de a szerző önmagát ellenőrzi, vagy a kapuk csak leírások | [C4–C5 — RUG és mechanikus kapuk](#c4c5--független-review-és-mechanikus-kapuk) | A review független, a kötelező minimum pedig narráció helyett fut. |
| Egy reprezentatív slice már végigment a teljes úton | [C6–C7 — rendszerpróba és hordozhatóság](#c6c7--rendszerpróba-és-választható-hordozhatósági-út) | Ugyanaz a működés valós terhelésen és a repóhoz illő következő kontextusban is ismételhető. |

Ha egy sor állítása csak dokumentálva van, de nincs hozzá futási bizonyíték, még az előző
checkpointnál tartasz. A C2 közös szakmai lécét nem ugorjuk át: a C1 csomaggal együtt kell
kanonizálni, mielőtt C3-ra lépsz.

## C1 — A repó tudja, mi ő

**Ezt válaszd, ha:** egy új agent még chatből vagy emberi emlékezetből tudná csak meg a célt,
a tiltott területeket és a valódi ellenőrző parancsokat.

**Legkisebb hasznos csomag:** [`AGENTS.md`](AGENTS.md) + az egyetlen kanonikus
[`engineering-standards.md`](standards/engineering-standards.md), benne a repo közvetlenül
futtatható valódi ellenőrző parancsaival és közös Definition of Done-jával.

**Másold és igazítsd:** a starter szabályait a célrepo gyökerébe; nevezd meg a missiont,
[scope boundaryt](../materials/fogalomtar.md#scope-boundary), adat- és publikus szabályokat,
tiltott útvonalakat és tényleges parancsokat. A
[`checks.project.example.json`](hooks/checks.project.example.json) konfigurációból készíts
repo-saját, nem-example fájlt csak akkor, ha már a későbbi mechanikus bekötést készíted elő;
ez **opcionális C5-előkészítés**, nem a C1 készültségi feltétele. Töröld a nem létező
parancsokat, ne találj ki helyettük újakat. A maker és a reviewer ugyanarra a
standardfájlra hivatkozzon.

**Minimum proof:** egy friss agent a repóból visszamondja a célt, az engedett scope-ot, a
tiltott területeket és a közös minőségi lécet; a standardban dokumentált valódi parancsok
közvetlenül lefutnak, az issue pedig rögzíti az exact parancsot és az eredményt. Stop-runner,
CI-bekötés és blokkoló negatív fixture majd a C4–C5 út bizonyítéka.

## C3 — A kérésből jóváhagyott munkaszerződés lesz

**Ezt válaszd, ha:** a repó identitása és közös minőségi léce már bizonyított, de a ticketből
még hiányzik az ellenőrizhető viselkedés, a név szerinti out-of-scope vagy a humán döntési kapu.

**Legkisebb hasznos csomag:** a
[`spec-templates/` végrehajtható csomagja](spec-templates/README.md), benne a
[`constitution`](spec-templates/constitution.md), [`spec`](spec-templates/spec.md),
[`Given–When–Then`](spec-templates/given-when-then.md), [`plan`](spec-templates/plan.md) és
[`tasks`](spec-templates/tasks.md) sablonnal, valamint a [`spec-gate`](checklists/spec-gate.md).

**Másold és igazítsd:** a sablonokat munkapéldányként másold a célrepo egyetlen, verziózott
spec-csomagjába. Töltsd ki a tényleges issue, standard, modulok és parancsok alapján. Minden
acceptance criterion kapjon scenario-t, ownert, rendezett taskot, exact checket és evidence-helyet.
Üzleti bizonytalanságnál `DECISION REQUIRED`; csak a megnevezett ember hagyhatja jóvá a kaput.

**Minimum proof:** létezik ember által verziózott constitution, approved spec és plan; az
AC → scenario → task → exact check → evidence mátrix teljes; nincs kitöltetlen placeholder;
a diff kizárólag a kijelölt spec-csomag, feature-implementáció még nem indult.

## C4–C5 — Független review és mechanikus kapuk

**Ezt válaszd, ha:** a builder jóváhagyott specből dolgozik, de nincs valóban friss kontextusú
bíráló, bizonyított finding-disposition vagy automatikusan blokkoló minőségi minimum.

**Legkisebb hasznos csomag:** a runtime-semleges
[`RUG`](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak)
[`folyamatszerződése`](orchestrator/README.md), a [`reviewer szerepek`](orchestrator/reviewer-agents.md),
a [`dedup + verify`](orchestrator/dedup-and-verify.md), a futtatható
[`rug-cycle.workflow.js`](orchestrator/rug-cycle.workflow.js), valamint a meglévő
[`WEN-185 gate-ek`](hooks/README.md#repo-quality-gates-wen-185). A teljes, visszajátszható
[`sample trace`](orchestrator/trace/sample-run.md) és
[`journal`](orchestrator/trace/sample-run.journal.jsonl) példa, nem újragyártandó sablon.

**Másold és igazítsd:** tartsd változatlanul a maker → fresh reviewer → finding-verification
→ fixer → re-check szerephatárokat; csak a subagent-indítást igazítsd a választott agent
hivatalos adapteréhez. A négy validátort és a repo valódi lint/typecheck/test parancsait kösd
stop hookba vagy CI fallbackbe. A negatív fixture bizonyítsa, hogy a hibás út tényleg blokkol.

**Minimum proof:** a run log összeköti a specet, scope-ot, maker SHA-t, exact gate-kimeneteket,
független findingokat, elfogadott/elutasított dispositiont, javítást és újrafuttatást. Legalább
egy blokkoló negatív út bukik, a javított út zöld, és nincs ellenőrizetlen critical/high finding.

## C6–C7 — Rendszerpróba és választható hordozhatósági út

**Ezt válaszd, ha:** a teljes C1–C5 út már működik egy kis változtatáson, és most azt kell
bizonyítani, hogy nem egyszeri demo vagy egyetlen modellhez kötött trükk.

**Legkisebb hasznos csomag (közös C6-alap):** a már bizonyított C1–C5 operating model alkalmazása egy
reprezentatív workloadra, kiegészítve a [`memory/retrieval kittel`](memory/README.md) és a
[`context-budget`](checklists/context-budget.md) ellenőrzésével. Ehhez válassz **egy**, a repód
helyzetéhez illő C7 ágat; a többi ág nem előfeltétel.

| Válaszd ezt a C7 ágat, ha… | Legkisebb kiegészítés | Az ág minimum evidence-e |
|---|---|---|
| A következő feature-rel akarod bizonyítani az ismételhetőséget | Ugyanaz a spec → RUG → gate → trace szerződés | Egy második, külön issue-ban végigvitt változtatás teljes trace-e ugyanazzal a minőségi léccel |
| Modellt vagy agent harnesst cserélnél | Változatlan reprezentatív eval-workload és acceptance criteria | Összehasonlított sikeresség, minőség, költség/latencia és emberi review-terhelés; emberi váltási döntés |
| A célrepo legacy .NET/MS-SQL környezet | Az **INVENTED** mintájú [`legacy playbook`](legacy-playbook/README.md), a [`strangler-fig/YARP`](legacy-playbook/strangler-fig-yarp.md) lépés és a [`legacy/adoption minimum`](checklists/legacy-adoption.md) | `dotnet test`: 3 passed; kontrollált mutációt elkapó characterization test; választott seam, rollback és fallback |
| Csapatszintű bevezetés a cél | A [`legacy/adoption minimum`](checklists/legacy-adoption.md) adoption pontjai | Pilot owner, mérce, fallback és bizonyítékhoz kötött 30/60/90 kapuk |

**Csak ha generált UI is van:** a meglévő
[`Design Guideline`](../participant-starter/DESIGN-GUIDELINE.md) és
[`MCP-konfigurációs példa`](../participant-starter/.mcp.json.example) egészíti ki a memóriát.
Ez önmagában nem külön C7 ág; a hozzá tartozó evidence a guideline-ra hivatkozó prompt és a
vizuális review. Ne készíts róluk párhuzamos leírást.

**Másold és igazítsd:** a döntéseket
[ADR-be](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak), a tartós szabályokat a legközelebbi `AGENTS.md`-be,
a work state-et a trackerbe tedd. A reprezentatív workloadon tartsd változatlanul a specet,
DoD-ot és gate-eket. Ezután csak a kiválasztott C7 ág assetjeit és evidence-szerződését
igazítsd a repóhoz. Ha a legacy ágat választottad, előbb
[characterization test](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak), majd a legolcsóbb
[seam](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak) és egy kis
[vertical slice](../materials/fogalomtar.md#1-agentikus-fejlesztés--alapfogalmak); rewrite csak
külön emberi döntéssel.

**Minimum proof:** C6-hoz legalább egy teljes browser/preview/API/adat út és egy valódi hibaág
evidence-e visszakereshető. C7-hez ehhez add hozzá **csak a kiválasztott ág** fenti evidence-ét.
A záró audit minden ágban rögzíti az ownert, a maradó kockázatot és a következő bevezetési
kaput; nem követel legacy- vagy generált-UI bizonyítékot olyan repótól, ahol ez nem releváns.

## Kattintható, kanonikus asset-térkép

A linkek relatívak: ugyanaz a cél nyílik meg lokális Markdown-renderelőben és a publikált
repo-oldalon. A térkép a
[`WEN-211 kanonikus baseline`](https://github.com/cspiya/wshp-ai-dev-2026/tree/1e8a903753d3d2860be4ef16729dba4aa8370638/toolkit)
meglévő assetjeire mutat; egyik sort sem kell újraalkotni.

| Eredet | Asset | Mire való | Szándékolt érettség | Kötelező evidence |
|---|---|---|---|---|
| WEN-121 | [`spec-templates/README.md`](spec-templates/README.md) | Constitution → spec → GWT → plan → tasks, humán kapukkal | C3 | Jóváhagyott verziók és teljes AC-evidence mátrix; feature-fájl változatlan |
| WEN-118 | [`orchestrator/README.md`](orchestrator/README.md) | Maker/reviewer/fixer RUG-szerződés | C4 | Fresh-context review packet, finding disposition, bounce-back és re-review |
| WEN-118 | [`trace/sample-run.md`](orchestrator/trace/sample-run.md) | Valódi, visszajátszható RUG run és hamis finding elutasítása | C4 | Run log + gépi journal + emberi merge gate |
| WEN-185 | [`check-placeholders`](hooks/check-placeholders.mjs), [`check-notebooks`](hooks/check-notebooks.mjs), [`check-links`](hooks/check-links.mjs), [`check-public-content`](hooks/check-public-content.mjs) | Négy repószintű validator; a bekötési szerződés a [`hooks/README.md`](hooks/README.md#repo-quality-gates-wen-185) oldalon van | C5 | Exact parancs/exit code; zöld pozitív és blokkolt negatív út |
| WEN-120 | [`memory/README.md`](memory/README.md) | Szabály, döntés, work state és retrieval helyének szétválasztása | C5–C7 | Egyetlen kanonikus forrás, tracker-trace, visszakereshető ADR/rule |
| WEN-120 | [`DESIGN-GUIDELINE.md`](../participant-starter/DESIGN-GUIDELINE.md) | Generált UI tartós vizuális memóriája, ha a repóban van generált UI | C5–C6 kiegészítő | Kitöltött guideline-ra hivatkozó prompt és vizuális review |
| WEN-122 | [`legacy-playbook/README.md`](legacy-playbook/README.md) | Választható legacy ág: safety net → seam → strangler, INVENTED .NET/MS-SQL mintán | C6–C7, csak legacy kontextusban | 3 passing characterization test + mutációs bukás + rollback/fallback |

## Közös zárókapu

Minden útvonal után ugyanaz a szabály: előbb futtatott evidence, utána érettségi állítás.
A toolkit saját publikus és linkellenőrzései a repó gyökeréből:

```powershell
node toolkit/hooks/check-placeholders.mjs
node toolkit/hooks/check-notebooks.mjs
node toolkit/hooks/check-links.mjs
node toolkit/hooks/check-public-content.mjs
```

A termékspecifikus subagent-indítás, hook-esemény és modellkonfiguráció adapterpont. Ezeket a
telepített termék aktuális hivatalos dokumentációjából kösd be; ha nincs determinisztikus
lokális stop hook, ugyanazokat a parancsokat pre-commitban és CI-ban futtasd. A publikus guard
backstop, nem teljes DLP vagy secrets scanner, a fresh-context review pedig csak új sessionnel
vagy külön agenttel független.
