# Felkészülési útmutató — a workshop előtt

Az egyes szolgáltatások csomagjai és feltételei változhatnak. Regisztráció előtt ellenőrizd az aktuális
feltételeket a szolgáltató oldalán. A workshophoz aktív Claude Code-hozzáférés szükséges.

## 1. Fiókok, amiket előre hozz létre

| Fiók | Mire használjuk | Tipp |
|---|---|---|
| **GitHub** — github.com | Itt lesz a saját repód — ebben dolgozol egész nap | Meglévő fiók tökéletes. **Public** repót hozunk létre (abból lehet publikálni/deployolni) |
| **Vercel** — vercel.com | Hosting — minden változtatásod élő preview-linket kaphat | Regisztrálj a **"Continue with GitHub"** gombbal, így össze is kapcsolódhatnak |
| **Neon** — neon.com | Serverless Postgres adatbázis a projekted mögé | Itt is használhatod a GitHub-belépést |
| **Linear** — linear.app | Feladatkezelő — innen dolgoznak majd az AI-agentek (MCP-n át) | Hozz létre fiókot és egy gyakorló workspace-t |
| **v0** — v0.app | AI-alapú UI/dizájn-generálás a weboldaladhoz | A Vercel-fiókoddal lépj be |

## 2. Claude-előfizetés + telepítések

- **Claude Code-hozzáférés** (claude.ai): egész nap ezzel dolgozunk. Ellenőrizd az aktuális csomagokat
  és használati korlátokat a szolgáltató oldalán.
- Telepítsd a gépedre (Windows / macOS / Linux egyaránt jó):
  - **Git** — git-scm.com
  - **Node.js LTS** — nodejs.org
  - **Claude Code CLI** — a claude.ai/code útmutatója szerint
  - *(ajánlott)* **VS Code** vagy a kedvenc editorod

## 3. Teljes preflight ellenőrzés

Nyiss egy terminált, és futtasd:

```powershell
node --version
git --version
claude --version
claude
```

Jelentkezz be, amikor kéri. Ezután pipáld végig:

- [ ] A `node --version`, `git --version` és `claude --version` parancs hiba nélkül lefut.
- [ ] A `claude` elindul, és egy egyszerű kérdésre válaszol.
- [ ] Be tudsz lépni a GitHubba, és létre tudsz hozni egy tesztrepót.
- [ ] Be tudsz lépni a Vercelbe a GitHub-fiókoddal.
- [ ] Be tudsz lépni a Neonba.
- [ ] Létezik Linear-fiókod és egy gyakorló workspace-ed.
- [ ] Be tudsz lépni a v0-ba.
- [ ] Van egy egyszerű weboldalötleted és hozzá legalább egy ellenőrizhető üzleti szabályod.

Az MCP-konnektorokat (GitHub, Vercel, Neon, Linear) a workshopon közösen állítjuk be. Soha ne commitolj
API-kulcsot, tokent, `.env` vagy helyi MCP-konfigurációt publikus repóba.

## 4. Időkeretes Plan B Vercel/Neon elakadásra

Az OAuth- és integrációs hibák nem vihetik el a gyakorlati napot. Ha a saját preview vagy adatbázis
bekötése a tréner által kijelölt rövid időkeretben nem áll össze:

1. folytasd a fejlesztést lokálisan, az előkészített in-memory tesztúton;
2. a preview deployt és a PR-hez tartozó adatbázis-branchet a tréner közös demó-környezetben mutatja meg;
3. a saját integrációdat a workshop után, a működő kód birtokában fejezd be.

Ez lehetővé teszi a lokális működési rétegek validálását, de a keretrendszer külső integrációs
bizonyítéka addig **nem teljes**. A tréner demója mutatja meg a preview + izolált DB ágat, a saját
evidence-csomagban pedig őszintén jelöld a hiányzó ellenőrzést.
Az éles/preview környezetben in-memory kapcsolót nem használunk; azt kemény guard védi.

## 5. Publikus repó hygiene — feltöltés előtt

- Ne legyen a repóban ügyfélnév, személyes adat, meghívólink, valós ajánlati vagy árazási adat.
- Mintaadathoz „életszerű, de kitalált” adatot kérj az agenttől.
- Ellenőrizd a staged diffet push előtt; különösen a `.env`, `.mcp.json`, exportok és fixture-ök tartalmát.
- Ha nem vagy biztos egy adat eredetében, cseréld generikus mintára vagy ne publikáld.

## 6. Mit hozz magaddal

- **Laptop + töltő**
- **Egy egyszerű alkalmazásötletet és legalább egy valódi üzleti szabályt!** Nem maga az app a workshop
  elsődleges terméke: ez lesz az általad felépített agent-ready fejlesztési rendszer real-life
  validációs workloadja. Legyen elég kicsi egy naphoz, de tartalmazzon megfigyelhető happy pathot és
  legalább egy hiba- vagy állapotágat.
- Üzleti elemzőknek: gondolj végig előre 1–2 **üzleti szabályt / elfogadási kritériumot** az ötletedhez —
  ezekkel dolgozunk a specifikációs blokkban.

Ha bármelyik lépésnél elakadsz, jelezd a workshop szervezőjének a megadott kapcsolattartási csatornán —
még a nap előtt segítünk, hogy az első perctől építéssel teljen az idő, ne fiók-helyreállítással.
