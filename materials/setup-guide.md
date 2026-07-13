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

A fiókokat **ebben a sorrendben** hozd létre, mert egymásra épülnek: GitHub (saját e-mail,
megerősítve) → Vercel a **„Continue with GitHub”** gombbal → Neon GitHub-belépéssel → Linear →
v0 a Vercel-fiókkal. Így a GitHub–Vercel és a Vercel–v0 kapcsolat már regisztrációkor létrejön.

## 2. Claude-előfizetés + telepítések

- **Claude Code-hozzáférés** (claude.ai): egész nap ezzel dolgozunk. Ellenőrizd az aktuális csomagokat
  és használati korlátokat a szolgáltató oldalán.
- **Windows — ajánlott út:** futtasd a repóban lévő
  [`toolkit/setup/scoop-telepito.cmd`](../toolkit/setup/scoop-telepito.cmd) telepítőt
  **dupla kattintással, NEM rendszergazdaként**. A Scoop csomagkezelővel felteszi:
  `git`, `7zip`, `gh` (GitHub CLI), `nodejs-lts`, `claude-code`, és beállítja a PATH-t.
  A végén nyiss **új** terminált.
- Kézi telepítés (macOS / Linux, vagy ha nem Scoopolnál):
  - **Git** — git-scm.com
  - **Node.js LTS** — nodejs.org
  - **GitHub CLI** — cli.github.com
  - **Claude Code CLI** — a claude.ai/code útmutatója szerint
  - *(ajánlott)* **VS Code** vagy a kedvenc editorod
- **Claude böngésző-bővítmény** (Chrome vagy Edge — a Chrome Web Store Edge alatt is megy):
  telepítsd, és jelentkezz be a claude.ai-fiókoddal. A workshopon a szolgáltatások összekötését
  (Neon–Vercel integráció, repo-import a Vercelbe, Linear bekötése) Claude ezen keresztül
  kattintja végig veled — neked csak jóváhagynod kell.
- **MCP-kapcsolatok**: a repo gyökerében és a participant-starterben commitolt `.mcp.json`
  előre tartalmazza a négy szervert (Linear, GitHub, Neon, Vercel). A repó mappájában indított
  `claude`-ban írd be: `/mcp`, és hitelesítsd sorban mind a négyet — mindegyik böngészős
  OAuth-tal megy, kulcsot vagy tokent sehová nem kell másolni.

## 3. Teljes preflight ellenőrzés

Nyiss egy terminált, és futtasd:

```powershell
node --version
git --version
gh --version
claude --version
claude
```

Jelentkezz be, amikor kéri. Ezután pipáld végig:

- [ ] A `node --version`, `git --version`, `gh --version` és `claude --version` parancs hiba nélkül lefut.
- [ ] A repó mappájában a `claude`-on belüli `/mcp` mind a négy szervert (Linear, GitHub, Neon, Vercel) mutatja, és be tudsz jelentkezni.
- [ ] A Claude böngésző-bővítmény telepítve van, és be van jelentkezve.
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
