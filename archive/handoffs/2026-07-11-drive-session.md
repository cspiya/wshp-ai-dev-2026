> **ARCHIVED 2026-07-11:** processed into the canonical root `HANDOFF.md`. Remaining work is tracked
> there and in Linear; this file is retained only as historical source context.

# HANDOFF — from the Drive-side session (inbox for the repo-session owner)

> **Lifecycle:** this is a one-shot INBOX from the closing Drive-side session (the one that ran from the
> Trainings folder and built Days 1–2, the Linear project, and the internal Drive docs). The repo-session
> owner should MERGE what's relevant into `HANDOFF.md` and then DELETE this file — the one-handoff rule
> stands. Left uncommitted on purpose (the repo session owns the working tree).
>
> PUBLIC repo: this file is hygiene-clean; client/commercial specifics live on Drive + in the Trainings
> project memory.

*Written: 2026-07-11 · author: the Drive-side session (closing)*

---

## 1. What the Drive-side session uniquely knows

### Drive internal docs — current state (repo HANDOFF lists the folders; this is what's IN them)
`G:\Shared drives\Wenova-Shared\Trainings\2026.07.14-AI-Dev-1-day\10_Internal\`
- **`04_Delivery/workshop-detailed-syllabus.md`** — minute-level run-of-show. Recently updated by me:
  (a) the TFS/Azure DevOps segment is **DEMO-ONLY on our own internal project** (cohort is on TFS but
  GitHub is mandated for the workshop — already notified; no participant TFS lab, no separate env);
  (b) G4 key message now includes the **canonical-standards injection** pattern.
  **LIKELY STILL PENDING on the Drive side** (from the material-review adoption — verify before dry-run):
  per-block **takeaway sentences**, the B0 reframe around the **"AI as a junior developer"** mental model
  (review §2 table), and the **Vercel/Neon Plan B** added to the syllabus fallback playbook.
- **`02_Production/prep-roadmap.md`** — working mode + doc rules (journal format, content-placement,
  dogfooding contract) + continuation pointer to the repo HANDOFF. Gamma md scripts belong here.
- **`01_Design/curriculum-v2-decision-pack.md`** — locked decisions **D1–D10** + validation/uncertainty
  log (D9 = training-webshop reference app; D10 = PaymentPort/fake adapter + Neon Auth). Also there:
  `greenfield-reference-architecture.md`, curriculum v2, the original prep handoff, and the meeting-retro
  sources.
- **`03_Sales/`** — client offer + participant info sheet (sent; some placeholders still open — see
  Trainings memory), and the delegated website-update brief.

### The material-review file (`wenova-ai-workshop-review-handoff.md`, repo root)
- The repo session already executed most of its P0 (notebooks incl. 00+03, preflight checklist, Plan B in
  setup-guide, big-picture central thesis). **Remaining from the review, as far as this session knows:**
  1. Drive syllabus items above (takeaways / B0 junior-model / Plan B in run-of-show).
  2. Review **§11 editorial checklist** → wire into `materials/notebooks/README.md` AND inject it into
     future material-reviewer prompts (the standards-injection pattern applied to teaching materials).
  3. **OPEN USER DECISION (never answered):** review §6 proposes a refined time grid (intro split
     09:00–09:20 mental model + 09:20–09:45 setup; legacy shortened to 15:00–16:00; closing 16:35–17:00
     with a personal adoption plan). Csaba was asked full-adopt vs takeaways-only vs hybrid — no answer
     yet. Ask before finalizing agenda/notebooks.
  4. When consumed: move the review file to Drive `10_Internal/01_Design/` (one handoff at root).

### Linear state owned by this session (beyond what repo HANDOFF says)
- **WEN-113/114/115/117 Done** — 115's resolution (TFS→demo-only) is reflected in the Drive syllabus +
  decision pack O3; 113/117 carry full RUG trace comments (8-angle review → bounce-back → re-verify),
  useful as G3 case-study material.
- **WEN-128** (website update, delegated to a separate session in the site repo; brief in Drive
  `03_Sales/`) — due 07-10, status unknown; check/chase.
- **WEN-127** post-workshop: retro with the external CTO + colleague ~1 week after delivery.
- Repo HANDOFF already notes: evidence sync for 116/118/129/141/124 is pending (connector limit).

### Environment facts that may not be obvious from the repo
- **GitHub Pages is enabled** for this repo → notebooks are served at
  `https://cspiya.github.io/wshp-ai-dev-2026/` (materials/notebooks/...).
- Claude Code **plugins installed** on this machine (session-level, official marketplace): skill-creator,
  superpowers, github, linear, vercel, neon (+ code-review plugin — flagged as duplicate of the built-in;
  suggested uninstall). Teaching doc about them + system limitations: `materials/plugins-es-skillek.md`.
- The **Trainings project memory** (visible only to sessions started from the Drive Trainings folder)
  holds the client/commercial context and the full decision history; everything operationally needed has
  been mirrored into HANDOFF/journals/decision-pack — for commercial details, work from the Drive docs.

## 2. Suggested merge order for the repo-session owner

1. Read this file; pull the §1 items into `HANDOFF.md` (open items table + gotchas as appropriate).
2. Ask Csaba the §6 time-grid question (the one open decision) before finalizing agenda + notebook 00.
3. Sync the pending Drive-side syllabus edits (takeaways / B0 / Plan B) so run-of-show and repo agenda
   don't drift before the 07-13 dry-run.
4. Move `wenova-ai-workshop-review-handoff.md` to Drive `01_Design/`, then delete THIS file.
