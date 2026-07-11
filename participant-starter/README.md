# Résztvevői starter — technikai hordozó az agent-ready rendszerhez

Ez a **Wenova AI-Assisted Development Workshop** résztvevői sablonja: egy
szándékosan minimális **Next.js (App Router) + TypeScript + Tailwind +
shadcn/ui** projekt. Ez még **nem agent-ready fejlesztési rendszer**, csak a technikai hordozója. A nap
első feladata, hogy missionnel, repo-szabályokkal, kanonikus standarddal, spec-kapuval, RUG-gal és
mechanikus ellenőrzésekkel megbízható fejlesztési környezetté alakítsd.

Az ezután készülő alkalmazás a rendszer real-life validációs workloadja: azt bizonyítja, hogy az
operating modellel valóban végigvihető egy üzleti változás a specifikációtól a review-zott eredményig.

A működési szerződést ne egy konkrét modell prompt-trükkjeire építsd. A spec, standard, DoD, gate-ek és
evidence maradjanak modell- és toolfüggetlenek; a coding agent indítása és hook-bekötése legyen cserélhető
adapter. Így ugyanaz a repo szolgáltatáskiesés, költségváltozás vagy modellfrissítés után is használható.

Adatbázis, API-réteg és a többi "nagyágyú" **szándékosan nincs benne** — azok
a nap későbbi blokkjaiban kerülnek be, lépésről lépésre.

## Hogyan használd

1. **Másold le a saját GitHub-repódba.** A "Use this template" gombot később
   kapcsoljuk be — addig klónozd/másold a `participant-starter` mappát egy új,
   saját (public) repóba.
2. Telepítés és indítás:

```bash
npm install
npm run dev        # http://localhost:3000
```

3. Mielőtt feature-t építesz, zárd az **agent-ready bootstrap checkpointot**:
   - igazítsd a repohoz az `AGENTS.md`-t;
   - nevezd meg az egyetlen engineering standardot és Definition of Done-t;
   - ellenőrizd a valódi typecheck/lint/test/build parancsokat;
   - kérj egy read-only agentet, hogy mondja vissza a repo működési szerződését.
4. Ha két agent vagy modell elérhető, ugyanazzal a read-only feladattal végezz portability smoke testet:
   ugyanazokat a kötelező szabályokat, nyitott döntéseket és valódi parancsokat kell felismerniük.
5. Csak ezután nyisd meg a `src/app/page.tsx`-et: a feature már a keretrendszer első rendszerpróbája.

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | fejlesztői szerver |
| `npm run typecheck` | típusellenőrzés (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (egy minta-teszt már van) |
| `npm run build` | éles build — a Vercel is ezt futtatja |

Az önálló starter tartalmaz egy GitHub Actions workflow-t is
(`.github/workflows/ci.yml`). Amikor a starter tartalmát a saját repód
gyökerébe másolod, minden push és pull request automatikusan lefuttatja a
typecheck, lint, teszt és build kapukat.

## Fontos fájlok

- **`AGENTS.md`** — a repo működési szerződése az agent számára; önmagában nem elég, a standarddal,
  speckkel, gate-ekkel és független review-val együtt alkot rendszert.
- **`DESIGN-GUIDELINE.md`** — a dizájn-szabálykönyv váza; az agent minden
  UI-munkánál ezt követi. A nap során töltöd fel.
- **`src/components/ui/`** — shadcn/ui komponensek (helyi forráskód — az agent
  olvashatja és szerkesztheti). Újat így adsz hozzá:
  `npx shadcn@latest add <komponens>`.
- **`.env.example`** — még üres; a `DATABASE_URL` a nap adatbázis-blokkjában
  kerül ide.

## Ha elakadsz

Abszolút linkek, hogy a saját repódba másolás után is működjenek:

- Szakszavak: [fogalomtár](https://github.com/cspiya/wshp-ai-dev-2026/blob/main/materials/fogalomtar.md)
- Felkészülés / telepítés: [setup-guide](https://github.com/cspiya/wshp-ai-dev-2026/blob/main/materials/setup-guide.md)
- Napirend: [agenda](https://github.com/cspiya/wshp-ai-dev-2026/blob/main/materials/agenda.md)
- G1 munkafüzet — saját repo, CI, Vercel preview és Neon DB-branch:
  [01-greenfield-setup.html](https://github.com/cspiya/wshp-ai-dev-2026/blob/main/materials/notebooks/01-greenfield-setup.html)
