# Mérnöki standardok — egy forrásból, a készítőbe ÉS a bírálóba injektálva

*Wenova AI-Assisted Development Workshop — 2026.07 · tananyag a G4 modulhoz ·
a minta a saját belső multi-agent rendszerünk (Wenova Squad) éles tapasztalatából jön*

> Szakszavak: [fogalomtár](fogalomtar.md) · kapcsolódó: [pluginek és skillek](plugins-es-skillek.md)

---

## 🧠 Döntés-doboz: hová kerüljön a szakmai alapléc?

**Az alapprobléma (valós történet).** A belső multi-agent rendszerünkben a szakmai code-craft alapléc —
DRY, KISS, YAGNI, SOLID, clean code, elnevezések, clean-architecture függőségi irány, SRP — **sehol nem
volt a rendszer állandó működési szerződése**: a folyamat-doksik a governance-t fedték, a készítő-agent
promptja csak annyit mondott, „kövesd a cél-repo AGENTS.md-jét", a bíráló pedig projekt-specifikus volt.
Az eredmény: **az embernek feladatonként újra el kellett magyaráznia az alapokat** — és ami ennél rosszabb:
a készítő és a bíráló **más-más léc szerint** dolgozott, így a review nem azt kérte számon, amire a maker
épített.

**A választásunk.** Egy **kanonikus standard-blokk**, egyetlen forrásfájlban — és ez a blokk
**hivatkozással injektálódik minden készítő- ÉS minden bíráló-promptba** (a bírálóéba explicit
checklistként).

**Miért így?**
1. **Egy forrás = nincs drift.** Egy helyen szerkeszted, mindenhol érvényes — a maker, a reviewer és a
   gépi ellenőrzések (lint/fitness) ugyanazt a lécet látják.
2. **A bíráló csak akkor kéri számon, amit lát.** A friss kontextusú reviewer nem tudja, mi a házirend,
   ha nem kapja meg — a checklist-formában injektált standard teszi a review-t következetessé.
3. **Tömör a promptban, mély a doksiban.** A ~200-instrukciós plafon (lásd fogalomtár) miatt a promptba
   csak a priorizált, tömör blokk kerül; a teljes indoklás külön dokumentumban él (progressive
   disclosure).
4. **Ami gépileg ellenőrizhető, azt gép ellenőrizze.** A standard ellenőrizhető részhalmaza NEM a
   modellre bízva, hanem lintben/hookban is kikényszerítve — a prompt kérés, a mechanizmus garancia.

**Alternatívák (elvetve):**
- *„Benne van az AGENTS.md-ben, elég."* — Az AGENTS.md-t a **készítő** olvassa a repóban; a friss
  kontextusú **bíráló** subagent promptja külön él — ha oda nem injektálod, a bíráló a saját ízlése
  szerint ítél. (Pontosan ezt éltük meg.)
- *Feladatonként beírni a promptba kézzel.* — Ez a „feladatonként újra elmagyarázom" állapot, ami elől
  menekülünk; és a kézi másolatok azonnal driftelnek.
- *Mindent gépi szabályba (lint) tenni.* — A léc nagy része (naming-minőség, SRP-ítélet, YAGNI) nem
  automatizálható; a lint a részhalmazt fedi, a többihez modell-instrukció kell.

## A minta egy képben

```mermaid
flowchart TD
    SRC["📜 ENGINEERING_STANDARDS<br/>(EGY forrásfájl: tömör, priorizált blokk)<br/>+ külön mélységi doksi (miértek)"]
    SRC -- "injektálva a promptba" --> MAKER["🤖 KÉSZÍTŐ agent<br/>(builder / fixer)"]
    SRC -- "injektálva CHECKLISTKÉNT" --> REV["🔍 BÍRÁLÓ agent<br/>(reviewer / critic)"]
    SRC -- "ellenőrizhető részhalmaz" --> MECH["⚙️ GÉPI kapuk<br/>(lint, hookok, CI)"]
    MAKER --> OUT["munkadarab"]
    OUT --> REV
    REV -- "ugyanaz a léc<br/>= konzisztens ítélet" --> OUT
```

## Mit tartalmazzon a standard-blokk? (a minimál-készlet)

| Pillér | Egy mondatban |
|---|---|
| **DRY** | Ne ismételd — de ne is absztrahálj két használat előtt (a duplikáció olcsóbb, mint a rossz absztrakció) |
| **KISS / YAGNI** | A legegyszerűbb működő forma; semmit „későbbre" — funkció akkor épül, ha van fogyasztója |
| **SOLID, pragmatikusan** | Interfész csak ott, ahol a határ tényleg variálódik; egy implementáció ⇒ nincs interfész |
| **Clean code + elnevezés** | A kód a dokumentáció: kimondó nevek, kis függvények, nincs halott kód |
| **SRP / separation of concerns** | Egy modul egy okból változzon; a rétegek felelőssége nem keveredik |
| **Függőségi irány** | Befelé mutat (domain nem tud a külvilágról) — nálunk ezt lint is őrzi |
| **Definition of Done** | Mikor „kész": zöld kapuk + teszt + doksi + a bíráló jóváhagyása |
| **Eszkalációs formátum** | Ha az agent dönteni nem tud: strukturált „DECISION REQUIRED" visszaadás az embernek |

## Hogyan képződik le nálunk (Claude Code-ban)?

- **Készítő oldal:** a repo `AGENTS.md`-je az injektálási mechanizmus — minden agent-futás beolvassa.
  A standard-blokk oda kerül (tömören), a mélységi indoklás külön doksiba.
- **Bíráló oldal:** a review-agentek/subagentek prompt-sablonja **ugyanabból a forrásból** kapja a
  blokkot, explicit checklistként — a workshop toolkit-orchestrátora így épül (a bíráló nem „általában
  véleményez", hanem a lécet pipálja végig).
- **Gépi részhalmaz:** boundary-lint (feloldott útvonalak + regressziós tesztek), typecheck, tesztek —
  ami ellenőrizhető, az nem a modell jóindulatán múlik.

> **Vidd haza:** a szakmai léc nem "tudás, amit az agent majd magától alkalmaz", hanem **működési
> szerződés, amit minden szerepbe injektálsz** — egy forrásból, hogy a készítő, a bíráló és a gép
> ugyanazt a mércét lássa.
