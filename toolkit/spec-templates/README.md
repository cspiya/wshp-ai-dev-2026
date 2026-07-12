# Spec-first munkacsomag — BA + fejlesztő

Ez a könyvtár egyetlen, ismételhető átadási lánc:

`constitution → specify → plan → tasks → implement → verify`

A BA magyarul tisztázza a szándékot és a példákat. A repóba kerülő technikai
szerződés, acceptance scenario, prompt és kód angol. Az implementáció csak lezárt
spec-kapu után indulhat.

## Miért ez a sorrend?

- A **constitution** rögzíti a nem alku tárgyát képező szervezeti és repó-szabályokat.
- A **spec** a kérést megfigyelhető, jóváhagyható munkaszerződéssé alakítja.
- A **plan** a jóváhagyott viselkedésből készít technikai megközelítést.
- A **tasks** kis, tulajdonolt és külön ellenőrizhető munkadarabokra bont.
- Az **implement** lépés kizárólag jóváhagyott szerződésből dolgozik.
- A **verify** az acceptance criteriát futtatott evidence-hez köti.

A sorrend megakadályozza, hogy egy korai technikai ötlet csendben üzleti döntéssé
váljon. Alternatíva lenne egyetlen hosszú prompt vagy tasklista, de azok nem választják
szét a szándék, a döntés, a végrehajtás és a bizonyítás felelősségét.

## 35 perces páros labor

### Cél

Egy kitalált workshop-regisztrációs igényt lezárt C3 spec-kapuig vinni. A labor
**nem** implementációs verseny: a kész eredmény az elfogadott munkaszerződés.

### Lépések

1. Olvassátok el a repó instrukcióit és töltsétek ki a [constitution](constitution.md)
   projekt-specifikus részeit.
2. A BA mondja el magyarul a szándékot: „A résztvevő lemondhassa a saját, megerősített
   regisztrációját, de a kezdés előtti 24 órában már ne változzon az állapot.”
3. Együtt töltsétek ki a [spec](spec.md) problémáját, scope-ját, szereplőit és nyitott
   döntéseit. Ne írjatok még implementációt.
4. Fordítsátok a példát angol, megfigyelhető scenario-vá a
   [Given–When–Then sablonnal](given-when-then.md).
5. Minden `Then` mellé rendeljetek evidence-et. Ha hiányzik üzleti döntés, írjátok:
   `DECISION REQUIRED — <owner> — <deadline>`.
6. Egy fejlesztő vagy agent mondja vissza a contractot, de ne tervezzen megoldást.
7. A BA/product owner töltse ki a spec gate decision részt:
   `APPROVED`, `CHANGES REQUESTED` vagy `BLOCKED`.
8. Csak `APPROVED` után készítsetek [plant](plan.md), majd
   [taskbontást](tasks.md). A workshop-labor itt, a lezárt kapu bizonyítékával véget ér.

### Kész, ha

- a constitution ismert és nincs vele ellentétes spec;
- a probléma, in/out scope, szereplő, boundary és hibaág egyértelmű;
- legalább egy happy-path és egy negatív scenario angolul, tesztelhető formában áll;
- minden acceptance criterionhoz evidence tartozik;
- nincs gazdátlan `DECISION REQUIRED`;
- a humán kapudöntés névvel, időponttal és contract-verzióval visszakereshető.

### Evidence-csomag

A lezárt csomag neve: `C3-APPROVED-CONTRACT`. Tartalma:

- constitution és spec verzió/link;
- acceptance criteria és scenario-k;
- bounded scope és stabilan tartandó contractok;
- tervezett automatizált és kézi evidence;
- humán gate decision;
- ismert maradó kockázat.

### Tipikus elakadások és Plan B

- **Nincs elérhető BA/owner:** a kapu `BLOCKED`; rögzítsetek ownert és következő
  döntési időpontot. Implementáció nem indul.
- **A scope túl nagy:** válasszatok egyetlen végigérő üzleti viselkedést; a többi
  kerüljön out-of-scope-ba.
- **Az agent megoldást tervez:** állítsátok le; kérjetek kizárólag contract-visszafoglalást
  és döntési réseket.
- **Nincs futtatható környezet:** nevezzétek meg a várt parancsot és kézi evidence-et;
  a következő fázis trainer-owned referencia-workloadon is demonstrálható.
- **Nem értetek egyet:** ne rejtsetek kompromisszumot a szövegbe; rögzítsetek
  `DECISION REQUIRED` sort opciókkal és hatással.

## Átadási szabály

Minden fázis csak verziózott bemenetet vehet át, és megnevezett kimenetet ad:

| From → to | Required input | Handoff output |
|---|---|---|
| Constitution → Specify | approved invariants | bounded product contract |
| Specify → Plan | `C3-APPROVED-CONTRACT` | implementation approach + risks |
| Plan → Tasks | approved plan version | owned, ordered, verifiable tasks |
| Tasks → Implement | task + spec + standards | change + exact check evidence |
| Implement → Verify | diff/artifact + evidence | AC verdict + findings + residual risk |

Ha a required input hiányos vagy elavult, a következő fázis nem találgat: visszaadja az
előző kapunak.
