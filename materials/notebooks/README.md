# Tananyag-notebookok (kivezetett formátum — forrásleírás)

> **Státusz:** a notebookok tartalmát a kanonikus HTML-modulok
> (`materials/modulok/`, webes hub: [Modulok](../modulok/index.html)) vették át;
> az itteni `.html` fájlok 2026. augusztus 15-ig átirányítások. Ez a leírás a
> struktúra és a munkatér-szerződés dokumentációjaként marad meg az instruktornak
> és az agenteknek.

A workshop moduljainak tananyaga **magyar nyelvű, önálló HTML** formában készül. A korábbi
notebookok a kanonikus [`visual-contract.md`](visual-contract.md) vizuális szerződésből
indultak. A tananyagot a GitHub Pages szolgálja ki weboldalként, és a repóból külső
függőség nélkül, offline is megnyitható.

## Kötelező fő gondolatmenet

Minden notebook ugyanannak a rendszernek egy következő képességét építi:

`üres repo → agent-ready működés → spec-kapu → RUG → mechanikus garanciák → kitalált, reprezentatív rendszerpróba → legacy-transzfer → csapatbevezetés + C0–C7 audit`

Az elsődleges deliverable az agent-ready fejlesztési rendszer. Az alkalmazás nem öncélú termékdemó,
hanem a rendszer reprezentatív integrációs és acceptance tesztje. Minden modulnak ki kell mondania:

1. melyik [agent-ready checkpointot](../agent-ready-repo.md) építi;
2. milyen új megbízható képességet kap ettől a repo;
3. milyen alkalmazási bizonyíték validálja ezt a képességet.
4. mely része marad változatlan, ha másik modell vagy agent harness végzi a munkát.

## Közös shell és vizuális szerződés

A közös shell nem kötelező szó szerinti prózasablon. Azokat a komponenseket rögzíti, amelyekből a
résztvevő gyorsan felismeri, hol tart és mit kell bizonyítania:

- működő skip link, billentyűzetes fókusz és mobil tartalomjegyzék;
- teljes C0–C7 checkpoint strip, az aktuális állapot `aria-current="step"` jelölésével;
- why-first döntési doboz;
- konkrét `bad/incomplete → decision gap → corrected artifact → evidence` átalakítás;
- pontos gyakorlat-, done-, evidence-, hibamód- és Plan B-blokk;
- előző/következő modulnavigáció és „Vidd haza” mondat;
- hozzáférhető inline SVG `title`/`desc` párral és közvetlen, teljes statikus megfelelővel;
- light/dark, 320 px mobile, print/offline, no-JS és reduced-motion működés.

A szemantikai paletta hat szerepet különít el: **humán kapu, agent action, machine gate, artifact,
evidence és risk**. A szín mindig címkével és szerkezeti jellel együtt jelenik meg. Runtime Mermaid,
CDN-es diagram vagy széles körű animáció nem használható. Pedagógiai interakció kizárólag a későbbi
G5 kontextus-büdzsé és G7 C0–C7 önellenőrzés lehet, mindkettő teljes no-JS/print fallbackkel.

## Közös munkatér-szerződés

A gyakorlatok három testvérmappát használnak egy választott `workshop-lab/` könyvtárban:

- `workshop-source/` — ez a workshop-repo; innen olvasunk tananyagot, toolkitet és
  trainer-owned referencia-workloadot. Résztvevői feature-munka nem ide kerül.
- `participant-repo/` — a résztvevő saját, G1-ben létrehozott agent-ready repója; a
  spec, szabály, run log és saját alkalmazásbizonyíték itt verziózott.
- `workshop-evidence/` — lokális, privát bizonyítékok helye, amelyek nem valók publikus
  Git-repóba. Titok vagy valós ügyféladat ide sem kerülhet.

Minden parancs előtt ellenőrizd, melyik mappa az aktuális munkakönyvtár. A notebookok
explicit `cd` lépéssel jelzik, ha a végrehajtás másik repóba vált.

## Tervezett notebookok (modulonként)

| Fájl | Blokk |
|---|---|
| [`00-bevezeto.html`](00-bevezeto.html) | B0 — Agentikus fejlesztés alapjai és C0-diagnózis |
| [`01-greenfield-setup.html`](01-greenfield-setup.html) | G1 — Agent-ready alap és szállítópálya |
| [`02-spec-driven.html`](02-spec-driven.html) | G2 — Spec-vezérelt SDLC + BA-kapu |
| [`03-orchestrator-rug.html`](03-orchestrator-rug.html) | G3 — Orchestrátor + Repeat-Until-Good |
| [`04-rules-skills-hooks.html`](04-rules-skills-hooks.html) | G4 — Szabályok, skillek, hookok, projekt-memória |
| [`05-qa-e2e-token.html`](05-qa-e2e-token.html) | G5 — QA, e2e és a keretrendszer real-life acceptance tesztje |
| [`06-legacy-dotnet.html`](06-legacy-dotnet.html) | Legacy blokk — .NET / MS-SQL / TFS-Azure DevOps |
| [`07-team-adoption.html`](07-team-adoption.html) | Csapat operating model + 30/60/90 |

## Írási szabályok (minden notebookra kötelező)

1. **Nyelv:** magyar. Angol szakszó használható, de ami nem magától értetődő, annak szerepelnie kell a
   [fogalomtárban](../fogalomtar.md) — és az első előfordulásnál linkelni kell rá.
2. **Minden döntésnél a „miért" jár elöl.** Minden technológia- és módszertan-választásnál kötelező
   szerkezet (erre van a sablonban „decision box"):
   - **Az alapprobléma** — mit akarunk megoldani, mi fáj enélkül?
   - **A választásunk** — mit használunk / hogyan csináljuk?
   - **Miért ez?** — a konkrét indokok (agent-szempontból is: token, blast radius, típusosság…).
   - **Alternatívák** — mik a reális opciók, előnyök/hátrányok, és miért NEM azokat választottuk.
3. **Minden gyakorlathoz:** cél → lépések → „kész, ha…" (done-kritérium) → tipikus elakadások.
4. **Kód és AI-instrukció angolul** — a magyarázó szöveg magyar, a kódblokkok, promptok, `AGENTS.md`
   idézetek angolok (nyelvi politika: a modellek angolul a leghatékonyabbak).
5. **Önálló fájl** — a notebook egyetlen HTML, külső függőség nélkül (CSS és opcionális shell-JS
   inline); no-JS módban minden tanítási tartalom és vizuális jelentés elérhető.
6. **Vizuális szerződés** — minden vizuál a [`visual-contract.md`](visual-contract.md) szemantikai
   palettáját, SVG/fallback szabályát és render-mátrixát követi. A szín önmagában nem jelentés.

## Kötelező reviewer-checklist

A material-reviewer ugyanebből a listából dolgozik; ne találjon ki futásonként új minőségi lécet:

- Minden mély fogalom előbb magyar mérnöki jelentést és .NET/C#/MS-SQL analógiát kap, és csak utána
  TypeScript/Next.js részletet.
- A modulnak egy világos tanítási eredménye és egy rövid „Vidd haza” mondata van.
- Minden gyakorlat tartalmaz célt, lépéseket, done-kritériumot és tipikus elakadást vagy Plan B-t.
- A szöveg nem használ hype-ot, nem állít forrás nélküli történetet, számot vagy eredményt.
- A résztvevői magyarázat magyar; a kód, prompt és AI-instrukció angol.
- A publikus anyag csak kitalált mintaadatot tartalmaz; nincs benne ügyfél-, személyes, kereskedelmi
  vagy hozzáférési adat.
- A modul visszakapcsol az agent-ready ívhez: AI mint vezetendő junior, spec mint munkaszerződés,
  kontextusfegyelem, mechanikus garanciák, független review és legacy-adaptáció.
- A notebook önállóan renderelhető, a belső linkek érvényesek, és nincs benne sablon-placeholder.
- A checkpoint strip, decision box, worked transformation, exercise/evidence/Plan B és modulhandoff
  szemantikája megvan; nem csupán azonos című üres kártyák szerepelnek.
- Minden SVG-nek van `role="img"`, egyedi `title` + `desc`, látható címke, megfelelő light/dark
  kontraszt és közvetlen táblázatos vagy rendezett prózai megfelelője.
- A skip link, fókusz, mobil, no-JS, reduced-motion, print és offline ellenőrzés ugyanazon commiton
  megtörtént. A strukturális validator nem helyettesíti a valós böngészős review-t.

## Kötelező ellenőrzések

A négy mechanikus validátort a repó gyökeréből kell futtatni. Egy fájl célzott ellenőrzéséhez add át
annak útvonalát; integrációkor argumentum nélkül a teljes tracked anyagot vizsgáld:

```powershell
node toolkit/hooks/check-placeholders.mjs materials/notebooks/<module>.html
node toolkit/hooks/check-notebooks.mjs materials/notebooks/<module>.html
node toolkit/hooks/check-public-content.mjs materials/notebooks/<module>.html
node toolkit/hooks/check-links.mjs materials/notebooks/<module>.html
```

A render-review evidence-e tartalmazza a commit SHA-t, böngésző/verziót, desktop és 320–390 px
viewportot, light/dark témát, billentyűzetet, no-JS-t, reduced motiont, nyomtatási/PDF és offline
eredményt. A részletes mátrix a [`visual-contract.md`](visual-contract.md#6-szerzői-és-review-ellenőrzés)
fájlban található.

> A notebookok kettős célt szolgálnak: a tréner felkészülési háttéranyaga ÉS a hallgatók által
> elvihető tananyag — ezért a döntés-magyarázatok nem opcionálisak, hanem a tananyag lényegi részei.
