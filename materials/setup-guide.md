# Felkészülési útmutató — a workshop előtt (~30–40 perc)

Minden lenti regisztráció **ingyenes és bankkártya nélkül** elvégezhető — az egyetlen fizetős elem a Claude-előfizetésed.

## 1. Fiókok, amiket előre hozz létre

| Fiók | Mire használjuk | Tipp |
|---|---|---|
| **GitHub** — github.com | Itt lesz a saját repód — ebben dolgozol egész nap | Meglévő fiók tökéletes. **Public** repót hozunk létre (abból lehet publikálni/deployolni) |
| **Vercel** — vercel.com | Ingyenes hosting — minden változtatásod élő preview-linket kap | Regisztrálj a **"Continue with GitHub"** gombbal, így azonnal össze is kapcsolódnak |
| **Neon** — neon.com | Ingyenes serverless Postgres adatbázis a projekted mögé | Itt is jó a "Sign in with GitHub" |
| **Linear** — linear.app | Feladatkezelő — innen dolgoznak majd az AI-agentek (MCP-n át) | Az ingyenes csomag elég |
| **v0** — v0.app | AI-alapú UI/dizájn-generálás a weboldaladhoz | A Vercel-fiókoddal lépj be |

## 2. Claude-előfizetés + telepítések

- **Claude-előfizetés** (claude.ai): egész nap a **Claude Code**-dal dolgozunk — aktív előfizetés kell
  (minimum **Pro**; a **Max** még kényelmesebb). *Ez az egyetlen fizetős előfeltétel.*
- Telepítsd a gépedre (Windows / macOS / Linux egyaránt jó):
  - **Git** — git-scm.com
  - **Node.js LTS** — nodejs.org
  - **Claude Code CLI** — a claude.ai/code útmutatója szerint
  - *(ajánlott)* **VS Code** vagy a kedvenc editorod

## 3. Ellenőrzés (2 perc)

Nyiss egy terminált, és futtasd:

```
claude --version
claude
```

Jelentkezz be, amikor kéri. Ha ez megy, készen állsz. Az MCP-konnektorokat (GitHub, Vercel, Neon, Linear)
**a workshopon közösen** állítjuk be — kész konfigurációt kapsz hozzá.

## 4. Mit hozz magaddal

- **Laptop + töltő**
- **Egy weboldal-ötletet!** A nap során mindenki a saját ötletéből, **nulláról** épít fel egy kis weboldalt
  a legmodernebb AI-asszisztált módszerekkel — a nap végére élő, publikus URL-en fut. Lehet hobbiprojekt,
  belső tool, termékötlet — bármi, ami érdekel.
- Üzleti elemzőknek: gondolj végig előre 1–2 **üzleti szabályt / elfogadási kritériumot** az ötletedhez —
  ezekkel dolgozunk a specifikációs blokkban.

Ha bármelyik lépésnél elakadsz, kérdezz a workshop Discord-csatornáján (a meghívót e-mailben kaptad) —
még a nap előtt segítünk, hogy 14-én az első perctől építéssel teljen az idő, ne hibakereséssel.
