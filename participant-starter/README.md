# Résztvevői starter — a saját weboldalad kiindulópontja

Ez a **Wenova AI-Assisted Development Workshop** résztvevői sablonja: egy
szándékosan minimális **Next.js (App Router) + TypeScript + Tailwind +
shadcn/ui** projekt. A nap során ebből építed fel a **saját weboldal-ötleted**
— nulláról, AI-agenttel (Claude Code), spec-vezérelt folyamattal.

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

3. Nyisd meg a `src/app/page.tsx`-et — ez a kezdőoldalad. Mentés után a
   böngésző azonnal frissül.

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | fejlesztői szerver |
| `npm run typecheck` | típusellenőrzés (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (egy minta-teszt már van) |
| `npm run build` | éles build — a Vercel is ezt futtatja |

## Fontos fájlok

- **`AGENTS.md`** — a "szabálykönyv a gépeknek": ezt olvassa be minden
  agent-futás. A workshopon folyamatosan bővítjük.
- **`DESIGN-GUIDELINE.md`** — a dizájn-szabálykönyv váza; az agent minden
  UI-munkánál ezt követi. A nap során töltöd fel.
- **`src/components/ui/`** — shadcn/ui komponensek (helyi forráskód — az agent
  olvashatja és szerkesztheti). Újat így adsz hozzá:
  `npx shadcn@latest add <komponens>`.
- **`.env.example`** — még üres; a `DATABASE_URL` a nap adatbázis-blokkjában
  kerül ide.

## Ha elakadsz

- Szakszavak: [fogalomtár](../materials/fogalomtar.md)
- Felkészülés / telepítés: [setup-guide](../materials/setup-guide.md)
- Napirend: [agenda](../materials/agenda.md)
