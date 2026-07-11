# Tananyag-notebookok

A workshop moduljainak tananyaga **magyar nyelvű, önálló HTML-notebook** formában készül (a bevált
sablon: `_template.html` — sidebar + tartalomjegyzék + hero). A notebookokat a GitHub Pages szolgálja ki
weboldalként, és a repóból offline is megnyithatók.

## Kötelező fő gondolatmenet

Minden notebook ugyanannak a rendszernek egy következő képességét építi:

`üres repo → agent-ready működés → spec-kapu → RUG → mechanikus garanciák → real-life rendszerpróba → modell-/eszközcserélhetőség`

Az elsődleges deliverable az agent-ready fejlesztési rendszer. Az alkalmazás nem öncélú termékdemó,
hanem a rendszer reprezentatív integrációs és acceptance tesztje. Minden modulnak ki kell mondania:

1. melyik [agent-ready checkpointot](../agent-ready-repo.md) építi;
2. milyen új megbízható képességet kap ettől a repo;
3. milyen alkalmazási bizonyíték validálja ezt a képességet.
4. mely része marad változatlan, ha másik modell vagy agent harness végzi a munkát.

## Tervezett notebookok (modulonként)

| Fájl | Blokk |
|---|---|
| `00-bevezeto.html` | B0 — Agentikus fejlesztés alapjai, eszközök, gazdaságosság |
| [`01-greenfield-setup.html`](01-greenfield-setup.html) | G1 — Saját repo + CI + Vercel preview + Neon DB-branch |
| `02-spec-driven.html` | G2 — Spec-vezérelt SDLC + BA-kapu |
| `03-orchestrator-rug.html` | G3 — Orchestrátor + Repeat-Until-Good |
| `04-rules-skills-hooks.html` | G4 — Szabályok, skillek, hookok, projekt-memória |
| `05-qa-e2e-token.html` | G5 — QA, e2e és a keretrendszer real-life acceptance tesztje |
| `06-legacy-dotnet.html` | Legacy blokk — .NET / MS-SQL / TFS-Azure DevOps |
| `07-team-adoption.html` | Csapat operating model + 30/60/90 |

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
5. **Önálló fájl** — a notebook egyetlen HTML, külső függőség nélkül (a sablon CSS-e inline).

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

> A notebookok kettős célt szolgálnak: a tréner felkészülési háttéranyaga ÉS a hallgatók által
> elvihető tananyag — ezért a döntés-magyarázatok nem opcionálisak, hanem a tananyag lényegi részei.
