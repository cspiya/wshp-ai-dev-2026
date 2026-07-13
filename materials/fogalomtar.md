# Fogalomtár — Wenova AI-Assisted Development Workshop (2026.07)

> A workshop tananyaga magyarul íródik, de a szakma angol kifejezéseit használjuk (ezek a mindennapi
> munkában is így jönnek szembe). Ami nem magától értetődő, azt itt találod. Két rész: **agentikus
> alapfogalmak** és a **stack elemei** (.NET-es párhuzamokkal, mert onnan jöttök).

---

## 1. Agentikus fejlesztés — alapfogalmak

| Fogalom | Mit jelent |
|---|---|
| **LLM** (Large Language Model) | Nagy nyelvi modell — a Claude, GPT stb. mögötti technológia. Szöveget kap (kontextus) és szöveget ad vissza. |
| **Agent / ágens** | LLM, ami nem csak válaszol, hanem **eszközöket használ** (fájlt olvas/ír, parancsot futtat, API-t hív) és többlépéses feladatot visz végig önállóan. |
| <a id="claude-code"></a>**Claude Code** | Az Anthropic agentikus fejlesztési felülete, amely repófájlokon, fejlesztői eszközökön és kapcsolt szolgáltatásokon képes többlépéses munkát végezni. A workshop kötelező módszertani útja ezzel vagy Codexszel is végrehajtható. [Hivatalos leírás](https://code.claude.com/docs/en/features-overview). |
| <a id="codex"></a>**Codex** | Az OpenAI coding agentje, amely helyi vagy felhős környezetben fájlokat, eszközöket, böngészőt és kapcsolt szolgáltatásokat használhat. [Hivatalos fogalomtár](https://learn.chatgpt.com/docs/glossary). |
| **Token** | A szöveg "darabkája", amiben a modell számol (kb. háromnegyed szó). Ezért fizetsz, és ebből van a limit — a token-gazdálkodás ezért téma. |
| **Context / kontextus-ablak** | Amit a modell egyszerre "lát": az utasításaid + a beolvasott fájlok + az eddigi beszélgetés. Véges! Ha túl sok a szemét benne, romlik a minőség ("context pollution"). |
| **Instrukció-plafon** | Tapasztalati szabály: ~100–200 utasításnál többet a modell már nem tart be megbízhatóan — ezért rövid, priorizált szabálylisták kellenek. |
| **Prompt** | A modellnek adott utasítás/kérés. A workshopon megtanuljuk: nem a "prompt-trükk" a lényeg, hanem a **folyamat** (process over prompting). |
| <a id="agent-ready-repo"></a>**Agent-ready repo** | Olyan repó, amelyben az agent megtalálja a küldetést, scope-ot, szabályokat, szakmai standardot és valódi ellenőrző parancsokat; a változás jóváhagyott specből indul, független review-n és mechanikus kapukon megy át, az eredmény pedig bizonyítékokkal visszakövethető. Nem egy konkrét AI-eszköz konfigurációja, hanem ellenőrizhető fejlesztési működés — a workshop elsődleges terméke. |
| <a id="repository-constitution"></a>**Repository constitution / repóalkotmány** | Verziózott, ember által jóváhagyott szerződés a repó nem alku tárgyát képező működési szabályairól: küldetés, minőségi kapuk, döntési felelősök és kötelező ellenőrzések. .NET/Azure DevOps párhuzam: a solution-szintű engineering policy, branch policy és Definition of Done közös, repóban élő forrása. |
| <a id="scope-boundary"></a>**Scope boundary / hatókörhatár** | Pontosan rögzíti, mely viselkedés, fájl vagy rendszer tartozik egy munkadarabhoz, és mi marad név szerint kívül. Megakadályozza, hogy az agent találgatással vagy járulékos módosításokkal tágítsa a feladatot; .NET-ben hasonló szerepe van egy projekt- vagy bounded-context határnak, Azure DevOpsban pedig az elfogadott work item scope-jának. |
| <a id="validation-workload"></a>**Validation workload / validációs munkaterhelés** | Reprezentatív fejlesztési feladat, amellyel nemcsak az elkészült funkciót, hanem a teljes fejlesztési rendszert terheljük és validáljuk. A referenciaalkalmazás ilyen ellenőrző munkadarab: üzleti szabályt, adatot, integrációt, UI-t, deploymentet és review-t is igénybe vesz. Nem a workshop terméke, hanem az agent-ready keretrendszer bizonyításának eszköze. |
| <a id="operating-model"></a>**Operating model / működési modell** | A csapat ismételhető működési rendszere: szerepek, döntési kapuk, standardok, munkafolyamatok, automatizált ellenőrzések, evidence és felelősségek együtt. Ettől lesz az AI-assisted fejlesztés egyéni trükk helyett szervezeti képesség. |
| <a id="linear-work-state"></a>**Linear work state / Linear-munkaállapot** | A munka élő, folytatható állapota a Linear-issue leírásában és kommentjeiben él: a leírás a spec, a lease-komment rögzíti az aktív worktree-t és scope-ot, a trace-komment pedig a commitot, ellenőrzéseket, review-t és maradó kockázatot. Nem tartunk külön handoff-fájlt; a Git-commit a verziózott eredmény, a Linear a koordinációs állapot. .NET/Azure DevOps párhuzam: work item + branch/commit kapcsolata, külön átadási dokumentum nélkül. |
| <a id="invented-data"></a>**Lifelike but INVENTED / életszerű, de KITALÁLT adat** | Nyilvános tananyagban használt, hihető formájú, de kifejezetten kitalált példa. Nem ügyféladat, nem személyes adat és nem valódi üzleti szám; nem kérünk valós adathoz hasonlító mintát, mert az valós adatok bemásolására ösztönözhet. |
| <a id="model-replaceability"></a>**Modellcserélhetőség** | Az a képesség, hogy az elfogadási feltételek, szabályok, kapuk és evidence megtartása mellett másik modellt vagy agent harnesst próbálunk ki és mérünk meg. A váltást reprezentatív eval igazolja. |
| <a id="agent-harness"></a>**Agent harness** | A modellt körülvevő futtató- és eszközréteg, amely fájl-, shell-, böngésző-, subagent- és integrációs hozzáférést, valamint engedélyezési határokat ad. Claude Code és Codex eltérő harness, de ugyanazt a repóban verziózott módszert követheti. |
| **Spec-driven development** | A fejlesztés forrása a **specifikáció** (nem a ticket, nem a chat): spec → terv → feladatok → implementáció → ellenőrzés, minden fázis végén **emberi jóváhagyási kapuval** (validation gate). |
| **Given-When-Then (Gherkin)** | Üzletileg olvasható elfogadási kritérium formátum: "Adott… — Amikor… — Akkor…". .NET-világban a SpecFlow ugyanez. |
| **Acceptance criteria / elfogadási kritérium** | Mikor "kész" egy feature — az agent (és a teszt) számára ellenőrizhető formában. A BA-k kulcsterepe. |
| **Orchestrator / orkesztrátor** | "Karmester"-agent: a folyamatot vezérli (tervezés → fejlesztés → teszt → review), és **subagenteket** hív az egyes lépésekre. |
| <a id="subagent"></a>**Subagent** | Elkülönített kontextusban dolgozó specializált agent, amely körülhatárolt részfeladatot vagy független ellenőrzést végez, majd eredményt ad vissza a koordinátornak. |
| <a id="rug"></a>**RUG — Repeat-Until-Good** | Review-hurok: minden munkadarabot egy **külön** (friss kontextusú) bíráló-agent ellenőriz; az igazolt finding visszamegy javításra, majd ugyanazokat a kapukat újrafuttatjuk. Kilépés csak bizonyított PASS-nál van. Kulcs: a szerző ≠ a bíráló, és a review-javaslatot implementálás előtt ellenőrizni kell. |
| **AGENTS.md / CLAUDE.md** | A repóban élő "szabálykönyv a gépeknek": konvenciók, tiltások, minták — ezt minden agent-futás beolvassa. |
| <a id="skill"></a>**Skill** | Újra felhasználható, célhoz kötött agent-útmutató, amely megmondja, milyen eljárást és eszközöket kell követni egy feladattípusnál. |
| <a id="hook"></a>**Hook** | Egy meghatározott eseménynél automatikusan lefutó program vagy parancs, amely következetesen kikényszerít egy ellenőrzést vagy műveletet. A lefutás kiszámítható, de a hook helyességét pozitív és negatív próbával kell bizonyítani. |
| <a id="mcp"></a>**MCP** (Model Context Protocol) | Nyílt protokoll, amelyen keresztül egy AI-alkalmazás szabványos módon érhet el külső eszközöket és adatforrásokat. Nem általános API-szinonima. |
| **Golden path / referencia-slice** | Egy tökéletesen megcsinált minta-feature, amiről minden továbbit (ember és agent) másol. Az agentek a legközelebbi mintát utánozzák — adjunk nekik jót! |
| **Vertical slice** | A feature minden rétege (DB → API → UI → teszt → doksi) **egy mappában** — nem szétszórva rétegek szerint. Egy feladat = egy mappa = kis kontextus. |
| **Bounded context / boundary** | Modul-határ: mit importálhat egy modul a másikból (nálunk: csak a `*.contract.ts`-t). Erős határok = kis hibaterjedés + párhuzamosítható agent-munka. |
| **Composition root** | Az alkalmazás központi bekötési pontja: itt választjuk ki és drótozzuk össze a konkrét függőségeket. .NET-analógia: a `Program.cs` / `Startup.cs`, ahol a DI-container regisztrációi élnek. Next.js-ben is itt dől el, hogy egy port mögé valódi vagy tesztadapter kerül; a feature ne `new`-zza magának az infrastruktúrát. |
| **Seam / cserepont** | Tudatos illesztés, ahol egy külső függőség vagy viselkedés lecserélhető anélkül, hogy a domain-logikát átírnánk. .NET-ben ilyen az `IWorkshopRepo` konstruktor-injektálása. Az **e2e seam** ennek tesztelési változata: lokálisan in-memory adaptert köthetünk be, de preview/production környezetben kemény guard tiltja. |
| **Port** | A domain felől megfogalmazott interface/absztrakció egy valóban változó külső függőséghez. .NET-analógia: egy `IPaymentGateway` vagy `IWorkshopRepository`; nem minden osztályhoz kell interface. |
| **Adapter** | Egy port konkrét technikai megvalósítása. Például ugyanazt a repository-portot megvalósíthatja Drizzle/Postgres adapter vagy in-memory tesztadapter. .NET-analógia: `SqlWorkshopRepository : IWorkshopRepository`. |
| **Test double** | Tesztben használt helyettesítő implementáció (fake, stub, mock). Nem „második éles implementáció”, hanem kontrollált vizsgálati eszköz. .NET-ben például kézzel írt in-memory repository vagy Moq-val létrehozott mock. |
| **Double drift** | Amikor a test double viselkedése eltér a valódi adapterétől: másképp rendez, más formátumot ad vagy más hibát dob. Ettől zöld teszt igazolhat egy nem létező rendszert. A közös contract test csökkenti ezt a kockázatot. |
| **Contract test** | Ugyanazt a viselkedési tesztsuite-ot futtatjuk minden adapteren — például az in-memory és a valódi Postgres repositoryn. .NET-ben ez egy absztrakt/base tesztosztály vagy közös teszt-fixture lehet, amelyhez implementációt injektálunk. |
| **Browser bundle** | A böngészőnek elküldött kliensoldali JavaScript-csomag. .NET-analógia: a Blazor WebAssembly kliensbe kerülő assembly-készlet; szerveroldali titok, DB-driver és connection string nem kerülhet bele. |
| **Boundary lint** | Gépileg kikényszerített modulhatár. Olyan, mint egy architektúra-fitness teszt vagy NetArchTest-szabály: nemcsak dokumentáljuk, hogy egy modul mit importálhat, hanem a lint/CI el is buktatja a tiltott függést. A szabályt valódi fájlokkal és kerülőutakkal is regressziósan tesztelni kell. |
| **Blast radius** | Egy változtatás "robbanási sugara": hány helyet érint, mennyit kell újratesztelni. A jó architektúra ezt minimalizálja. |
| **Context engineering** | A kontextus tudatos menedzselése: tiszta sessionök, izolált subagentek, csak a releváns fájlok beolvasása — minőség + token-spórolás. |
| **RAG** (Retrieval-Augmented Generation) | Kereshető tudástár (vektor-adatbázis) a modell mögé — nálunk **dokumentációra** használjuk; kódra inkább LSP + struktúra. |
| **LSP** (Language Server Protocol) | A "code intelligence" szabványa (referenciák, definíciók, függőségek) — az agent grep-elgetés helyett pontos választ kap. |
| **ADR** (Architecture Decision Record) | 1 oldalas döntési jegyzet: mit döntöttünk, miért, mik voltak az alternatívák. A "miért van így?" kérdés válasza — embernek és agentnek. |
| **CI / pipeline** | Continuous Integration: minden push-ra automatikusan futó ellenőrzések (typecheck, lint, teszt). Az agent PR-je is ezen megy át — "junior kolléga, akinek a munkáját a pipeline is ellenőrzi". |
| **PR** (Pull Request) | Változtatási javaslat a repóban, review-val. Az agentikus munka alapegysége: agent dolgozik → PR → ember jóváhagy. |
| **Preview deploy** | Minden feature-branch/PR **saját, élő példányt** kap (nálunk Vercel) — kattintható linken nézed meg a változást, mielőtt merge-ölnéd. |
| **DB branch** | Az adatbázis "elágaztatása" (nálunk Neon): minden PR-hez izolált, eldobható adatbázis-másolat — a preview mögé. |
| **E2E teszt** (end-to-end) | A teljes alkalmazást böngészőből tesztelő teszt (nálunk Playwright) — a valódi preview-környezet ellen fut. |
| **Characterization test** | "Befotózó" teszt legacy kódra: azt rögzíti, amit a kód **most** csinál (jót-rosszat), hogy a refaktor után kiderüljön, változott-e a viselkedés. A legacy-munka belépője. |
| **Strangler fig** | Legacy-modernizálási minta: az új rendszer fokozatosan "fojtja ki" a régit — útvonalanként átirányítva, nem big-bang újraírással. |
| **Demand shortage** | A meglepő új helyzet: az AI-val a fejlesztés gyorsabb, mint ahogy az igények érkeznek — a szűk keresztmetszet a review, a tesztelés és a **jó specifikáció** lesz. (Ezért értékelődik fel a BA!) |

### Az AI-eszköztár új kanonikus fogalmai

| Fogalom | Kanonikus meghatározás |
|---|---|
| <a id="plugin"></a>**Plugin** | Telepíthető és terjeszthető képességcsomag, amely skilleket, hookokat, agenteket, eszközöket, integrációkat vagy MCP-kapcsolatot tartalmazhat. [Claude Code](https://code.claude.com/docs/en/plugins) · [Codex](https://learn.chatgpt.com/docs/glossary) |
| <a id="marketplace"></a>**Marketplace** | Pluginok felfedezésére és terjesztésére szolgáló forrás vagy katalógus; a benne szereplés önmagában nem biztonsági vagy minőségi minősítés. [Hivatalos Claude Code leírás](https://code.claude.com/docs/en/discover-plugins) |
| <a id="workflow"></a>**Workflow** | Szerepek, lépések, átadások, visszatérési pontok és kapuk rendezett végrehajtási útja egy ismételhető eredményhez. |
| <a id="goal-completion-condition"></a>**Goal / completion condition** | Megfigyelhető végállapot, amelyig az agent folytatja a munkát; a feltétel teljesülése nem helyettesíti a független review-t vagy az emberi jóváhagyást. [Claude Code Goal](https://code.claude.com/docs/en/goal) |
| <a id="goal-vs-rug"></a>**Goal és RUG kapcsolata** | A Goal a készítő agentet tartja a mérhető végállapot felé mozgásban; a RUG friss kontextusú review-val, finding-ellenőrzéssel és visszajavítással vizsgálja az eredményt. Kiegészítik, nem helyettesítik egymást. |
| <a id="browser-agent"></a>**Browser agent** | Böngészőt eszközként használó agent, amely oldalt nyit meg, interakciót végez, vizuális állapotot és hibát vizsgál, majd bizonyítékot ad vissza. Bejelentkezett Chrome-állapothoz külön engedélyezett bővítmény kell. [Hivatalos OpenAI leírás](https://learn.chatgpt.com/docs/chrome-extension) |
| <a id="guardrail"></a>**Guardrail / védősáv** | Az agent mozgásterét előre korlátozó technikai vagy folyamati védelem, például engedélyprofil, védett útvonal vagy kötelező emberi kapu. Nem azonos a kész állapotot bizonyító quality gate-tel. |
| <a id="ai-reinforced-human-learning-loop"></a>**AI-val megerősített emberi tanulási ciklus** | Workshop-saját pedagógiai mikro-ciklus: emberi előrejelzés vagy döntés → AI-magyarázat/végrehajtás → evidence-vizsgálat → korrekció → emberi összegzés. Nem modelltréning, nem RLHF, és nem nevezzük `RHEL`-nek. |

---

## 2. A stack elemei (mi, mire való, .NET-párhuzam)

| Elem | Mi ez, mire való | .NET-párhuzam | Link |
|---|---|---|---|
| **Node.js** | JavaScript/TypeScript futtatókörnyezet szerveroldalon | .NET runtime | [nodejs.org](https://nodejs.org) |
| **TypeScript (TS)** | Típusos JavaScript — a fordító fogja meg az agent hibáinak nagy részét | C# a JS világában | [typescriptlang.org](https://www.typescriptlang.org) |
| **Next.js (App Router)** | React-alapú full-stack keretrendszer: UI + API egy alkalmazásban, egy deploy-egységben | ASP.NET Core MVC + Razor egyben | [nextjs.org](https://nextjs.org) |
| **React** | Komponens-alapú UI-könyvtár | Blazor komponens-modellje | [react.dev](https://react.dev) |
| **Tailwind CSS** | Utility-class alapú CSS (`p-4 flex gap-2`) — az LLM-ek kiválóan generálják | — | [tailwindcss.com](https://tailwindcss.com) |
| **shadcn/ui** | Komponens-"könyvtár", ami a komponensek **forrását bemásolja a repódba** — az agent látja és szerkesztheti | Telerik, de forráskóddal a projektedben | [ui.shadcn.com](https://ui.shadcn.com) |
| **Drizzle ORM** | TS-first ORM: séma TS-kódban, abból SQL-migráció és típusos lekérdezés | Entity Framework, csak vékonyabb | [orm.drizzle.team](https://orm.drizzle.team) |
| **tRPC** | Típusbiztos kliens↔szerver hívások — a compiler maga a szerződés, nincs REST/OpenAPI-generálás | WCF contract-sharing / gRPC sémafájlok nélkül | [trpc.io](https://trpc.io) |
| **Zod** | Egy sémából futásidejű validálás + TS-típus | FluentValidation + DTO egyben | [zod.dev](https://zod.dev) |
| **TanStack Query** | Szerver-adat a kliensen: cache, frissítés, invalidálás | a kézzel írt HttpClient+cache logika, jól | [tanstack.com/query](https://tanstack.com/query/latest) |
| **React Hook Form** | Űrlap-state + validálás (ugyanazzal a Zod-sémával, mint az API) | binding + validation deklaratívan | [react-hook-form.com](https://react-hook-form.com) |
| **Vitest** | Gyors unit-teszt framework | xUnit / NUnit | [vitest.dev](https://vitest.dev) |
| **Playwright** | Böngészős E2E-teszt (Microsoft-termék, .NET-ből is megy!) | a Selenium modern utódja | [playwright.dev](https://playwright.dev) |
| **GitHub** | Repo + PR + CI (Actions) — itt dolgozik mindenki a saját repójában | Azure DevOps Repos+Pipelines megfelelője | [github.com](https://github.com) |
| **Linear** | A spec, lease és trace élő koordinációs rendszere; az agentek MCP-n át olvassák és frissítik | Azure Boards work item + kapcsolt branch/commit | [linear.app](https://linear.app) |
| **Vercel** | Hosting: minden PR-hez automatikus preview deploy | Azure App Service + deployment slots, csak automatikusan | [vercel.com](https://vercel.com) |
| **Neon** | Serverless Postgres **adatbázis-brancheléssel** — PR-enként izolált DB, ingyenes szinttel | SQL Server, ha tudna copy-on-write branchet | [neon.com](https://neon.com) |
| **v0** | AI UI-generátor (Vercel): szövegből/képből kész Next.js+shadcn komponens | — | [v0.app](https://v0.app) |
| **Gamma** | AI-prezentáció eszköz — a workshop diái ebben készültek | PowerPoint + AI | [gamma.app](https://gamma.app) |

---
*Ha egy fogalom hiányzik vagy nem világos: szólj a workshopon, vagy jelezd a szervező által megadott
kapcsolattartási csatornán — bővítjük.*
