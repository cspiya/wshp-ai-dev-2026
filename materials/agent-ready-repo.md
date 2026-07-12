# Az agent-ready repo — a workshop elsődleges terméke

> **Nem egy webalkalmazást építünk AI-val. Felépítünk egy megbízható AI-assisted fejlesztési
> rendszert, majd egy valószerű alkalmazás fejlesztésével bizonyítjuk, hogy működik.**

## A két kézzelfogható eredmény

| Eredmény | Szerepe | Mikor tekintjük késznek? |
|---|---|---|
| **Agent-ready fejlesztési rendszer** | Ez a workshop elsődleges, hazavihető terméke. | Egy új agent ellenőrizhetően végig tud vinni vele egy változtatást specből validált eredményig. |
| **Real-life validációs workload** | Az alkalmazás a rendszer integrációs és acceptance tesztje. | Valódi üzleti szabályon, modulhatáron, adaton, hibán és deployment-úton is bizonyítja a működési modellt. |

Az alkalmazás tehát nem díszlet, de nem is a végcél. Olyan reprezentatív terhelés, amelyen kiderül, hogy
a fejlesztési rendszer nemcsak papíron szép, hanem tényleges szoftverfejlesztésre alkalmas.

## A modell végrehajtó, nem alapzat

Az agent-ready rendszer minőségét nem egy konkrét modell vagy coding tool „okosságára” bízzuk. A tartós
alap a repóban él: mission, standard, spec, szerepek, mechanikus gate-ek, RUG és evidence. A modell,
provider és agent harness ennek cserélhető végrehajtója.

Ez üzletmenet-folytonossági és fejlődési követelmény is. Váltani kellhet, mert:

- egy modell vagy szolgáltatás átmenetileg nem elérhető, kapacitás- vagy szabályozási korlátozás alá kerül;
- technikai hiba, rate limit vagy egy eszközintegráció kiesése akadályozza a munkát;
- a jelenlegi modell ára, sebessége vagy tokenhatékonysága már nem megfelelő;
- megjelenik egy jobb modell, amelyre akár egy napon belül érdemes kontrolláltan átállni;
- egy részfeladathoz másik modell ad jobb minőség/költség/latencia arányt.

2026-ban mindkét irányra volt kézzelfogható példa: az Anthropic dokumentálta a Fable 5 és Mythos 5
[átmeneti hozzáférési felfüggesztését és visszaállítását](https://www.anthropic.com/news/redeploying-fable-5),
az OpenAI pedig július 9-én általánosan elérhetővé tette a
[GPT‑5.6 modellcsaládot](https://openai.com/index/gpt-5-6/). Ezek nem vendorválasztási ajánlások, hanem
annak bizonyítékai, hogy az elérhetőségi és képességkörnyezet napok alatt megváltozhat.

A váltás ezért nem hitkérdés és nem egyszerű modellnév-csere. Ugyanazon reprezentatív workloadon futtatott
eval: változatlan acceptance criteria, gate-ek és bizonyítékléc mellett összehasonlítjuk a sikerességet,
minőséget, költséget, latenciát és emberi review-terhelést. Csak a bizonyítottan jobb konfiguráció lesz új
alapértelmezés.

### Élő példa: ennek a workshopnak az elkészítése

Nemcsak a referenciaalkalmazást, hanem ezt a tananyagot is a tanított operating modellel készítjük:
feladatokra bontás, párhuzamos agentek, közös repó-instrukciók, handoff, friss kontextusú review, javítás,
mechanikus guardok és visszakereshető Git-történet. A tartalmi Definition of Done nem változik attól, hogy
melyik modell vagy eszköz írja az első változatot. Ez a workshop második, önmagára visszamutató validation
workloadja.

## Az egész nap egyetlen építési ív

```text
Üres repo
  → repo-identitás és határok
  → kanonikus szakmai standard + Definition of Done
  → spec / plan / tasks + humán kapu
  → maker / reviewer / fixer szerepek + RUG
  → determinisztikus hookok és CI-kapuk
  → real-life alkalmazás mint end-to-end rendszerpróba
  → modell- és eszközcsere ugyanazon minőségi léc mellett
  → legacy-transzfer ugyanazzal a biztonsági és evidence-léccel
  → csapatbevezetés, 30/60/90 terv és C0–C7 audit
  → bizonyítékcsomag és hazavihető operating model
```

## Checkpointok

### C0 — Üres repo

Van Git-repo és technikai alap, de még nincs közös cél, szabály, minőségi léc vagy bizonyítható „kész”.
Egy agent itt gyors lehet, de nem megbízható.

### C1 — A repo tudja, mi ő

- mission és scope;
- `AGENTS.md` / projekt-instrukció;
- nyelvi, adat- és publikus-repo szabályok;
- érinthető és tiltott területek;
- dokumentált valódi parancsok.

**Új képesség:** az agent nem találgatja a munkateret és a helyi szabályokat.

### C2 — Van közös szakmai léc

- egyetlen kanonikus engineering standard;
- Definition of Done;
- architekturális határok és golden path;
- a gépesíthető szabályokhoz lint/test.

**Új képesség:** maker és reviewer ugyanazt érti minőségen.

### C3 — A kérésből munkaszerződés lesz

- spec, plan és tasks;
- Given–When–Then acceptance criteria;
- in-scope / out-of-scope;
- humán BA/product validation gate;
- `DECISION REQUIRED`, ha az agentnek üzleti döntést kellene kitalálnia.

**Új képesség:** a változás implementálás előtt ellenőrizhető és jóváhagyható.

### C4 — Szétválik a szerző és a bíráló

- maker, fresh-context reviewer és fixer szerep;
- strukturált finding;
- deduplication és reprodukció;
- bounce-back fix + regressziós védelem;
- Repeat-Until-Good exit criteria és run log.

**Új képesség:** a zöld pipeline-on túli hibákat is keressük, a review-t pedig nem vakon követjük.

### C5 — A kötelező rész mechanikusan fut

- typecheck, lint, unit/contract/integration test;
- public-content guard;
- stop-check runner vagy CI fallback;
- negatív fixture, amely bizonyítja, hogy a kapu tényleg blokkol;
- pontos parancs- és exit-code evidence.

**Új képesség:** az agent nem tud puszta narrációval „kész” állapotot jelenteni.

### C6 — Real-life rendszerpróba

Az alkalmazás már reprezentatív összetettséget visz a rendszerbe:

- üzleti szabály és hibaág;
- több együttműködő vertical slice;
- perzisztencia és teszt-double;
- változó külső boundary fake adapterrel;
- preview deployment és izolált adat;
- böngészős E2E;
- független review által megtalált és regresszióval lezárt valódi hiba.

**Új képesség:** bizonyítékunk van rá, hogy a keretrendszerrel tényleges alkalmazást lehet fejleszteni.

### C7 — Hordozható operating model

- a következő feature már ugyanazt a rendszert használja;
- a toolkit másik repóba átvihető;
- a modell vagy agent harness reprezentatív eval után cserélhető a spec, DoD és gate-ek újraírása nélkül;
- a greenfield minta legacy környezetre leképezhető;
- a csapatnak van owner, mérce, trace és 30/60/90 bevezetési terve.

**Új képesség:** nem egyszeri workshop-trükköt, hanem ismételhető fejlesztési működést viszünk haza.

## Agent-ready Definition of Done

A repo akkor agent-ready a workshop szintjén, ha:

- egy új agent a repóban megtalálja a célt, scope-ot, szabályokat és valódi gate parancsokat;
- az üzleti változás jóváhagyott specből és acceptance criteriából indul;
- maker és reviewer ugyanazt a kanonikus standardot használja;
- a kötelező kapuk automatikusan futnak, és a blokkoló út tesztelt;
- a reviewer friss kontextusból dolgozik, findingjait bizonyítani kell;
- minden elfogadott findinghoz fix, újrafuttatott kapu és lehetőség szerint regressziós teszt tartozik;
- a real-life workload legalább egy teljes útja valódi futtatási környezetben is bizonyított;
- legalább egy kiválasztott feladaton bizonyított, hogy a minőségi léc nem egy modell-specifikus trükktől függ;
- a run logból visszakereshető a spec, döntés, parancs, finding, javítás és maradó kockázat.

## A workshop végső kérdése

Nem az, hogy „elkészült-e a weboldal?”, hanem:

> **Egy új, valós üzleti változtatást ugyanebben a repóban ismét végig tudnánk-e vinni a specifikációtól
> a függetlenül review-zott, valódi környezetben bizonyított eredményig?**

Ha a válasz bizonyítékokkal igen, a workshop elsődleges terméke elkészült.
