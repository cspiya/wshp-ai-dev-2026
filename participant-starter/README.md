# Résztvevői starter — technikai hordozó az agent-ready rendszerhez

Ez a **Wenova AI-Assisted Development Workshop** résztvevői sablonja: egy
szándékosan minimális **Next.js (App Router) + TypeScript + Tailwind +
shadcn/ui** projekt. Ez még **nem agent-ready fejlesztési rendszer**, csak a technikai hordozója. A nap
első feladata, hogy missionnel, repo-szabályokkal, kanonikus standarddal, spec-kapuval, RUG-gal és
mechanikus ellenőrzésekkel megbízható fejlesztési környezetté alakítsd.

Az ezután készülő alkalmazás a rendszer életszerű, de **KITALÁLT** validációs workloadja: azt bizonyítja, hogy az
operating modellel valóban végigvihető egy üzleti változás a specifikációtól a review-zott eredményig.

A működési szerződést ne egy konkrét modell prompt-trükkjeire építsd. A spec, standard, DoD, gate-ek és
evidence maradjanak modell- és toolfüggetlenek; a coding agent indítása és hook-bekötése legyen cserélhető
adapter. Így ugyanaz a repo szolgáltatáskiesés, költségváltozás vagy modellfrissítés után is használható.

Adatbázis, API-réteg és a többi "nagyágyú" **szándékosan nincs benne** — azok
a nap későbbi blokkjaiban kerülnek be, lépésről lépésre.

## Hogyan használd

1. A minimális bootstrap után indíts Claude Code-ot vagy Codexet abban a munkakönyvtárban, ahol a saját
   résztvevői repód lesz.
2. Mondd az agentnek, hogy a workshop forrásrepo `participant-starter` mappájából készítse elő a saját,
   írható GitHub-repódat. A közös workshop-forrást nem módosíthatja.
3. Kérd meg az agentet, hogy olvassa el az `AGENTS.md` és `DESIGN-GUIDELINE.md` fájlt, ellenőrizze a
   környezetet, telepítse a lockfile szerinti függőségeket, és futtassa a teljes preflightot.
4. Az agent adja vissza a munkakönyvtárat, a lefuttatott kapukat, az exit állapotokat, a maradék kockázatot
   és minden emberi döntést. Hibánál javítson a jóváhagyott scope-on belül, majd ismételje meg a teljes
   preflightot.
5. Feature csak az ember által elfogadott bootstrap-evidence után indulhat. Második agent opcionális
   portability smoke; nem feltétele a kötelező útnak.

## Agent-run technikai szerződés

Az alábbi parancsokat az agent, a hook vagy a CI futtatja. A résztvevőnek nem kell ezeket begépelnie.

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
  olvashatja és szerkesztheti). Új komponenst az agent a telepített verzió hivatalos eljárásával ad hozzá.
- **`.env.example`** — még üres; a `DATABASE_URL` a nap adatbázis-blokkjában
  kerül ide.

## Ha elakadsz

Abszolút linkek, hogy a saját repódba másolás után is működjenek:

- Szakszavak: [fogalomtár](https://cspiya.github.io/wshp-ai-dev-2026/materials/fogalomtar/)
- Felkészülés / telepítés: [C0 setup](https://cspiya.github.io/wshp-ai-dev-2026/materials/felkeszules/)
- Napirend: [a nap térképe](https://cspiya.github.io/wshp-ai-dev-2026/materials/napirend/)
- Első modul: [Szerepek és korlátok](https://cspiya.github.io/wshp-ai-dev-2026/materials/modulok/01-agentikus-fejlesztes/)

## A nap munkadarabja

A nap egyetlen, végigvitt munkadarabja a **KK-Regisztráció** nevű, kitalált üzleti
kérés: jelentkezés műhelyre névvel és e-mail-címmel, 48 órás — kizáró határú —
lemondási ablakkal és duplikátum-védelemmel. A 3. modulban erre a briefre írod meg a
saját öt fájlos spec-csomagodat, a C4 maker-blokkban pedig a jóváhagyott szerződést a
saját repódban implementálod az agenteddel. A tréner ugyanehhez a munkadarabhoz kész
pillanatképeket (known-good, partial, broken) tart karban tartalék-útvonalként, így a
nap akkor sem áll meg, ha egy korábbi lépés elakadt. A brief, a referencia
spec-csomag és a snapshotok leírása: [a golden-thread csomag](../toolkit/golden-thread/README.md).
