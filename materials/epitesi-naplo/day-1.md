# Építési napló — Day 1 (2026.07.09): skeleton + participant-starter + az első RUG-kör

*Mit csináltunk ma, milyen döntéseket hoztunk, és miért. Ez a napló tananyag: minden döntésnél ott a
„miért" és az elvetett alternatívák. Szakszavak: [fogalomtár](../fogalomtar.md) · a teljes ív:
[big picture](../big-picture.md)*

**A nap terméke:** a `reference-app/` váz (Next.js + tRPC + Zod + Drizzle/Neon + kikényszerített
boundary-k + CI) és a `participant-starter/` — majd egy teljes **Repeat-Until-Good kör**, ami a zöld CI
ellenére **10 valódi hibát** talált és javított. Linear: WEN-113, WEN-114 ✅

---

## Döntések (decision boxok)

### 🧠 1. Egy alkalmazás `src/` layouttal — nem monorepo (eltérés az architektúra-tervtől!)

- **Probléma:** az architektúra-doksi `/apps/web` + `/packages/*` monorepót vázolt; egy 1 napos
  workshopon viszont minden plusz mozgó alkatrész (workspace-konfig, package-linkelés) tanítási időt visz el.
- **Választás:** egyetlen Next.js-app, benne `src/modules | platform | contracts` — a terv struktúrája
  1:1 leképezve, csak egy deploy-egységben.
- **Miért:** a tanítandó elv nem a monorepo, hanem a **modulhatár**. Az egy-app forma ugyanazt a leckét
  adja fele annyi konfigurációval; Vercelre is triviálisan megy.
- **Alternatíva (elvetve):** igazi monorepo (pnpm workspaces / turborepo) — nagy csapatnál ez a jó út, és
  a notebookban meg is mutatjuk mint „következő lépés"; egy napra viszont overkill.

### 🧠 2. Lusta adatbázis-kliens (`getDb()`) — az app DB nélkül is fut

- **Probléma:** a nap elején a résztvevőknek még nincs bekötött Neon-adatbázisuk; ha az app már
  induláskor DATABASE_URL-t követel, az első élmény egy hibaüzenet.
- **Választás:** lusta singleton `getDb()` — a kapcsolat csak az első tényleges DB-hívásnál jön létre;
  a health-check és a build DB nélkül is zöld.
- **Miért:** „az első 15 perc élménye a siker legyen" — a starter fork → zöld build → élő preview útnak
  semmilyen külső függése nincs.
- **Alternatíva (elvetve):** induláskori kötelező env-validálás (fail-fast) — production-appban ez a
  helyes; itt a tanítási sorrend miatt később jön (és a notebook ezt a trade-offot ki is mondja).

### 🧠 3. Boundary-kikényszerítés: string-mintáktól a resolved-path zónákig (a nap fő tanulsága!)

- **Probléma:** az architektúra fő állítása, hogy a modulhatárok **mechanizmussal** (linttel) vannak
  kikényszerítve, nem konvencióval. Az első implementáció `no-restricted-imports` string-mintákkal
  dolgozott (`@/modules/*/*` tiltása a contract kivételével).
- **Ami történt:** a builder minden kapun átment (lint zöld, CI zöld) — majd a **független review
  élő eslint-futtatással bizonyította**, hogy a szabály **csak az alias-os írásmódra** illeszkedik: a
  relatív `../../identity/infra/schema` import simán átcsúszott, a domain-purity szabály pedig többszintű
  relatív úttal és third-party csomaggal is kikerülhető volt. A fő tanítási állításunk élőben cáfolható
  lett volna.
- **Javítás (mechanizmus-szinten):** `import/no-restricted-paths` **feloldott útvonalakon** működő
  zónákkal — a szabály már nem az import *szövegét* nézi, hanem hogy a feloldott fájl *hová* mutat.
  A zónák a `src/modules/` tényleges mappáiból generálódnak. Plusz: **11 lint-regressziós teszt** —
  a megtalált kerülőutak fixture-ként rögzítve, hogy a lyuk soha ne nyílhasson újra észrevétlenül.
- **Miért így:** „a lint-szabálynak is legyen tesztje" — a mechanizmus csak akkor ér valamit, ha a
  megkerülhetetlensége is bizonyított. (Nulla új függőség: a plugin az eslint-config-next része.)
- **Alternatíva (elvetve):** eslint-plugin-boundaries — jó eszköz, de plusz függőség; dependency-cruiser —
  külön futtatás, nem él az editorban.
- **Finomság (megjegyzendő):** a zónák a *létező* modulmappákból generálódnak → stdin-nel, nem létező
  mappájú fájlnévvel tesztelve a szabály nem tüzel (a valóságban ilyen fájl nem létezhet). **Valódi
  fájllal kell tesztelni** — a regressziós teszt pont így csinálja.

### 🧠 4. `env()` helper + drizzle placeholder-séma — a doksi és a valóság szinkronja

- **Probléma:** két külön review-fogás találkozott: (a) az `env()` helpernek egyetlen hívója volt (a saját
  AGENTS.md-nk tiltja az egy-implementációs wrappert!), (b) a `drizzle.config.ts` nyers
  `process.env.DATABASE_URL!`-t használt → hiányzó env esetén kriptikus hibaüzenet; ráadásul a
  `db:generate` **üres schema-globra crashelt**, miközben a doksi működőnek hirdette.
- **Választás:** a drizzle.config is az `env()`-et használja (így annak már **két** hívója van → a wrapper
  jogos), és egy minimál placeholder `schema.ts` került a golden-path modulba, így a dokumentált parancs
  tényleg lefut (tiszta no-op).
- **Miért:** a hibaüzenet is tananyag — „Missing environment variable DATABASE_URL — copy .env.example"
  százszor többet ér egy driver-stacktrace-nél; és **a doksi ígérete legyen igaz**.
- **Mellékes tanulság:** a `*/` karaktersor egy `/** */` blokk-kommentben lezárja a kommentet — a
  placeholder ezért sor-kommentekkel készült. (Az ilyen apróságok viszik el a live-demók perceit.)

### 🧠 5. `QueryClient` alapértelmezések: `staleTime: 30_000`

- **Probléma:** a default `staleTime: 0` mellett minden ablak-fókusz újralövi az összes lekérdezést —
  a golden-path providert mindenki másolja, és workshop-napon 25 laptop × fókuszváltások = kérés-vihar a
  közös ingyenes Neon ellen.
- **Választás:** 30 mp-es staleTime, egy soros „miért" kommenttel.
- **Miért:** a minta, amit másolnak, tanítson jó defaultot; a hálózati fülön demózható a különbség.

### 🧠 6. CI: matrix + concurrency-cancel; és a lockfile-lecke

- **Probléma:** a két app CI-jobja byte-ra azonos copy-paste volt (drift-veszély), és minden push teljes
  futást indított a korábbiak megszakítása nélkül.
- **Választás:** egyetlen job `strategy.matrix.app: [reference-app, participant-starter]`-rel +
  `concurrency: cancel-in-progress`. A dupla typecheck megszüntetése: a CI explicit typecheck-lépése az
  egyetlen típus-kapu (a `next build` saját ellenőrzése kikapcsolva, kommenttel dokumentálva).
- **Gyakorlati lecke:** a **Windowson npm 11-gyel** generált lockfile-t az ubuntu-s **npm 10-es** runner
  `npm ci`-je elutasította (hiányzó platform-bináris bejegyzések). Megoldás: lockfile-generálás
  `npx npm@10 install`-lal, mindkét npm-verzió alatt validálva. → *Szabály: a lockfile-t a CI npm-verziójával
  generáld.*

### 🧠 7. „A reviewer is tévedhet" — a shadcn-eset

- **Ami történt:** a review azt javasolta, hogy a `shadcn` csomag kerüljön ki a függőségek közül („csak
  CLI, sosem importálja kód"). A javító-agent **kipróbálta** — és a build eltört: a `globals.css` a
  `shadcn/tailwind.css`-t importálja, tehát **valódi runtime-függőség**.
- **Tanulság (tananyagba!):** a review-visszajelzést se fogadd el vakon — **verifikálj, mielőtt
  implementálsz**. A bíráló friss kontextusa erő (ő látta meg, amit a szerző nem), de a végső bíró mindig
  a lefuttatott bizonyíték.

---

## Az első RUG-kör számokban (a G3 modul élő sztorija)

| Lépés | Eredmény |
|---|---|
| Builder | skeleton + starter, **minden kapu zöld** (typecheck, lint, teszt, build, CI) — 8 commit |
| Review: 8 független szempont | **36 jelölt** → dedup + verifikáció → **10 megerősített hiba** |
| Súlyosak | `.mcp.json` nem volt gitignore-olva (titok-szivárgás publikus repóban!); lyukas boundary-lint; crashelő `db:generate`; font-önhivatkozás; 404 segítség-linkek a kimásolt starterben |
| Bounce-back | mind a 10 + 6 kisebb javítva — 11 commit |
| Re-verify | az eredeti kerülőutak most **buknak** linten; CI zöld |

**A lecke egy mondatban:** *a builder minden zöld kapun átment — és a friss kontextusú, független bíráló
mégis talált 10 valódi hibát. A szerző ≠ bíráló elv nem opcionális.*

## Holnap (Day 2)

1. **Kapu (kézi lépések):** Vercel-projekt + Neon-integráció + branch-per-preview bekapcsolása —
   lásd `reference-app/SETUP-STATUS.md` checklist.
2. **Risk-first:** a Neon-branch-per-preview + Playwright-a-preview-n plumbing validálása (WEN-116) —
   ez a workshop technikai csúcspontja, minden ezen múlik.
3. A golden-path `tasks` slice (WEN-117) — és vele a Day 2 naplóbejegyzés + notebook-tartalom.
