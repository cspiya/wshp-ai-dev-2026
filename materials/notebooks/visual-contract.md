# Notebook visual contract

Ez a fájl a workshop-notebookok közös vizuális és hozzáférhetőségi szerződése. A
[`_template.html`](_template.html) a futtatható referencia; a
[`README.md`](README.md) az írási és review-folyamatot rögzíti. A modul szerzője ezekből
indul, de a résztvevői magyarázatot nem másolja mechanikusan.

## 1. Vizuális nyelvtan

Egy vizuál csak akkor kerülhet notebookba, ha gyorsabban mutat meg kapcsolatot, sorrendet,
határt vagy állapotváltozást, mint egy rövid bekezdés. A szín soha nem hordozhat egyedül
jelentést: minden elem kap szöveges címkét, alakot vagy sorrendi jelet.

| Jelentés | CSS token | Kötelező címke | Mire használd? |
|---|---|---|---|
| humán döntési kapu | `--human`, `--human-soft` | `Emberi döntési kapu` | jóváhagyás, scope- vagy BA-döntés |
| agent action | `--agent`, `--agent-soft` | `Agent action` | bounded készítés vagy javítás |
| machine gate | `--machine`, `--machine-soft` | `Machine gate` | parancs, check, exit code |
| artifact | `--artifact`, `--artifact-soft` | `Artifact` | spec, terv, diff, run log |
| evidence | `--evidence`, `--evidence-soft` | `Evidence` | bizonyíték, trace, reprodukálható eredmény |
| risk | `--risk`, `--risk-soft` | `Kockázat / Plan B` | döntési rés, elakadás, residual risk |

A tokenek világos, sötét és nyomtatási témában is értelmezhetők. Új, lokális szín csak
akkor adható hozzá, ha egyik szemantikai szerep sem igaz rá, és a reviewer a kontrasztot
mindkét témában ellenőrizte. Szöveghez legalább 4.5:1, nagy szöveghez és jelentést hordozó
grafikai vonalhoz legalább 3:1 kontraszt kell a közvetlen háttérhez képest.

## 2. Kötelező szerkezeti komponensek

Minden modul tartalmazza az alábbi mintákat; a címsor megfogalmazása változhat, a jelentés nem.

1. **Checkpoint strip:** C0–C7 teljes sor, az aktuális elem `aria-current="step"` jelöléssel;
   mellette előfeltétel, új képesség, artifact, evidence és következő checkpoint.
2. **Why-first decision box:** alapprobléma → választás → miért ez → valódi alternatívák és
   trade-offok. Az agent nem adhat magának humán jóváhagyást.
3. **Worked transformation:** konkrét `bad/incomplete → decision gap → corrected artifact →
   evidence`. Négy összefoglaló címke önmagában nem végigdolgozott példa.
4. **Exact exercise:** cél, előfeltétel, working directory, input, sorszámozott műveletek,
   output, done-kritérium, tipikus hibák, Plan B és pontos evidence-hely.
5. **Module handoff:** előző/következő navigáció és annak kimondása, mit kap a következő modul.
6. **Vidd haza:** egy eszközfüggetlen takeaway-mondat.

## 3. SVG-szerződés és statikus megfelelő

Az alapértelmezett diagram önálló inline SVG/CSS. Külső font, script, CDN vagy runtime Mermaid
nem használható.

```html
<figure>
  <svg viewBox="0 0 800 240" role="img" aria-labelledby="flow-title flow-desc">
    <title id="flow-title">A diagram rövid állítása</title>
    <desc id="flow-desc">Az elemek, a sorrend és a kapcsolat teljes szöveges leírása.</desc>
    <!-- Minden elem látható szöveges címkét és szemantikai tokent kap. -->
  </svg>
  <figcaption>Mit kell észrevenni a diagramon?</figcaption>
  <table class="static-fallback">
    <caption>Az SVG teljes szemantikai megfelelője</caption>
    <!-- Ugyanazok az állapotok és kapcsolatok, nem rövidebb összefoglaló. -->
  </table>
</figure>
```

Kötelező:

- egyedi `title`- és `desc`-azonosító, amelyet az `aria-labelledby` pontosan hivatkozik;
- látható címke minden jelentést hordozó node-on és élen;
- azonnal mellette táblázat vagy rendezett próza, amely SVG és szín nélkül is ugyanazt jelenti;
- rugalmas `viewBox`, `width: 100%`, olvasható mobil tördelés és nyomtatási törésvédelem;
- light/dark kontrasztmérés és billentyűzetes ellenőrzés, ha az ábra linket tartalmaz.

## 4. Interakciós döntés

Az első kiadásban pontosan két pedagógiai interakció engedélyezett:

1. G5 kontextus-büdzsé szimulátor;
2. G7 végső C0–C7 önellenőrzés.

Minden más modulvizuál statikus. A mobil menü és a scroll-spy shell-viselkedés, nem pedagógiai
interakció. Az engedélyezett két interakció is csak akkor fogadható el, ha billentyűzettel
használható, reduced-motion kompatibilis, és no-JS/nyomtatási módban teljes statikus táblázat
adja ugyanazt az információt és kitöltési lehetőséget.

## 5. Hozzáférhetőségi és megjelenítési minimum

- A dokumentum első fókuszálható eleme működő skip link a `main` tartalomhoz.
- Minden interaktív elem natív `button` vagy `a`, látható `:focus-visible` állapottal.
- A mobil navigáció `aria-controls` és frissített `aria-expanded` állapotot használ.
- No-JS módban a tartalom és a navigáció látható; a script csak kényelmi réteget ad.
- `prefers-reduced-motion: reduce` kikapcsolja a sima görgetést, animációt és érdemi átmenetet.
- 320 px szélességen nincs levágott próza; széles táblázat/strip kontrolláltan görgethető.
- Nyomtatáskor eltűnik a shell-navigáció, a tartalom fekete-fehérben is érthető, a kártyák,
  ábrák és táblák nem törnek értelmetlenül ketté, a külső linkek célja látható.
- Offline megnyitáskor nincs külső függőség vagy hálózati hívás.

## 6. Szerzői és review-ellenőrzés

A változtatott notebookokra, a repó gyökeréből:

```powershell
node toolkit/hooks/check-placeholders.mjs materials/notebooks/<module>.html
node toolkit/hooks/check-notebooks.mjs materials/notebooks/<module>.html
node toolkit/hooks/check-public-content.mjs materials/notebooks/<module>.html
node toolkit/hooks/check-links.mjs materials/notebooks/<module>.html
```

A mechanikus PASS nem vizuális PASS. A reviewer a tényleges commitot nyissa meg valós böngészőben,
és jegyezze fel:

| Mód | Ellenőrizendő |
|---|---|
| desktop light + dark | olvasási sorrend, paletta, SVG-címkék, 200% zoom |
| 320–390 px mobile | menü, fókusz, vízszintes overflow, táblázat/strip |
| keyboard | skip link, logikus tab-sorrend, látható fókusz, menüállapot |
| no-JS | minden tanítási tartalom és statikus fallback elérhető |
| reduced motion | nincs jelentést hordozó mozgás vagy sima görgetési kényszer |
| print/PDF | kártyák és checkpointok nem szakadnak; linkcélok és fallback látszanak |
| offline | nincs hibás külső asset vagy hálózatfüggő működés |

A Linear trace tartalmazza a commit SHA-t, böngésző/verziót, viewportot, light/dark/print/no-JS
eredményt, a futtatott parancsokat és minden nyitva hagyott vizuális kockázatot.
