# HANDOFF — session continuation point

> **Lifecycle rule:** there is always exactly ONE handoff file, here at the repo root. Whoever picks up
> the work OWNS this file: work from it, keep it updated as you go, and when you hand off, rewrite it
> for the next session (or mark it `> OBSOLETE` at the top if superseded). Do not create day-numbered
> or parallel handoff files.
>
> **This repo is PUBLIC.** Keep this file hygiene-clean: no client names, no pricing/offer details,
> no invite links, no personal data. Those live on the internal Drive (below).

*Last updated: 2026-07-11 · owner of next session: parallel-worktree coordinator*

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

## 3. State snapshot (2026-07-10 late)

| Done ✅ | In flight / next 🔜 | Blocked ⛔ |
|---|---|---|
| WEN-113 skeleton · WEN-114 participant starter · WEN-117 workshops golden path · WEN-118 toolkit implementation (RUG workflow, canonical maker/reviewer/fixer standard, hooks, templates, checklists, validated skill) · WEN-129 P0 material pass (all 8 notebooks exist; 00 + 03 full, six participant-facing outlines) · WEN-141 local subset after independent RUG + bounce-back (pricing + PaymentPort/fake checkout + authoritative registration schedule + atomic status transitions + confirm/cancel UI) · full local checkpoint on 2026-07-11: both builds green, 59 reference tests + 1 starter test green, Playwright 2/2 green, toolkit/HTML/link/public guards green | **WEN-116** plumbing validation — start immediately after setup · finish WEN-118 fallback recording · editorial/browser QA and deepen the six outline notebooks · WEN-122/123 legacy sample + Gamma decks · WEN-124 dry-run (PROTECT IT) | **Manual clicks in `reference-app/SETUP-STATUS.md`**: Vercel project, Neon integration, branch-per-preview, DB/env, Neon Auth provisioning. Gates live preview, auth, and 11 skipped real-Drizzle contract tests. |

### Parallel prep run evidence (2026-07-10)

- **Materials:** 8/8 standalone notebook files; structural HTML shell + placeholder scan passed; public-content guard passed. `00-bevezeto.html` and `03-orchestrator-rug.html` are full teaching artifacts; `01/02/04/05/06/07` are meaningful outlines and still need editorial + visual browser QA.
- **Toolkit:** independent audit PASS; `rug-review` skill validation PASS; hook syntax PASS; 3/3 hook regression tests PASS (safe/blocked guard, child failure propagation, timeout propagation); stop-check smoke PASS.
- **Reference app:** independent review initially FAILed on a client-forgeable cancellation cutoff. Bounce-back made workshop start server-owned, added CAS transitions, generalized the PaymentPort contract, surfaced UI errors, added cancellation to e2e, aligned auth docs, and removed the hard-coded preview workshop ID. Delta re-review: **PASS local subset**, one accepted LOW residual risk (preview e2e leaves a cancelled row). Main rerun: typecheck PASS, lint PASS, 59 tests PASS / 11 DB-dependent skips. Builder ran build + Playwright 2/2 before the final bounce-back; rerun both after setup/network access.
- **Linear trace:** WEN-118, WEN-129, and WEN-141 were moved to In Progress and received lane-start comments. The final evidence/status sync was rejected by the connector usage limit; add the detailed results above to WEN-116/118/129/141/124 at the start of the next session. Do not mark 118/129/141 Done yet: recording, notebook QA, and external preview/Auth evidence remain.

### Drive-side and editorial follow-ups merged from archived handoffs

- Before the dry-run, sync the internal Drive syllabus with the repo: per-block takeaways, B0's “AI as a
  junior developer” framing, and the Vercel/Neon Plan B.
- **Open human decision:** keep the current agenda grid or adopt the review's shorter legacy block and
  longer closing/personal-adoption segment. Do not silently change the run-of-show.
- Check/chase WEN-128 in its separate site repository; WEN-127 remains a post-workshop follow-up.
- GitHub Pages is enabled at `https://cspiya.github.io/wshp-ai-dev-2026/`; include rendered notebook URLs
  in the visual QA, not only local files.
- The material-review checklist is now canonical in `materials/notebooks/README.md` and must be injected
  into future material-reviewer prompts.

### Parallel execution contract

- Follow `PARALLEL-WORK.md`: one Linear issue = one branch = one worktree lease.
- Stable Linear labels are `AI lane / materials` and `AI lane / reference-app`; session identity and
  worktree path live in an ACTIVE/PAUSED/RELEASED issue comment.
- `HANDOFF.md`, root files, and `.github/**` remain coordinator-owned during parallel work.
- The two source handoffs were processed and archived under `archive/handoffs/`; only this file is active.

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

1. `git pull` · read `materials/big-picture.md`, `PARALLEL-WORK.md`, and the latest `epitesi-naplo/day-*.md`.
2. Check the Linear project board for current issue states.
3. Complete the manual checklist in `reference-app/SETUP-STATUS.md`, then run WEN-116 immediately: test PR → preview URL → isolated Neon DB branch → migrations/seed → Playwright against preview.
4. Set `TEST_DATABASE_URL` to a disposable Neon branch and run `npm run test`; require **zero skips**. Then rerun `npm run build` and `npm run test:e2e` on the final bounce-back state.
5. Finish WEN-118's fallback recording; visually QA all eight notebooks and deepen the six outlines only as live delivery needs.
6. Protect WEN-124 on July 13. After the dry-run, accept only workshop-blocking fixes.
7. Take ownership of this file: update the snapshot + date, put your marker on it.
