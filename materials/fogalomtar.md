# Fogalomtár — AI Dev Workshop (2026.07.14)

> A workshop tananyaga magyarul íródik, de a szakma angol kifejezéseit használjuk (ezek a mindennapi
> munkában is így jönnek szembe). Ami nem magától értetődő, azt itt találod. Két rész: **agentikus
> alapfogalmak** és a **stack elemei** (.NET-es párhuzamokkal, mert onnan jöttök).

---

## 1. Agentikus fejlesztés — alapfogalmak

| Fogalom | Mit jelent |
|---|---|
| **LLM** (Large Language Model) | Nagy nyelvi modell — a Claude, GPT stb. mögötti technológia. Szöveget kap (kontextus) és szöveget ad vissza. |
| **Agent / ágens** | LLM, ami nem csak válaszol, hanem **eszközöket használ** (fájlt olvas/ír, parancsot futtat, API-t hív) és többlépéses feladatot visz végig önállóan. |
| **Claude Code** | Az Anthropic terminálban futó coding agentje — ezzel dolgozunk egész nap. |
| **Token** | A szöveg "darabkája", amiben a modell számol (kb. háromnegyed szó). Ezért fizetsz, és ebből van a limit — a token-gazdálkodás ezért téma. |
| **Context / kontextus-ablak** | Amit a modell egyszerre "lát": az utasításaid + a beolvasott fájlok + az eddigi beszélgetés. Véges! Ha túl sok a szemét benne, romlik a minőség ("context pollution"). |
| **Instrukció-plafon** | Tapasztalati szabály: ~100–200 utasításnál többet a modell már nem tart be megbízhatóan — ezért rövid, priorizált szabálylisták kellenek. |
| **Prompt** | A modellnek adott utasítás/kérés. A workshopon megtanuljuk: nem a "prompt-trükk" a lényeg, hanem a **folyamat** (process over prompting). |
| **Spec-driven development** | A fejlesztés forrása a **specifikáció** (nem a ticket, nem a chat): spec → terv → feladatok → implementáció → ellenőrzés, minden fázis végén **emberi jóváhagyási kapuval** (validation gate). |
| **Given-When-Then (Gherkin)** | Üzletileg olvasható elfogadási kritérium formátum: "Adott… — Amikor… — Akkor…". .NET-világban a SpecFlow ugyanez. |
| **Acceptance criteria / elfogadási kritérium** | Mikor "kész" egy feature — az agent (és a teszt) számára ellenőrizhető formában. A BA-k kulcsterepe. |
| **Orchestrator / orkesztrátor** | "Karmester"-agent: a folyamatot vezérli (tervezés → fejlesztés → teszt → review), és **subagenteket** hív az egyes lépésekre. |
| **Subagent** | Az orkesztrátor által indított rész-agent, **saját, tiszta kontextussal**. Amit ő beolvas, az nála marad — nem szennyezi a fő döntési kontextust. |
| **RUG — Repeat-Until-Good** | Review-hurok: minden munkadarabot egy **külön** (friss kontextusú) bíráló-agent ellenőriz, és addig megy vissza javításra, amíg minden bíráló rá nem bólint. Kulcs: a szerző ≠ a bíráló. |
| **AGENTS.md / CLAUDE.md** | A repóban élő "szabálykönyv a gépeknek": konvenciók, tiltások, minták — ezt minden agent-futás beolvassa. |
| **Skill** | Újrafelhasználható, becsomagolt tudás/munkafolyamat az agentnek (pl. "hogyan írj release note-ot nálunk") — a leírása alapján aktiválódik. |
| **Hook** | A folyamat adott pontján **determinisztikusan** lefutó szkript (pl. "minden módosítás után futtasd a teszteket"). A prompt csak kérés — a hook garancia. |
| **MCP** (Model Context Protocol) | Szabvány, amivel az agent külső rendszerekhez kapcsolódik (GitHub, Linear, Neon, Vercel…). Olyan, mint egy "driver" az agent és a szolgáltatás között. |
| **Golden path / referencia-slice** | Egy tökéletesen megcsinált minta-feature, amiről minden továbbit (ember és agent) másol. Az agentek a legközelebbi mintát utánozzák — adjunk nekik jót! |
| **Vertical slice** | A feature minden rétege (DB → API → UI → teszt → doksi) **egy mappában** — nem szétszórva rétegek szerint. Egy feladat = egy mappa = kis kontextus. |
| **Bounded context / boundary** | Modul-határ: mit importálhat egy modul a másikból (nálunk: csak a `*.contract.ts`-t). Erős határok = kis hibaterjedés + párhuzamosítható agent-munka. |
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
| **Linear** | Feladatkezelő, amiből az agentek dolgoznak (MCP-n át) | Azure Boards, modern kiadásban | [linear.app](https://linear.app) |
| **Vercel** | Hosting: minden PR-hez automatikus preview deploy | Azure App Service + deployment slots, csak automatikusan | [vercel.com](https://vercel.com) |
| **Neon** | Serverless Postgres **adatbázis-brancheléssel** — PR-enként izolált DB, ingyenes szinttel | SQL Server, ha tudna copy-on-write branchet | [neon.com](https://neon.com) |
| **v0** | AI UI-generátor (Vercel): szövegből/képből kész Next.js+shadcn komponens | — | [v0.app](https://v0.app) |
| **Gamma** | AI-prezentáció eszköz — a workshop diái ebben készültek | PowerPoint + AI | [gamma.app](https://gamma.app) |

---
*Ha egy fogalom hiányzik vagy nem világos: szólj a workshopon, vagy írd meg a Discord-csatornán — bővítjük.*
