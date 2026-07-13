# Design guideline — Precision Workshop Console

**Status:** accepted visual system (Direction A v3, human ACCEPT under WEN-311)

**Source of truth for look & feel:** [`docs/design/mock-direction-a.html`](docs/design/mock-direction-a.html)
**Binding behavior/scope contract:** [`docs/design/v0-design-brief.md`](docs/design/v0-design-brief.md) §8

The reference app looks like a **precision engineering instrument**: a dark ink
chassis (header/footer) framing a warm paper work deck with a faint blueprint
grid. Status reads like an instrument panel — engraved mono micro-labels,
small glowing lamps, amber "keycap" actions. Calm, not cyberpunk.

## 1. Design tokens

Tokens live in `src/app/globals.css` (`--console-*` palette, mapped onto the
shadcn variable names so existing primitives keep working).

| Token | Value | Usage |
|---|---|---|
| `--console-chassis` / `--shell` | `#14161c` | footer background; header uses a `#1d2028` → `#14161c` gradient (chassis-2 → chassis) |
| `--console-chassis-2` | `#1d2028` | chassis gradient top |
| `--console-seam` | `#3a3f4d` | chassis borders/dividers ("seams") |
| `--console-engrave` | `#8a8f9e` | engraved mono text on chassis |
| `--shell-foreground` | `#f3f4f7` | primary text on chassis |
| `--shell-muted` | `#aeb3c0` | inactive nav links on chassis |
| `--console-paper` / `--background` | `#f4f2ec` | page deck (carries the 28px blueprint grid) |
| `--console-paper-2` / `--card` | `#fbfaf6` | module/card surfaces |
| `--console-paper-edge` / `--border` | `#e2ddcd` | module/card borders |
| `--console-ink` / `--foreground` | `#1b1d22` | body text |
| `--console-muted` / `--muted-foreground` | `#5d6068` | secondary text (AA on paper) |
| `--console-amber` / `--primary` | `#ffb224` | keycap buttons, active lamps, active nav underline — **fills only, never text on paper** |
| `--console-amber-deep` / `--primary-text` / `--ring` | `#a05a00` | amber TEXT on paper (AA), focus outlines |
| `--console-amber-glow` | `rgba(255,178,36,.35)` | lamp glow, current-station halo |
| `--console-ok` | `#2f9e6e` | green lamps (fills) |
| `--console-ok-deep` / `--success` | `#1d7a52` | green TEXT (AA), certificate frame |
| `--console-bad` / `--destructive` | `#d64545` | error text, danger buttons |
| `--radius` | `0.625rem` | base radius (modules 10px, stations 9px, chips/buttons 8px) |

## 2. Typography roles

| Role | Stack | Usage |
|---|---|---|
| Display (`--font-console-disp`, `font-heading`) | Segoe UI Variable Display → Segoe UI → Geist → system-ui | h1–h3, module titles, card titles, station names; tight tracking (`-0.02em`-ish), weight 700–750 |
| Text (`--font-console-text`, `font-sans`) | Segoe UI Variable Text → Segoe UI → Geist → system-ui | body copy, buttons, form values |
| Mono (`--font-console-mono`, `font-mono`) | Cascadia Code → JetBrains Mono → Geist Mono → Consolas | micro-labels, numbers, ledger values, proof strip — **never body copy** |

Geist (next/font) stays loaded as the cross-platform fallback. Numbers are
always mono with `tabular-nums`. Page h1 ≈ `text-3xl…5xl` bold; a mono
breadcrumb (`.crumb`, e.g. `REF-LAB/03 · CROSS-SLICE JOURNEY`) sits above every
h1; a one-sentence `.lede` sits below it.

## 3. Spacing rhythm

- Blueprint grid module: **28px**; content aligns loosely to it.
- Page container: `max-w-6xl`, `px-4 sm:px-6`, `py-8 sm:py-10`.
- Vertical beats: h1 block → rail/chips/first module ≈ `mt-6`–`mt-7`; sibling
  modules ≈ `mt-4`; inside modules `mod-body` padding ≈ `1.35rem 1.4rem 1.5rem`.
- Form grids: `gap-4`, two columns from `sm`.
- Minimum interactive target: `min-h-11` (44px) on all primary controls.

## 4. Component patterns

### Instrument module (`.mod` / `.mod-head` / `.mod-body` + lamps)
The basic building block. Paper-2 surface, 10px radius, inset highlight +
soft drop shadow. The **header plate** (`.mod-head`) is a warm gradient strip
with a mono uppercase tag left (`.mod-tag`, e.g. `STEP 03 · QUOTE`) and a
status readout right (`.mod-stat`): a `.dotlamp` (+ `-ok`/`-amber`/`-bad`)
**always paired with a text state** (PASS / NOW / QUOTED / PROTECTED / ERROR /
n RECORDS). Lamp states must mirror real query/mutation state.

### Calibration rail (`.rail` / `.station`, `src/modules/orders/ui/journey-rail.tsx`)
Four stations under a ruler-tick strip (`.rail::before`, desktop only).
States: `station-done` (green border, check icon, DONE/…), `station-now`
(amber border + glow halo, pulsing lamp, `aria-current="step"`),
`station-lock` (dashed border, 0.62 opacity, lock icon, `LOCKED · <visible
reason>`). Never color-only: index + icon + mono status word carry the state.

### Catalog card (`.wcard`)
Hazard-stripe top band (amber repeating gradient), mono kind label, display
title, dashed-underline meta rows (label left, mono value right), large mono
price + small currency, amber keycap `Select & continue` pinned to the bottom.

### Summary chip (`.chip`)
Completed wizard steps collapse into green-bordered chips: `✓` + mono label
column + bold value + a right-aligned underlined `Change` action (disabled
with a reason once payment is authorized). Chips are the wizard's memory —
earlier steps never stay expanded.

### Certificate (`.cert` / `.ledger`)
Journey ending: 2px `--console-ok-deep` frame, faint green-to-paper gradient,
rotated `VERIFIED` stamp (decorative, `aria-hidden`), display heading with a
green lamp, and a dashed-row ledger (mono keys left, mono values right):
workshop, attendee, price, payment auth, registration status. Actions:
keycap restart + white/red `Cancel registration` + mono cancel-window note.

### Buttons
- **Keycap** (`.keycap`): the one primary action per context. Amber gradient,
  `#3a2500` text, 3D shadow stack (`0 2px 0 #b97e12` + glow); pressing
  translates 1px down and shortens the shadow.
- **Plate** (`.btn-plate`): secondary. White, `#d8d3c4` border; hover =
  amber-deep border.
- **Danger plate** (`.btn-danger`): destructive. White, red text, pale red
  border — visually distinct, never presented as the primary next action.
- **Back link** (`.back-link`) and **chip change** (`.chip-chg`): underlined
  text buttons.
- Small row variant: add `.btn-sm` (table Edit/Delete).

### Chassis bar & proof strip (`src/components/ui/site-header.tsx` / `site-footer.tsx`)
Header: wordmark plate (amber lamp + display wordmark + engraved mono
subtitle, seam border on the right), nav links with 2px amber underline +
subtle amber wash for the active route, mono `INVENTED TRAINING DATA` badge.
Footer: ink strip of mono `LABEL value` pairs (golden path, gates, review).

## 5. Interaction language

- **States are text-first**: DONE / NOW / LOCKED / QUOTED / AUTHORIZED /
  CONFIRMED / CANCELLED in mono caps; lamps and colors only reinforce.
- Locked things say **why** ("LOCKED · SELECT A WORKSHOP").
- Pending mutations rename their control ("Authorizing…", "Creating…",
  "Saving…") and disable it — never spinner-only.
- Errors render as `role="alert"` rows with the warn glyph and the real
  server message; honest limits stay visible (e.g. "the local demo also runs
  signed out", "No card, no charge").
- Every wizard state derives from an existing query/mutation; UI-only state
  is limited to navigation (selected workshop, account acknowledgement).

## 6. Responsive rules

- Mobile-first from **360px**; desktop/projector target 1440px.
- The rail stacks to one column below `md` (ruler ticks hidden); stations keep
  their full text states.
- Catalog cards: single column below `md`, three columns at `md+`.
- The workshops table is `md+` only; below it renders labeled stacked cards
  (dt/dd pairs), never a shrunken six-column table.
- Forms: single column on mobile, two columns from `sm`.
- Header nav wraps to its own scrollable row on narrow screens; no page-level
  horizontal scrolling anywhere.

## 7. Accessibility expectations

- AA contrast: on paper use `--primary-text` (not raw amber), `--success`
  (not raw green), `--muted-foreground` ≥ 4.5:1.
- Visible focus: 2px amber-deep outline (offset 2) on custom controls; shadcn
  ring on primitives; skip-link to `#main-content`.
- Semantic landmarks and heading order preserved; the rail is an `<ol>` with
  `aria-current="step"`; tables keep real table semantics; labels are real
  `<label htmlFor>`.
- Status never by color alone (lamp + icon + text word).
- `role="alert"` for errors; keyboard operability for every journey action.
- Reduced motion: the lamp pulse and skeleton pulse run only under
  `prefers-reduced-motion: no-preference` / `motion-safe:`.

## 8. Webshop journey addendum (WEN-324)

**Accepted mock:** [`docs/design/mock-webshop-journey.html`](docs/design/mock-webshop-journey.html)
(5 screens: catalog → product detail → cart → checkout → confirmation).
New patterns introduced by the shop rebuild — all in `src/app/globals.css`,
components in `src/modules/orders/ui/`:

### Price block (`.price` / `.price-net` / `.price-gross`)
The ONE way a price appears: big mono net amount with a mono
`NET [/ SEAT] + 27% VAT` micro-label inside, gross amount on a second line
(`Gross <b>12,700 HUF</b> / seat`). Rendered only by `PriceBlock`
(`ui/price-block.tsx`); the gross always comes from the orders domain's
`grossFromNet` (half-up, same rounding as the totals) — never recomputed
ad hoc.

### Qty stepper (`.qty` / `.qty-val`)
Minus / mono value / plus, clamped 1–5 (`MAX_SEATS_PER_WORKSHOP`). Buttons
are 44px targets with inset amber-deep focus; the value is an `<output>`
with an explicit aria-label ("seats for &lt;title&gt;"). Above the cap the
UI never negotiates — the amber `.hintbox` points at the custom group offer.

### Cart line (`.cartline` / `.cartline-t` / `.cartline-lp`)
Grid row: title block (title + mono date · net/seat small line), qty
stepper, right-aligned mono line-net with a small "net" suffix, and a red
underlined Remove text button. Single column below `sm`, dashed row
separators like the ledger.

### Summary box (`.sumbox` / `.sumrow` + `-disc` / `-grand`)
White plate with mono key/value rows (net subtotal, optional green coupon
discount row, VAT, gross). The grand row sits on a 2px ink rule with a
1.45rem mono gross. Values are ALWAYS the server's `orders.preview` answer —
the client renders totals, it never adds numbers up.

### Switch row (`.switch-row`) and boxes (`.hintbox` / `.okbox`)
Labelled checkbox on a white plate (company mode toggle) with amber-deep
accent-color; `.hintbox` is the amber dashed advisory (seat cap), `.okbox`
the green reassurance (guest checkout / account optional).

### Five-station rail (`.rail-5`)
The shop rail adds a fifth station (Cart → Your details → Billing →
Payment → Done). On the checkout screen stations 02 and 03 are BOTH
current; `aria-current="step"` goes to the first of them only
(`ui/journey-rail.tsx`).

## 9. Rejected patterns (do not reintroduce)

- **Generic shadcn default look** — neutral gray tokens, default cards, Geist
  everywhere with no visual voice.
- **Stacked always-visible panels** — every step expanded at once on /shop;
  completed steps must collapse into summary chips and locked steps must
  read as locked.
- **Color-only status** — a green/red dot or border without a text state.
- **Neon / terminal cosplay** — glowing gradients on dark cards, scanlines,
  all-mono screens. The chassis is dark; the work surface is paper.
- **Tiny mono body text** — mono is for micro-labels and numbers only; body
  copy stays sans at ≥ 0.9rem.
- **Fabricated instrument data** — no invented "seats left", uptime, adapter
  names or timestamps; a readout may only show what a real query returned.
