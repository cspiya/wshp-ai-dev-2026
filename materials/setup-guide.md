# Felkészülési útmutató — C0 a workshop előtt

A cél nem az, hogy minden külső szolgáltatás mindenkinél hibátlan legyen. A cél az, hogy 09:00-kor minden résztvevőnek futtatott preflightja és őszinte `C0_STATUS` eredménye legyen: `PASS`, `REPLAY`, `PENDING` vagy `BLOCKED`.

> **Kanonikus könyvtárszerkezet:** a forrásrepo, a résztvevő írható repója és az evidence egymás melletti könyvtár. Az evidence nem kerül a participant repóba.

```text
workshop-source/          # ez a tananyag- és starter-forrás
participant-repo/        # egész nap ezt módosítod
workshop-evidence/       # C0–C7 bizonyítékok
```

## 1. Mi kell feltétlenül 09:00 előtt?

| Szint | Szükséges | Ha hiányzik |
|---|---|---|
| Core | Git, GitHub CLI, Node.js 22.13+, npm | `BLOCKED`: telepítés vagy frissítés szükséges. |
| AI | Claude Code **vagy** Codex; a dual-agent gyakorlathoz mindkettő | Egy eszközzel indulhatsz; mindkettő hiánya `BLOCKED`. |
| Böngésző | Codex `@Browser`, támogatott Chrome/Edge integráció vagy kézi út | A kézi út `MANUAL`; nem állítja, hogy automation replay történt. |
| Legacy local lane | .NET SDK 10 | Csak ellenőrzött, manifestes replay-csomaggal lehet `REPLAY`; enélkül a kért legacy út `BLOCKED`. |
| Külső live lane | GitHub-fiók; később Vercel és Neon | A lokális munka folytatható; a live bizonyítás addig `PENDING`. |

Linear- és v0-fiók hasznos a kiegészítő gyakorlatokhoz, de nem blokkolhatja a nap core útját. Accountot, OAuth-jóváhagyást és érzékeny műveletet mindig ember végez.

## 2. Windows: egy telepítő, majd új terminál

1. Töltsd le a [`scoop-telepito.cmd`](../toolkit/setup/scoop-telepito.cmd) fájlt.
2. Futtasd dupla kattintással, **nem rendszergazdaként**.
3. A script telepíti vagy frissíthetővé teszi a `git`, `gh`, `node`, `npm`, `claude` és `codex` parancsot.
4. Ha `BLOKKOLT` eredményt kapsz, ne menj tovább: javítsd a felsorolt parancsot, majd futtasd újra.
5. Zárd be a terminált, és nyiss újat, hogy a PATH frissüljön.

Az automatizált `.cmd` + PowerShell út Windowsra van próbálva. macOS/Linux alatt használd a szolgáltatók hivatalos telepítőit, majd kézzel futtasd a táblázatban kért verzió- és projektparancsokat; ezt az útmutató nem állítja automatizáltan támogatott útnak.

## 3. Forrásrepo és determinisztikus doctor

```powershell
git clone https://github.com/cspiya/wshp-ai-dev-2026.git workshop-source
cd workshop-source
powershell -NoProfile -ExecutionPolicy Bypass -File toolkit/setup/workshop-doctor.ps1 `
  -Agent Both `
  -WorkspacePath participant-starter
```

Ha csak az egyik agentet használod, a `Both` helyett válassz `Claude` vagy `Codex` értéket. Az `Auto` elfogadja bármelyik telepített agentet.

A doctor nem olvas tokent, jelszót vagy `.env`-értéket. Minden check után megadja a megfigyelt állapotot és a javítást. A végén pontosan egy státusz szerepel:

- `DOCTOR_STATUS=PASS` — a kért lokális út indulhat;
- `DOCTOR_STATUS=REPLAY` — kizárólag a `-ReplayPath` alatt validált manifest és fájlok alapján használható a kért opcionális lane;
- `DOCTOR_STATUS=BLOCKED` — core előfeltétel hiányzik; a parancs 2-es hibakóddal áll le.

## 4. Participant workspace: idempotens bootstrap

Nézd meg, hogy a célkönyvtár megfelelő, majd az `-InstallDependencies` kapcsolóval explicit engedélyezd a dependency installt:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File toolkit/setup/workshop-bootstrap.ps1 `
  -Destination ..\participant-repo `
  -Agent Both `
  -InstallDependencies
```

A script:

1. újra lefuttatja a doctort;
2. csak a Gitben követett starterfájlokat másolja a participant repo gyökerébe, így lokális `.env` és build artifact nem kerül át;
3. nem ír felül ismeretlen, nem üres könyvtárat;
4. inicializálja a Gitet;
5. `npm ci`, typecheck és teszt után létrehozza a `workshop-evidence/C0-setup.md` fájlt;
6. második futáskor felismeri és újrahasználja a saját workspace-ét, törlés vagy reset nélkül.

Ha még csak a másolást akarod ellenőrizni, hagyd el az `-InstallDependencies` kapcsolót. Ekkor `BOOTSTRAP_STATUS=PASS`, de `C0_STATUS=PENDING`: a workspace létrejött, C0 még nem kész.

## 5. Agentválasztás és belépés

### Claude Code út

```powershell
claude --version
claude doctor
cd ..\participant-repo
claude
```

A projekt `.mcp.json` fájlja nem tartalmaz titkot. A Claude sessionben `/mcp` alatt az általad ténylegesen használt connectorokat OAuth-tal, egyenként hagyd jóvá. Ne hitelesíts olyan szolgáltatást, amelyre nincs szükséged.

### Codex út

```powershell
codex --version
codex doctor
codex login
cd ..\participant-repo
codex
```

A `codex doctor` az install/config/auth/runtime/Git állapot diagnosztikája. A Claude `.mcp.json` fájlját ne tekintsd automatikusan Codex-konfigurációnak; a közös connector- és agentadapter-csomag külön workshop-checkpoint lesz.

## 6. Böngészőagent — ellenőrzött utak 2026-07-13-án

### Claude Code + Chrome vagy Edge

A hivatalos Claude Code út Chrome-ot és Microsoft Edge-et támogat. Előfeltétel: Claude Code 2.0.73+, Claude in Chrome extension 1.0.36+, közvetlen fizetős Claude-hozzáférés. Forrás: [Use Claude Code with Chrome](https://code.claude.com/docs/en/chrome).

```powershell
claude --chrome
```

Meglévő sessionben `/chrome`: ellenőrizd a connection státuszt, engedélyeket és a kiválasztott böngészőt. Kész, ha Claude meg tud nyitni egy új tabot és vissza tudja mondani a participant oldal címét. CAPTCHA-t és bejelentkezést ember végez.

### Codex + beépített Browser vagy Chrome

- **`@Browser`**: a ChatGPT desktop app Plugins Directory részében telepített Browser külön profilt használ. Forrás: [Browser](https://learn.chatgpt.com/docs/browser).
- **`@Chrome`**: a ChatGPT desktop app Plugins részében add hozzá a Chrome plugint, végezd el az extension setupot, majd Chrome-ban ellenőrizd a `Connected` állapotot. Forrás: [Chrome extension](https://learn.chatgpt.com/docs/chrome-extension#set-up-chrome-from-plugins).

A Codex Chrome extensionhöz ebben az útmutatóban nem ígérünk Edge-támogatást. Edge esetén használd a Claude-utat vagy a kézi fallbacket.

### Kézi browser fallback

Ha az agent nem csatlakozik öt percen belül:

1. nyisd meg kézzel a lokális vagy preview URL-t;
2. hajtsd végre a megadott happy vagy failure pathot;
3. mentsd az URL-t, a látható eredményt és egy screenshotot az evidence könyvtárba;
4. írd a fejlécbe: `Execution mode: MANUAL`;
5. a tanulási út folytatódik, a browser-automation bizonyíték pedig `PENDING` marad; a kézi futás nem replay.

Miután legalább egy agent válaszolt és a browser módját ellenőrizted, futtasd újra a bootstrapot ugyanazzal a céllal és az őszinte módot megadó kapcsolókkal:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File toolkit/setup/workshop-bootstrap.ps1 `
  -Destination ..\participant-repo -Agent Both -InstallDependencies `
  -AgentConfirmed -BrowserMode Connected
```

Ha az ötperces stop-szabály után kézzel hajtottad végre az utat, `Connected` helyett `Manual` legyen. A script a létrehozott participant repón is újrafuttatja a doctort, és csak ezután írhat `C0_STATUS=PASS` értéket.

## 7. Accountok és külső integrációk

1. **GitHub:** saját e-mail, e-mail-megerősítés; ez kell a saját repóhoz.
2. **Vercel:** GitHub-belépés, ha a live preview lane-t használod.
3. **Neon:** GitHub-belépés, ha a live database lane-t használod.
4. **Linear/v0:** csak akkor, ha az adott stretch gyakorlatot végrehajtod.

Az agent navigálhat és magyarázhat, de repoláthatóságot, accountválasztást, régiót, deployment protectiont, OAuth-ot és más érzékeny döntést ember hagy jóvá. Titkot, tokent, `.env`-értéket vagy személyes URL-t ne ments evidence-be és ne commitolj.

## 8. C0 készdefiníció és átadás

C0 akkor kész, ha:

- a participant repón futó post-bootstrap doctor `PASS`, vagy validált replay pack esetén `REPLAY` státuszt ad;
- a `participant-repo/` saját Git-repó és a baseline typecheck/teszt zöld;
- a `workshop-evidence/C0-setup.md` létezik;
- legalább egy coding agent válaszol a participant repo kontextusában, és ezt az `-AgentConfirmed` rögzíti;
- a browser út státusza `Connected` vagy `Manual`, nem ismeretlen;
- a bootstrap utolsó sora `C0_STATUS=PASS` (vagy valóban validált opcionális replay esetén `REPLAY`);
- meg tudod nyitni a [tananyagközpontot](README.md), majd az [1. modult](modulok/01-agentikus-fejlesztes/index.html).

Ha `BLOCKED` maradt, a tréner setup lane-jében kérj segítséget. Ne állítsd késznek, és ne vidd át a hibát a következő modulba.
