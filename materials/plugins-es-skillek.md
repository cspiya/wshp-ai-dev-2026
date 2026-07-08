# Pluginek és skillek — mit használunk, miért, és hol vannak a rendszer korlátai

*Wenova AI-Assisted Development Workshop — 2026.07 · tananyag a G4 modulhoz (szabályok, skillek, hookok)*

> Ez a doksi kettőt tud: (1) leírja, milyen pluginekkel dolgozunk mi magunk a workshop-anyag építésénél
> és miért — (2) őszintén végigveszi a **plugin/skill-rendszer korlátait**, mert ezek ismerete nélkül
> nem lehet jól használni. Szakszavak: [fogalomtár](fogalomtar.md).

---

## 1. Alapfogalmak gyorsan

- **Skill** = becsomagolt tudás/munkafolyamat az agentnek (egy `SKILL.md` + kiegészítő fájlok). A leírása
  (description) alapján **magától aktiválódik**, amikor a feladat illik rá.
- **Plugin** = a **terjesztési egység**: egy plugin skilleket, parancsokat, agent-definíciókat, hookokat és
  akár **MCP-szervert** is csomagolhat. Telepíteni pluginot lehet, nem skillt!
- **Marketplace** = egy git repo egy `.claude-plugin/marketplace.json`-nal — nincs központi "app store",
  bárki hostolhat marketplace-t. Telepítés: `/plugin marketplace add <owner/repo>` →
  `/plugin install <plugin>@<marketplace>`.
- Hivatalos források: [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
  (Anthropic-kurált plugin-katalógus) és [anthropics/skills](https://github.com/anthropics/skills)
  (hivatalos skill-gyűjtemény). Közösségi gyűjtők: [SkillsMP](https://skillsmp.com/), skills.sh.

---

## 2. Amit mi használunk (telepítve a `claude-plugins-official`-ból) — és miért

### 🧠 Döntés-doboz: melyik plugineket vezetjük be a saját munkánkba?

**Az alapprobléma:** a workshop-anyagot magunk is agentekkel építjük, és pont azokat az elveket akarjuk
használni, amiket tanítunk (spec-kapu, RUG-review, skillek, verifikáció). Kérdés: mit írjunk meg magunk,
és mit vegyünk át kész, profi forrásból?

**A választásunk:** hivatalos marketplace-ből telepítünk, és csak azt írjuk meg magunk, ami nincs készen.

| Plugin | Mit ad | Miért kell nekünk |
|---|---|---|
| **skill-creator** | A hivatalos "skill, ami skillt gyárt": létrehozás, szerkesztés, **eval/benchmark**, description-optimalizálás | A G4 modul csúcspontja + a saját repo-skilljeinket is ezzel készítjük. A "self-improving skill" retro-téma hivatalos megvalósítása |
| **superpowers** (v6.0.3) | ~15 módszertani skill: brainstorming → tervírás → TDD → szisztematikus debug → **verification-before-completion** → subagent-driven development → code-review kérés/fogadás | Gyakorlatilag **a mi tananyagunk skillekbe öntve** — élő bizonyíték, hogy a "process over prompting" skillesíthető. Bónusz: Codex/Cursor plugin-manifestje is van → tool-agnosztikus példa |
| **github** | GitHub **MCP-szerver** (PR-ek, issue-k, repo-műveletek tool-ként) | Az agent-loop (issue → branch → PR) natív bekötése |
| **linear** | Linear **MCP-szerver** | A feladatkezelő bekötése — nálunk a Linear a spec-forrás |
| **code-review** | Egy `/code-review` **parancs** PR-review-ra | ⚠️ lásd lent — átfedésben van a beépítettel |

**Alternatívák, amiket elvetettünk:** mindent kézzel megírni (lassú, és pont a "ne találd fel újra" elvet
sértené); közösségi marketplace-ből válogatni elsőre (minőség-szórás + supply-chain kockázat — lásd
korlátok, 4. pont); a retro-ban emlegetett net-ről gyűjtött skillcsomagok (működnek, de kurálatlanok).

### ⚠️ Verifikációs megjegyzések (a saját telepítésünk tanulságai)

1. **Név-ütközés élőben:** a `code-review` plugin telepítése után a sessionben **két** code-review skill
   látszik (a beépített + a pluginos). A namespace (`plugin:skill`) technikailag megoldja, de embernek
   zavaró. *Javaslat: a pluginos verzió eltávolítható (`/plugin uninstall code-review`), a beépített
   többet tud (effort-szintek, findings-riport).*
2. **MCP-duplikáció:** a `linear` plugin MCP-szervere **ugyanazt** adja, amit a claude.ai Linear-konnektor —
   ha mindkettő aktív, duplán jelennek meg a toolok (kontextus-pazarlás). Lokális gépen a plugin a jó út,
   claude.ai-kapcsolt sessionben a konnektor. Egyszerre csak az egyik legyen aktív.
3. **Verziókezelés:** a cache-ben több plugin "unknown" verzióval ül — a plugin-világban a verziófegyelem
   még gyerekcipőben jár (lásd korlátok, 5. pont).
4. A telepítés után **`/reload-plugins`** (vagy új session) kell — a skillek csak utána élnek.

### Amit még javaslunk (opcionális)

- **document-skills** (`anthropics/skills` marketplace-ből): docx/pptx/xlsx/pdf generálás — handoutokhoz,
  ügyfél-doksikhoz hasznos. `/plugin install document-skills@anthropic-agent-skills`
- **vercel** plugin (official): a stackünk deploy-oldala MCP-vel.
- A workshop-repo saját `.claude/skills/` készlete (készül): `notebook-author` (a decision-box szabály
  kikényszerítése), reviewer agent-definíció — ezek mutatják a *projekt-szintű* skill-t a *globális*
  pluginnal szemben.

**Résztvevőknek a workshopon:** NEM kell előre plugint telepíteni — a napi munkához a repo saját készlete
elég; a plugineket a G4-ben közösen nézzük meg.

---

## 3. A plugin/skill-rendszer korlátai (ezt tanítjuk, mert e nélkül csalódás lesz)

### 🧠 Döntés-doboz: miért kell külön beszélni a korlátokról?

**Az alapprobléma:** a skill-rendszer elsőre "varázslatnak" tűnik — feltelepítesz 50 skillt, és azt várod,
hogy az agent mindig, mindet betartja. Nem így működik, és aki ezt nem tudja, az rossz architektúrát épít rá.

**A lényeg egy mondatban:** *a skill nem kód, hanem instrukció — a betöltése kontextust fogyaszt, az
aktiválása valószínűségi, a betartása nem garantált.* Ebből minden korlát levezethető:

**1. Skálázás: mi van több száz / ezer skillnél?**
Minden telepített skill **neve + leírása bekerül minden session kontextusába** — ez a "menü", amiből a
modell választ. Néhány tucat skillig ez olcsó és jól működik. Több száznál: (a) a kontextus-büdzsé
jelentős részét a skill-menü eszi meg, (b) a hasonló leírások összemosódnak → romlik a találati pontosság,
(c) beleütközöl az **instrukció-plafonba** (~100–200 megbízhatóan betartott utasítás — lásd fogalomtár):
a skillek is instrukciók! **Ökölszabály: kurált, kicsi, projekt-releváns készlet** — globálisan kevés,
projekt-szinten (repo `.claude/skills/`) célzott skillek; időnként gyomlálni.

**2. Trigger-felismerés: észreveszi-e, hogy skillt kell használnia?**
Az aktiválás **valószínűségi**: a modell a feladatot a skill-leírásokhoz illeszti. Két hibamód: *missed
trigger* (van rá skill, de nem hívja meg — tipikusan gyenge/általános description miatt) és *false
trigger* (rossz skillt húz be). A **description a legfontosabb sor a skillben** — pont ezért van a
skill-creatorban eval + description-optimalizálás: mérhető, hogy egy skill mikor triggerel. Explicit
hívással (`/skill-név`) mindig megkerülhető a bizonytalanság.

**3. Betartás: mennyire követi a skill tartalmát?**
A skill törzse is csak instrukció: hosszú skillnél, hosszú sessionnél, szennyezett kontextusnál a modell
**részeket elenged** (ugyanaz a jelenség, mint a magyar-ékezetek példa a szabályoknál). Ellenszerek:
(a) rövid SKILL.md + **progressive disclosure** (a részletek külön fájlokban, amiket csak szükség esetén
olvas be), (b) ami determinisztikusan KELL, az nem skill, hanem **hook** — "a prompt kérés, a hook
garancia", (c) friss session / tiszta kontextus.

**4. Minőség és biztonság: nincs központi store.**
A marketplace bármilyen git repo lehet → a minőség szórása óriási, és egy plugin **futtatható kódot**
(hookokat, MCP-szervert, szkripteket) is hozhat — a telepítés **supply-chain kockázat**. Szabály: hivatalos
vagy átnézett forrásból telepíts, nézd meg, mit csomagol (`~/.claude/plugins/cache/...`), céges környezetben
allowlist.

**5. Verzió- és függőségkezelés: kezdetleges.**
Frissítés kézzel (`/plugin update`), nincs függőség-feloldás, láttunk "unknown" verziójú plugint a saját
cache-ünkben is. Fontos projektben: pin-elj (fork/vendor), és kezeld a plugineket úgy, mint bármely
külső dependency-t.

**6. Duplikáció és név-ütközés.**
Ugyanaz a képesség több forrásból (beépített skill + plugin + MCP-konnektor) párhuzamosan is jelen lehet —
tool-lista-duzzadás, ember-zavaró kettősségek (nálunk: két code-review, két Linear-MCP-lehetőség).
Tartsd egy kézben: egy képesség = egy aktív forrás.

**7. A skill nem tudásbázis.**
A skill munkafolyamatot/viselkedést ad, nem nagy tudástár betöltését — nagy dokumentáció a RAG/keresés
világába való, nem egy 5000 soros SKILL.md-be.

### Összefoglaló szabály (vidd haza)
> **Kevés, jól leírt, kurált skill + determinisztikus hookok + tiszta kontextus.**
> A skill-rendszer nagyszerű *tudás-terjesztő*, de nem *végrehajtás-garancia* — arra ott a hook és a CI.

---
*Kapcsolódó: [fogalomtár](fogalomtar.md) · a repo saját skilljei: `.claude/skills/` (készül) ·
hivatalos források: [claude-plugins-official](https://github.com/anthropics/claude-plugins-official),
[anthropics/skills](https://github.com/anthropics/skills), [SkillsMP](https://skillsmp.com/)*
