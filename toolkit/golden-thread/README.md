# Golden thread — the one central invented workload (KK-Regisztráció)

> **Execution ownership:** every exact Git, npm, PowerShell, Node, API or browser
> instruction in this technical package is an **agent-run contract or recorded
> evidence**, not a participant typing exercise. After bootstrap, the human supplies
> intent, scope and approval; Claude Code or Codex selects and runs the syntax, returns
> exit codes/results, and repeats after evidence-based feedback.

One primary agent completes the mandatory path. A second agent is optional for the C7
portability/eval comparison.

Operator/trainer documentation (English). Everything in this pack is **INVENTED**
and public-safe: names, emails (`example.invalid`), dates, and the business brief
itself. No real client, price, or personal data appears anywhere.

## What this pack is

The workshop uses ONE workload that flows through the whole day (C3 → C7):
the participant writes a spec package for it in module 3 (C3 spec gate), implements
it with their AI agent in the C4 maker block, reviews it in module 4, and hardens
the gates around it afterwards. This directory is the trainer's single source for
that workload:

- the **invented business brief** (below),
- the **approved reference spec package** (`spec-package/`) — what a good C3 outcome
  looks like,
- three **snapshots** (`fixtures/snapshots/`) — trainer fallback paths that can be
  applied onto any bootstrapped participant workspace.

The snapshots live under a `fixtures/` directory ON PURPOSE: the repo validators
(`toolkit/hooks/check-placeholders.mjs`, `check-public-content.mjs`, `check-links.mjs`)
skip `fixtures/` directories, and the `partial` snapshot deliberately contains
TODO-style markers while the `broken` snapshot deliberately contains a planted defect.

## The invented brief — „KK-Regisztráció"

Attendees register with **name + email** for a scheduled workshop.

- A registration may be cancelled only **until 48 hours before** the workshop start;
  the boundary is **exclusive**: at exactly 48 hours before start it is NO LONGER
  cancellable (AC-02).
- A **duplicate active** registration for the same email + workshop is rejected;
  a cancelled one does not block re-registration (AC-03).
- Valid input creates an `active` registration that shows up in the list; invalid
  input is rejected visibly (AC-01).

The approved contract with stable IDs (AC-01..03, SC-01A..SC-03A, TASK-01..05) is in
[spec-package/spec.md](spec-package/spec.md),
[spec-package/given-when-then.md](spec-package/given-when-then.md) and
[spec-package/tasks.md](spec-package/tasks.md). The package header marks it
`C3-APPROVED-CONTRACT (trainer reference)` — **a participant's own APPROVED package
replaces it** on the main path; this reference exists so the day never blocks on a
missing or failed C3 outcome.

## Inventory

| Path | What it is |
|---|---|
| `spec-package/` | Approved five-file reference spec package (constitution, spec, given-when-then, plan, tasks) |
| `fixtures/snapshots/known-good/` | The COMPLETE implemented slice — demo-ready reference implementation |
| `fixtures/snapshots/partial/` | Compiling skeleton (domain + memory adapter done, rest open) — slow-path catch-up start point |
| `fixtures/snapshots/broken/` | known-good with EXACTLY ONE planted defect + ONE false-positive bait — module-4 review exercise |

Each snapshot carries a `replay-manifest.json` (schemaVersion 1, `files[]` with every
file in the pack) and a `.gitignore-additions.txt` to append to the workspace
`.gitignore` (the runtime store `data/registrations.json` must never be committed).

## C4 maker block mechanics

The participant — with their AI agent — implements the APPROVED spec package in their
own participant workspace (their own repo bootstrapped from `participant-starter`).
The trainer does not type code; the reference snapshots exist only as fallbacks.

When the slice is green (`npm run typecheck && npm run lint && npm run test`), the
participant records the reviewed commit id (**MAKER_SHA** — module 4 reviews exactly
this commit):

```powershell
git add -A
git commit -m "feat: KK-Regisztracio slice (C4)"
git rev-parse HEAD   # record this value as MAKER_SHA in the work item
```

(one-liner where `&&` is available: `git add -A && git commit -m "feat: KK-Regisztracio slice (C4)" && git rev-parse HEAD`)

## Snapshot usage (trainer)

All snapshots mirror the participant-starter layout, so they are applied by copying
onto the **workspace root**. Apply onto a CLEAN state (fresh bootstrap, or commit /
stash everything first) so leftover files from another snapshot cannot linger —
notably `known-good` contains `repo-contract.test.ts`, which must NOT remain in a
workspace switched to `partial`.

Windows PowerShell, run from the participant workspace root (`robocopy` is used
because the API route path contains `[id]`, which `Copy-Item` treats as a wildcard;
exit codes 0–7 mean success):

```powershell
# Pick ONE: known-good | partial | broken
$snapshot = "C:\path\to\wshp-ai-dev-2026\toolkit\golden-thread\fixtures\snapshots\known-good"

robocopy "$snapshot\src" .\src /E
robocopy "$snapshot\data" .\data /E
Add-Content .gitignore (Get-Content "$snapshot\.gitignore-additions.txt")
```

Then prove the state: `npm run typecheck; npm run lint; npm run test` and, for a demo,
`npm run dev` → `http://localhost:3000/regisztracio`.

### What each snapshot is for

- **known-good** — full slice, all gates green. Use it to demo the finished workload,
  to rescue a workspace late in the day, or as the reviewer's ground truth.
- **partial** — domain (`domain.ts`), port (`repo.ts`), memory adapter and
  `domain.test.ts` are complete and GREEN; the file adapter throws an error marked
  with TASK-03, both API routes answer 501, and the page shows a Hungarian
  "in progress" card. Use it when a participant reaches the C4 block without a
  working start point: typecheck and tests are green, and TASK-03/04/05 remain as
  honest, spec-covered work.
- **broken** — known-good with one planted defect and one review bait (next section).
  Use it in module 4 when a participant has no own diff to review, or to guarantee
  the review exercise has a real finding.

### Switch-to-fallback and return-to-main-path rules

- Switch to a fallback ONLY at a module boundary, and record it in the work item
  ("switched to trainer snapshot X because Y").
- Apply fallbacks on a scratch branch (`git switch -c fallback/<snapshot>`), never on
  the participant's main branch — their own work stays recoverable.
- Return to the main path as soon as the exercise allows: the participant's own
  APPROVED spec package and own implementation always replace the trainer reference.
  After a `broken`-based review exercise, drop the scratch branch and return to the
  participant's MAKER_SHA.
- The spec package is the contract in ALL cases: even on a fallback snapshot, review
  findings are argued against [spec-package/spec.md](spec-package/spec.md), not
  against taste.

## Replay-manifest validation

Each snapshot is a replay pack: `replay-manifest.json` with `schemaVersion: 1` and a
non-empty `files[]` listing every file. `toolkit/setup/workshop-doctor.ps1` validates
packs via its `Test-ReplayPack` routine (manifest present, schemaVersion 1, every
listed file exists):

```powershell
.\toolkit\setup\workshop-doctor.ps1 -IncludeLegacy -ReplayPath .\toolkit\golden-thread\fixtures\snapshots\known-good
```

Caveat: the doctor consults `-ReplayPath` only on its legacy (`-IncludeLegacy`) row,
and only when the .NET SDK probe fails — on a machine with .NET installed that row
reports `PASS` without touching the pack. For a direct pack check regardless of
installed SDKs, validate the manifest inline:

```powershell
$pack = ".\toolkit\golden-thread\fixtures\snapshots\known-good"
$manifest = Get-Content "$pack\replay-manifest.json" -Raw | ConvertFrom-Json
if ([int]$manifest.schemaVersion -ne 1) { throw "wrong schemaVersion" }
# -LiteralPath matters: the [id] route directory is a wildcard to plain Test-Path.
$missing = @($manifest.files | Where-Object { -not (Test-Path -LiteralPath (Join-Path $pack $_)) })
if ($missing.Count -gt 0) { $missing; throw "missing files" }
Write-Output ("replay pack OK: {0} files" -f @($manifest.files).Count)
```

## Trainer-only knowledge: the planted defect and the false-positive bait

Public-safe (the data is invented and the exercise works even if a participant reads
this), but do NOT hand it out before the module-4 review exercise.

### The ONE planted real defect (broken snapshot)

- **Where:** `fixtures/snapshots/broken/src/lib/registrations/domain.ts`, function
  `canCancel` — the comparison is `>=` instead of `>`.
- **Effect:** at EXACTLY 48 hours before the workshop start, cancellation is still
  allowed. This violates AC-02's **exclusive** boundary (see SC-02B). The doc comment
  above the function still states the exclusive rule — the code contradicts its own
  contract, which is the reviewable evidence.
- **Why the suite stays GREEN:** the exact-boundary unit test was (deliberately)
  weakened in `fixtures/snapshots/broken/src/lib/registrations/domain.test.ts`: it
  checks 49h before start (allowed) and 47h before start (rejected), but never the
  exact 48h boundary. `npm run test` passes — the defect is invisible to the gates.
- **Expected review outcome:** the reviewer maps AC-02/SC-02B to the code, notices the
  missing exact-boundary test, and proves the defect with a one-off boundary test
  (now = start minus exactly `CANCELLATION_WINDOW_MS` must yield `false`). The fix is
  `>=` → `>` PLUS restoring the exact-boundary test so the gate catches regressions.

### The ONE false-positive bait (broken snapshot)

- **Where:** `fixtures/snapshots/broken/src/lib/registrations/file-repo.ts`, private
  method `save` — after writing the temp file, the code re-reads it and `JSON.parse`s
  the content before renaming it over the store, with no explanatory comment.
- **Why it LOOKS wrong:** a read directly after a write of the same content appears
  redundant ("dead code / wasted I/O — we just wrote that string").
- **Why it is CORRECT and defensible:** it is a verify-before-swap guard. The rename
  is the commit point of the atomic-ish write; parsing the temp file first proves the
  bytes on disk are complete, valid JSON before they replace the known-good store, so
  a partial or corrupted write (full disk, crash, encoding issue) can never be
  promoted. Removing it changes no test but weakens the write path's safety.
- **Expected review outcome:** the finding is raised, verified, and **REJECTED with
  reasoning** — the teaching point of module 4: review feedback is not gospel; verify
  before implementing.

Note: the known-good snapshot uses the simple write (temp + rename, with an
explanatory comment, no verify-read). Both variants are correct; only the bait
version is deliberately comment-free so it invites the finding.

## Validation status

The pack was validated by copying the participant-starter tracked files into a temp
workspace, applying each snapshot, and running the real gates (`npm run typecheck`,
`npm run lint`, `npm run test`); the broken snapshot was additionally proven with a
transient exact-boundary mutation test (fails on broken, passes on known-good, then
deleted). See the WEN-129 work item for the recorded command log.
