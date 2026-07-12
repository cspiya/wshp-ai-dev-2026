# Építési napló — a módszer bizonyítékai

Ez nem státusz- vagy handoff-mappa. A mindenkori munkaállapot a Linear issue-kban,
[lease kommentekben](../fogalomtar.md) és commitokban él. A napló azt mutatja meg, **mit bizonyított az adott építési nap**,
és különválasztja a 🧑 humán hurkot a 🤖 agent huroktól.

**Indulás:** [tananyag-navigátor](../README.md) · [webes naplóindex](index.html) ·
[big picture](../big-picture.md) · [fogalomtár](../fogalomtar.md)

## Olvasási sorrend

| Nap | Fókusz | Mit bizonyított? | Folytatás |
|---|---|---|---|
| [Day 1](day-1.md) | első teljes [RUG-kör](../fogalomtar.md) | A zöld pipeline nem jelent kész állapotot; friss review és regressziós védelem is kell. | Day 2: erősítsük meg az architektúra- és teszthatárokat. |
| [Day 2](day-2.md) | portok, adapterek és teszt-double-ok | A teszt csak akkor bizonyít, ha ugyanazt a szerződést kéri számon a helyettesítőn és a valós adapteren. | Day 3: vigyük végig az élő delivery-láncot. |
| [Day 3](day-3.md) | élő preview/DB/E2E és működési szerződés | Az infrastruktúra döntések lánca; a munkaállapot a trackeré, nem egy kézi handoff-fájlé. | Day 4: tegyük futtathatóvá a RUG-ot és a standardokat. |
| [Day 4](day-4.md) | gépi RUG, verifikált findingok | A builder beszámolója és a reviewer findingja is állítás: a leszállított állapotból kell ellenőrizni. | A következő build-nap új `day-N.md` issue-val és azonos szerkezettel készül. |

## Hogyan olvasd?

1. Nézd meg a nap eleji Mermaid-ábrát: ez a folyamat tömör térképe.
2. Olvasd el a szintézist: ez mondja ki, mit bizonyított a nap.
3. Tartsd külön a 🧑 humán-loop és 🤖 agent-loop tanulságait.
4. Csak szükség esetén nyisd le az esettár részleteit.

Offline olvasáshoz klónozd a repót; a Markdown-fájlokat az editor előnézetében, ezt a landinget pedig
a `materials/epitesi-naplo/index.html` megnyitásával éred el.
