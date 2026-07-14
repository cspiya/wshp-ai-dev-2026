# Pluginek, skillek és automatizálás — oktatói háttér

*Wenova AI-Assisted Development Workshop — 2026.07 · forrás-/oktatói réteg*

Ez a dokumentum a résztvevői [AI fejlesztési eszköztár](eszkozok/) mögötti döntési modellt rögzíti.
A módszer provider-semleges: Claude Code és Codex cserélhető agent harness, a repóban élő specifikáció,
szabály, szakmai standard, quality gate és evidence-szerződés viszont változatlan marad.

## A képességek felelősségi határa

| Mechanizmus | Mire való? | Mikor ne ezt válaszd? |
|---|---|---|
| Repo szabály | Tartós, minden releváns munkára érvényes korlát és elvárás | Hosszú, feltételes végrehajtási recepthez |
| Skill | Újrahasznosítható munkafolyamat, opcionális script- és referenciafájlokkal | Kötelező, determinista tiltáshoz |
| Hook | Életciklus-eseménynél automatikusan futó ellenőrzés vagy művelet | Összetett szakmai ítélethez |
| Guardrail | Jogosultsági, technikai vagy folyamati védősáv | A kész állapot bizonyításához |
| Quality gate | A továbblépés mérhető feltétele | Egyszeri tanácshoz |
| MCP | Külső rendszer eszközeinek és erőforrásainak eléréséhez | Helyi eljárás vagy repószabály tárolásához |
| Subagent | Elkülönített kontextusú részfeladathoz vagy fresh-context review-hoz | A fő beszélgetés gyors mellékkérdéséhez |
| Plugin | Több képesség telepíthető és verziózható terjesztéséhez | Egyetlen projektre érvényes rövid szabályhoz |

## Plugin és marketplace

A **plugin** telepíthető csomag. A terméktől függően skilleket, hookokat, agenteket, parancsokat,
MCP-szervereket vagy alkalmazás-integrációkat tartalmazhat. A **marketplace** felfedezési és
terjesztési forrás; nem biztonsági vagy minőségi minősítés.

Telepítés előtt az agent vizsgálja meg:

1. a forrás és a karbantartó azonosságát;
2. a verziót vagy rögzített commitot;
3. a csomagolt futtatható kódot, hookot és MCP-szervert;
4. a kért jogosultságokat és hálózati elérést;
5. a frissítés és eltávolítás visszaállítható útját;
6. nincs-e már aktív, azonos képességű beépített vagy másik pluginos eszköz.

Résztvevő nem gépel plugin-parancsot. Természetes nyelven kéri az agentet, hogy a telepített verzió
hivatalos dokumentációja alapján vizsgálja meg és készítse elő a választott plugint; telepítés és
jogosultságbővítés előtt az agent emberi jóváhagyást kér.

## Workflow, Goal és RUG

A workflow a szerepek, lépések, átadások és kapuk rendezett útja. A **completion condition** azt a
megfigyelhető végállapotot nevezi meg, ameddig az agent dolgozik. A Claude Code `/goal` és a Codex
Goal mode termékspecifikus adapterek ehhez a módszertani fogalomhoz.

A Goal nem review. Nem hoz létre független kontextust, nem igazolja automatikusan a specet, és nem
helyettesíti az emberi merge-kaput. A workshop kötelező alapja a skillben vagy manuális
folyamatszerződésben hordozható RUG-ciklus:

`builder → fresh-context review → finding-verification → fix → re-check → human gate`

Termékspecifikus dinamikus workflow csak opcionális adapter. A kötelező út egyetlen Claude Code vagy
Codex sessionnel és szükség esetén külön fresh-context reviewerrel teljesíthető.

## Orchestration és tartós autonómia

Az **orchestrator** nem minden részletet végző főagent. A koordinációs kontextusban a cél, a
függőség, az állapot, a lease, a kapu és a subagentek tömör evidence-e marad; a nyers keresési,
build- és hibakeresési részletek elkülönített worker-kontextusban élnek. A subagent csak a
feladatához szükséges specet, scope-ot, kanonikus szabályt, artifactot, ellenőrzést és visszaadási
szerződést kapja.

A nagy kontextusablak nem garancia minden instrukció megbízható követésére. Nincs igazolt,
modellfüggetlen „150–200 utasításos” kemény plafon: a kutatások a relevancia, a pozíció, a
komplexitás és a több constraint miatti fokozatos minőségromlást támasztják alá. Ezért a kritikus
szabályt nem ismételt promptszöveggel, hanem prioritásos repószabállyal, hookkal, guardraillel,
quality gate-tel és reprezentatív eval-lal védjük.

A Goal, `/loop`, schedule vagy routine a következő futást indítja; nem felügyeli önmagát. Megbízható,
hosszú futáshoz külső supervision kell: heartbeat, watchdog, liveness/readiness/progress health,
checkpoint, lease, idempotens retry, bounded self-healing, megfigyelhetőség és kill switch.
Az architektúra, naplózási szerződés és a biztonságos Linear-autopilot workshop-kísérlet részletesen:
[Orchestration és megbízható autonóm működés](orchestration-es-autonomia.md).

## Böngészőagent és biztonság

Lokális fejlesztői oldalhoz és nyilvános webhelyhez a beépített, elkülönített böngésző az alapút.
A Chrome-bővítmény akkor indokolt, amikor bejelentkezett böngészőállapot kell. Ilyenkor az oldaltartalom
nem megbízható bemenet, az új domainek és érzékeny műveletek emberi kaput kapnak, a feladat után pedig
felülvizsgáljuk a tartós engedélyeket.

## Kapacitás és Plan B

- A Claude és Claude Code ugyanazt a csomaghasználati keretet fogyasztja.
- A Pro keret nem garantált egy teljes workshopnapra.
- A Max 20x egyéni csomag; közös consumer belépési adat nem elfogadható tartalékút.
- Azonnali provider-semleges Plan B a Codex, ugyanazzal a spec–szabály–gate–evidence szerződéssel.
- Ha egyik élő hordozó sem elérhető, trainer által előre validált replay-evidence használható, egyértelmű
  REPLAY jelöléssel; ebből nem állítunk élő PASS-t.

## AI-val megerősített emberi tanulási ciklus

`emberi előrejelzés vagy döntés → AI-magyarázat/végrehajtás → evidence-vizsgálat → korrekció → emberi összegzés`

Ez workshop-saját pedagógiai fogalom. Nem modelltréning, nem RLHF, és nem kap rövid `RHEL` betűszót.

## Hivatalos források

- [Claude Code extension overview](https://code.claude.com/docs/en/features-overview)
- [Claude Code plugins](https://code.claude.com/docs/en/plugins) és
  [plugin discovery](https://code.claude.com/docs/en/discover-plugins)
- [Claude Code Goal](https://code.claude.com/docs/en/goal)
- [Claude Code scheduled tasks és `/loop`](https://code.claude.com/docs/en/scheduled-tasks)
- [Anthropic — effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic — building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OpenAI — Codex subagent workflows](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [OpenAI — Scheduled tasks](https://learn.chatgpt.com/docs/automations)
- [Claude Code Pro/Max használat](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude használati korlátok](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)
- [Codex hivatalos fogalomtár](https://learn.chatgpt.com/docs/glossary)
- [ChatGPT/Codex Chrome-bővítmény](https://learn.chatgpt.com/docs/chrome-extension)

Kapcsolódó: [fogalomtár](fogalomtar.md) · [kanonikus material standard](../toolkit/standards/material-standards.md)
