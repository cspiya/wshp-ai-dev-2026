# Felkészülési útmutató — C0 a workshop előtt

A cél nem az, hogy minden külső szolgáltatás mindenkinél hibátlan legyen. A cél az,
hogy 09:00-kor már fusson melletted **Claude Code vagy Codex**, és az agent által
végrehajtott preflightból őszinte `C0_STATUS` eredmény szülessen: `PASS`, `REPLAY`,
`PENDING` vagy `BLOCKED`.

> **A nap alapelve:** az alábbi három bootstrap-kivétel után nem neked kell Git-, npm-,
> PowerShell-, Linux-, API- vagy termékparancsokat megjegyezned és pontosan begépelned.
> Az aktív agent végzi a technikai műveleteket, te célt adsz, döntesz, és ellenőrzöd a
> visszaadott bizonyítékot.

## 1. A három engedélyezett bootstrap-lépés

1. **Scoop telepítése, ha szükséges.** Windows alatt töltsd le és indítsd el dupla
   kattintással a [`scoop-telepito.cmd`](../toolkit/setup/scoop-telepito.cmd) fájlt,
   nem rendszergazdaként. A végén nyiss új terminált.
2. **Munkamappa kiválasztása.** Hozz létre vagy válassz ki egy üres
   `workshop-lab` mappát. Ezt megteheted a fájlkezelőben; nem kell hozzá parancs.
3. **Az első agent elindítása.** Nyiss terminált ebben a mappában, majd indítsd el
   az egyik agentet a `claude` vagy a `codex` paranccsal. Egy működő agent elegendő
   a teljes kötelező útvonalhoz.

Ha az egyik indítóparancs nem érhető el, térj vissza a Scoop telepítőhöz vagy kérj
segítséget a tréner setup lane-jében. Az agent indulása előtt más technikai parancsot
ne próbálj kézzel összeállítani.

## 2. Melyik agenttel indulj?

Az ajánlott út Claude Code, Claude Opus 4.8 modellel. A Claude Pro kerete azonban nem
ígérhető egész napra, és a Claude valamint Claude Code közös használati keretet
fogyaszthat. Az azonnali, szolgáltatófüggetlen tartalékút a Codex.

További, szabályos kapacitási tartalék lehet külön kiosztott Max-, Team- vagy
usage-credit hozzáférés. Személyes consumer-account jelszavát soha ne osszátok meg.
Ha egyik live agent sem használható, a tréner ellenőrzött replayje tartja meg a
tanulási célt, de a nem futtatott lépés nem kaphat `PASS` állapotot.

Dinamikus workflow használható, ha az account támogatja. A kötelező, mindenkinél
végrehajtható alapút a repó szabályaira, a skillre és a Repeat-Until-Good körre épül.

## 3. Accountok és MCP-összekapcsolás

A workshopon külső szolgáltatásokat is használunk. Hozd létre (vagy ellenőrizd) az
accountjaidat ebben a sorrendben — a későbbiek az előzőkre épülnek:

1. **GitHub** — a saját e-mail-címeddel; ez lesz a repóid és a CI otthona.
2. **Vercel** — GitHubbal lépj be (deploy és preview).
3. **Neon** — GitHubbal lépj be (adatbázis).
4. **Linear** — munkaállapot és issue-k.
5. **v0** — opcionális, csak a design-generáló gyakorlathoz.

Az account-létrehozásban a böngészőagent végigvezethet (6. szakasz), de bejelentkezést,
jelszót és OAuth-jóváhagyást mindig te adsz meg — ez emberi kapu.

**MCP-összekapcsolás az agentből.** A workshop-repók `.mcp.json`-ja már tartalmazza a
Linear, GitHub, Neon és Vercel MCP-kapcsolatot, titok nélkül. Claude Code-ban a `/mcp`
menüből engedélyezed őket OAuth-tal: a **Linear, a Neon és a Vercel** így azonnal működik.

**GitHub-kivétel.** A GitHub MCP OAuth-ja jelenleg nem működik Claude Code-ból (a
szerver nem támogat dinamikus kliensregisztrációt). Nem akadály: a GitHub-műveleteket
az agent a `gh` CLI-n keresztül végzi. Ehhez egyszer kell bejelentkezned — kérd meg az
agentet, hogy indítsa el a GitHub CLI böngészős bejelentkezését, és a megnyíló oldalon
hagyd jóvá. A `github` MCP-bejegyzés maradhat a konfigurációban; ha az agent kihagyja,
az nem hiba.

## 4. Add át az egész technikai előkészítést az agentnek

Az agent első feladata a forrásrepo, a résztvevői repó és az evidence-mappa biztonságos
felépítése. Add neki az alábbi természetes nyelvű megbízást. Ez szándékot és
elfogadási feltételeket ad; a szükséges pontos parancsokat az agent választja ki és
futtatja.

```text
Prepare my workshop workspace in this selected folder.

Use https://github.com/cspiya/wshp-ai-dev-2026 as the read-only workshop source.
Create three sibling directories: workshop-source, participant-repo and
workshop-evidence. Read the repository setup guide and agent rules before acting.
Run the repository's own doctor and idempotent bootstrap scripts. Install project
dependencies only through the provided bootstrap path. Do not overwrite an unknown
non-empty directory, do not reset existing work, and do not read or print secrets.

Return: the directories created or reused, the exact checks you ran, their exit
codes, the final C0 status, every remaining risk, and any human approval you still
need. Stop on BLOCKED instead of inventing a workaround.
```

Az agentnek a kanonikus szerkezetet kell létrehoznia:

```text
workshop-source/          # tananyag- és starter-forrás, csak olvasásra
participant-repo/        # egész nap ezt módosítja az agent a felügyeleteddel
workshop-evidence/       # C0–C7 bizonyítékok, nem publikus munkanyom
```

A repó saját `workshop-doctor.ps1` és `workshop-bootstrap.ps1` scriptje a technikai
kontraktus része. A pontos meghívásukat nem neked kell reprodukálnod: az agent olvassa
ki a repóból, futtatja, majd megmutatja a parancsot, a kilépési kódot és a státuszt.

## 5. Mit ellenőrizzen az agent?

| Terület | Agent feladata | Emberi kapu | Elfogadható eredmény |
|---|---|---|---|
| Helyi eszközök | Ellenőrizze a Git, GitHub CLI, Node.js 22.13+, npm és a választott agent elérhetőségét. | Jóváhagyod az esetleges telepítést vagy frissítést. | `PASS` vagy pontos `BLOCKED` ok. |
| Workspace | Futtassa a doctor és az idempotens bootstrap útját. | Ellenőrzöd, hogy a megfelelő mappában dolgozik. | Saját Git-repó, zöld baseline, C0 evidence. |
| Böngésző | Állítsa be és próbálja ki az elérhető böngészőagentet. | Te végzed a bejelentkezést, CAPTCHA-t és OAuth-jóváhagyást. | `Connected` vagy őszinte `Manual`. |
| Külső szolgáltatás | Jelezze, mely későbbi lépéshez kell GitHub, Vercel vagy Neon. | Te választasz accountot, régiót, láthatóságot és védelmet. | `PASS`, `PENDING` vagy `BLOCKED`; soha nem feltételezett hozzáférés. |
| Legacy lane | Ellenőrizze a .NET SDK 10-et vagy a replay manifestet. | Te döntesz a local/replay útról. | `LOCAL`, validált `REPLAY`, vagy `BLOCKED`. |

A doctor nem olvashat tokent, jelszót vagy `.env`-értéket. A bootstrap csak Gitben
követett starterfájlokat másolhat, nem írhat felül ismeretlen munkát, és második
futáskor a saját workspace-ét kell újrahasználnia.

## 6. Böngészőagent: az automatizált út az alap

A 6. modul rendszerellenőrzésének kötelező alapútja az agent által vezérelt böngésző.
Már a felkészüléskor kérd meg az agentet, hogy állítsa be és próbálja ki az egyik utat:

- Claude Code: a hivatalos Chrome-integráció Chrome-ot és Microsoft Edge-et támogat;
- Codex: a Browser plugin külön profilt, a Chrome plugin a meglévő Chrome-profilt
  használhatja.

Add ezt a következő megbízást ugyanannak az agentnek:

```text
Set up the supported browser-agent path available in this environment. Use official
product guidance, ask me to perform every login, CAPTCHA, OAuth or permission choice,
then open the participant material and report the visible page title. Record the
browser mode as Connected only if you actually controlled the browser. If connection
is not working after five minutes, stop and prepare the honest manual fallback.
```

Az ötperces stop-szabály után a kézi út megengedett Plan B: ember nyitja meg az URL-t
és hajtja végre ugyanazt az utat, az agent pedig segít a megfigyelés és az evidence
rögzítésében. A jelölés `Execution mode: MANUAL`; ez nem replay és nem automatizálási
`PASS`.

Források: [Claude Code with Chrome](https://code.claude.com/docs/en/chrome) ·
[Codex Browser](https://learn.chatgpt.com/docs/browser) ·
[Codex Chrome extension](https://learn.chatgpt.com/docs/chrome-extension#set-up-chrome-from-plugins).

## 7. Emberi döntések és biztonsági határ

Az agent navigálhat, diagnosztizálhat, telepíthet és ellenőrizhet, de a következőket
mindig ember hagyja jóvá:

- account- és szervezetválasztás;
- OAuth, bejelentkezés, CAPTCHA és jogosultság;
- repoláthatóság, régió és deployment protection;
- költséget vagy külső állapotváltozást okozó művelet;
- `BLOCKED` állapot feloldásához szükséges scope-változás.

Titkot, tokent, `.env`-értéket, személyes URL-t vagy valódi személyes adatot ne adj az
agentnek, ne ments evidence-be, és ne commitolj. A minták kizárólag életszerű, de
KITALÁLT adatot használhatnak.

## 8. C0 bizonyíték és Repeat-Until-Good

Kérd meg az agentet, hogy a végén hozza létre vagy frissítse a
`workshop-evidence/C0-setup.md` fájlt, majd adja vissza:

- a forrás és a résztvevői workspace helyét;
- a választott agentet és a browser execution mode-ot;
- minden lefuttatott ellenőrzést, kilépési kódot és rövid eredményt;
- a `PASS`, `REPLAY`, `PENDING` vagy `BLOCKED` végállapotot;
- minden maradék kockázatot és szükséges emberi döntést.

Te nézd át az evidence-et. Ha az állítás nincs összhangban a megfigyelt eredménnyel,
mondd meg az eltérést, és kérd az agentet a javításra vagy újraellenőrzésre. Ez az első
**AI-val megerősített emberi tanulási ciklus**:

`emberi várakozás → agent végrehajtás és magyarázat → evidence vizsgálata → korrekció → emberi összegzés`.

## 9. C0 készdefiníció

C0 akkor kész, ha:

- a participant repón futó post-bootstrap doctor `PASS`, vagy manifesttel igazolt
  opcionális replay esetén `REPLAY`;
- a `participant-repo/` saját Git-repó, és a baseline ellenőrzéseket az agent zölden
  lefuttatta;
- a `workshop-evidence/C0-setup.md` létezik és a tényleges eredményeket tartalmazza;
- legalább egy Claude Code vagy Codex session válaszol a participant repo
  kontextusában;
- a böngészőút `Connected` vagy őszintén jelölt `Manual`;
- nincs elhallgatott `PENDING` vagy `BLOCKED` alapfeltétel.

Ha `BLOCKED` maradt, add át az agent bizonyítékcsomagját a tréner setup lane-jének. Ne
állítsd késznek, és ne vidd át a hibát a következő modulba. Ha kész, nyisd meg a
[tananyagközpontot](README.md), majd az [1. modult](modulok/01-agentikus-fejlesztes/index.html);
az agent maradjon aktív melletted a teljes nap során.
