# HANDOFF — session continuation point

> **Lifecycle rule:** there is always exactly ONE handoff file, here at the repo root. Whoever picks up
> the work OWNS this file: work from it, keep it updated as you go, and when you hand off, rewrite it
> for the next session (or mark it `> OBSOLETE` at the top if superseded). Do not create day-numbered
> or parallel handoff files.
>
> **This repo is PUBLIC.** Keep this file hygiene-clean: no client names, no pricing/offer details,
> no invite links, no personal data. Those live on the internal Drive (below).

*Last updated: 2026-07-10 · owner of next session: (take it over, put your marker here)*

---

## 1. What this is, in one paragraph

We are building the **Wenova AI-Assisted Development Workshop — 2026.07** (delivery: **2026-07-14**):
a public repo with participant materials (`materials/`, Hungarian), a take-home toolkit (`toolkit/`),
a participant starter (`participant-starter/`), and a reference app (`reference-app/` — a training
mini-webshop: workshops CRUD ✅, then auth + registrations + pricing + checkout). We build it **with the
method we teach** (dogfooding): Linear issue = spec → builder agent → independent multi-angle RUG review
→ bounce-back fix → journal. Read `materials/big-picture.md` first, then the build journals
`materials/epitesi-naplo/day-*.md` (they carry the decisions + the two-loop lessons).

## 2. Where work happens

- **Sessions run FROM THIS REPO directory** (`C:\Zulu\git_we\wshp-ai-dev-2026`) — start Claude Code here.
  Note: earlier sessions ran from the Drive Trainings folder and their project memory does NOT carry
  over to sessions started here — this file + the journals + the Drive docs are the full context bridge.
- **Internal (non-public) materials live on Drive:**
  `G:\Shared drives\Wenova-Shared\Trainings\2026.07.14-AI-Dev-1-day\`
  - `10_Internal/01_Design/` — curriculum v2, decision pack (locked decisions D1–D10 + validation log),
    greenfield reference architecture, the original prep handoff
  - `10_Internal/02_Production/` — **prep-roadmap.md** (working mode + doc rules) + Gamma presentation
    md scripts go HERE (never into this repo)
  - `10_Internal/03_Sales/` — client docs (offer, participant info sheet) — never into this repo
  - `10_Internal/04_Delivery/` — **workshop-detailed-syllabus.md** (minute-level run-of-show)
- **Tracking:** Linear project **wshp-ai-dev-2026** (team Wenova) —
  https://linear.app/wenova/project/wshp-ai-dev-2026-3eae5243953d — milestones Day 1–5 → Delivery
  (07-14) → Post-workshop. Update issue status as you work; RUG results go into issue comments.

## 3. State snapshot (2026-07-10 morning)

| Done ✅ | In flight / next 🔜 | Blocked ⛔ |
|---|---|---|
| WEN-113 skeleton · WEN-114 participant starter · WEN-117 workshops golden-path slice — each through a full RUG round (traces in the Linear issue comments + journals) | **WEN-116** plumbing validation (PR→preview+Neon branch+Playwright) — START THE MOMENT the block clears · WEN-141 auth(Neon Auth)+registrations+pricing+checkout · WEN-118 orchestrator/toolkit distillation (MUST implement standards-injection, see §4) · WEN-129 HU notebooks (sources: journals+big-picture) · WEN-122/123 legacy sample + Gamma decks · WEN-124 dry-run (PROTECT IT) | **Manual clicks in `reference-app/SETUP-STATUS.md`** (Vercel project + Neon integration + branch-per-preview + Neon Auth enable) — owner: Csaba. Gates WEN-116, the live URL, AND the 6 skipped Drizzle contract tests (`TEST_DATABASE_URL` leg — run once right after setup) |

## 4. Operating contract (how we work — non-negotiable rules)

1. **Dogfooding loop:** Linear issue = the spec (builder restates acceptance criteria first) → builder
   agent → **RUG**: independent fresh-context review (multi-angle finders → dedup → verify) →
   bounce-back fix agent → re-verify → close with a trace comment on the issue.
2. **Canonical-standards injection** (see `materials/mernoki-standardok.md`): maker AND reviewer prompts
   reference the SAME standards source — reviewers get it as an explicit checklist, never ad-hoc criteria.
3. **Journal with the build, never after:** every build day ends with `materials/epitesi-naplo/day-N.md`
   in the FIXED format — (1) the day in one mermaid diagram, (2) synthesis (what the day proved),
   (3) 🧑 human-loop vs 🤖 agent-loop lessons SEPARATED, (4) cases collapsed in `<details>`, tagged.
   Diagrams over prose; mark fictitious examples as fictitious. Update `big-picture.md` if the picture shifts.
4. **Language policy:** teaching materials Hungarian (terms linked to `materials/fogalomtar.md`);
   code/AI-instructions/commits English; business-spec examples may be HU.
5. **Public-repo hygiene:** no client names, no pricing/offer data, no invite links. Ask for
   "lifelike but INVENTED" sample data — never "realistic" (that instruction already leaked real
   numbers once; caught by review).
6. **Review feedback is not gospel:** verify before implementing (see the shadcn case, day-1 journal) —
   and builders may deviate from spec IF they say so and document why.

## 5. Gotchas (hard-won, do not re-learn)

- **Lockfiles must be generated with npm 10** (`npx npm@10 install`): CI runner pairs Node 22 + npm 10;
  npm-11 lockfiles break `npm ci`.
- **`shadcn` IS a runtime dependency** (globals.css imports `shadcn/tailwind.css`) — do not "clean it up".
- **`E2E_IN_MEMORY_DB=1` is a local-e2e-only seam**, guarded by a startup throw on Vercel (root.ts) —
  never weaken the guard; composition lives at the composition root, never at module import time.
- **Test lint-boundary rules with REAL files** — eslint zones are generated from existing module
  folders, so stdin tests against non-existent paths false-pass.
- **Both repo adapters must stay contract-equal:** the shared port-contract suite
  (`workshop-repo.contract.test.ts`) runs on in-memory always + Drizzle when `TEST_DATABASE_URL` is set.
- Playwright local run: `npm run test:e2e` (in-memory seam, no DB needed); against a preview:
  `PLAYWRIGHT_BASE_URL=<url> npx playwright test --grep @happy-path`.

## 6. First actions for the taker

1. `git pull` · read `materials/big-picture.md` + the latest `epitesi-naplo/day-*.md`.
2. Check the Linear project board for current issue states.
3. If the SETUP-STATUS block cleared: run WEN-116 immediately (it is the critical path and the workshop's
   technical centerpiece), then the Drizzle contract-test leg, then continue per the milestone order.
4. Take ownership of this file: update the snapshot + date, put your marker on it.
