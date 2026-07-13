# Workshop repo — agent rules

Wenova AI-Assisted Development Workshop (delivery 2026-07-14): participant materials
(`materials/`, Hungarian), take-home toolkit (`toolkit/`), participant starter
(`participant-starter/`), and a reference app (`reference-app/`). We build it **with the
method we teach** (dogfooding). Work state lives in Linear (issues + lease comments — no
handoff file); the big picture: `materials/big-picture.md`. Internal, non-public materials:
Drive `Wenova-Shared/Trainings/2026.07.14-AI-Dev-1-day/10_Internal/` (design, production,
sales, delivery run-of-show — never into this repo).

Each subproject has its own rules — read them before working there:
`reference-app/AGENTS.md` · `participant-starter/AGENTS.md` · `toolkit/AGENTS.md`.

## Operating contract (squad-grade agentic work)

1. **Linear execution gate:** work starts only on a Linear issue a human moved to
   Todo/In Progress (team Wenova, project wshp-ai-dev-2026). Every new unit of work —
   including material work — gets its own issue first.
2. **Spec-first:** the issue description IS the spec: outcome, scope boundaries,
   constraints, prior decisions, task breakdown, verification criteria. Explore and
   refine the spec until it stands; only then implement. Templates:
   `toolkit/spec-templates/`.
3. **RUG loop:** builder (restates acceptance criteria first) → independent
   fresh-context review (multi-angle finders → dedup → verify) → bounce-back fix →
   re-verify → close with a trace comment on the issue.
4. **Canonical standards, injected:** engineering work follows
   `toolkit/standards/engineering-standards.md`; material work follows
   `toolkit/standards/material-standards.md`. Maker AND reviewer reference the SAME
   file — link it, never copy it into prompts.
5. **Parallel sessions:** `PARALLEL-WORK.md` is binding — one issue = one branch =
   one worktree (`C:\Zulu\git_wt\<repo-slug>\<linear-issue>\`), lane label + lease
   comment in Linear. Root files stay coordinator-owned.
6. **Merges are human-approved:** the human decides WHETHER a branch merges to `main`;
   after approval the agent performs the merge and re-verifies the gates.
7. **Language policy:** participant-facing prose is Hungarian (terms linked to
   `materials/fogalomtar.md`); code, prompts, AI instructions, commits, and technical
   artifacts are English.
8. **Public repo hygiene:** no client names, pricing, invite links, or personal data.
   Sample data is "lifelike but INVENTED" — never "realistic" (that instruction already
   leaked real numbers once; caught by review).
9. **Journal with the build, never after:** every build day ends with
   `materials/epitesi-naplo/day-N.md` in the FIXED format — (1) the day in one mermaid
   diagram, (2) synthesis (what the day proved), (3) 🧑 human-loop vs 🤖 agent-loop
   lessons SEPARATED, (4) cases collapsed in `<details>`, tagged. Diagrams over prose;
   mark fictitious examples as fictitious. Update `materials/big-picture.md` if the
   picture shifts.
10. **Review feedback is not gospel:** verify before implementing (see the shadcn case,
    day-1 journal) — and builders may deviate from spec IF they say so and document why.
11. **Two content layers (2026-07-13 human decision):** the Markdown files under
    `materials/`, `toolkit/README.md` and the app READMEs are the SOURCE/instructor/AI
    layer — they explain what the material is, why it exists and how it is built, and
    must stay readable on GitHub. The generated HTML site (`build-site.mjs` → Pages) is
    the PARTICIPANT layer. Overlap is accepted; never reduce the Markdown layer to
    redirect stubs again. `materials/notebooks/` is the exception: retired, redirects
    only.
12. **Branding + attribution (2026-07-13 human decision):** every workshop deliverable
    carries DISCREET Wenova attribution (wordmark/star logo, edu.wenova.io, ©/™ line)
    plus the creator card of the trainer — a deliberate, human-approved exception to
    the personal-data rule for the trainer's own name/photo/work email. Placement:
    participant site = site-wide footer band; Gamma decks = footer + closing-slide
    card; printables = text-only footer; repo Markdown layer = root `README.md` ONLY
    (not every file). Deck D1 is the Gamma template pilot — no graphic pass on other
    decks until the human accepts D1's template. No PDF exports of decks (fallback is
    the markdown script).

## Hard-won gotchas (cross-cutting — do not re-learn)

Subproject-specific gotchas live in each subproject's `AGENTS.md`; these apply repo-wide.

- **Linux CI font metrics ≠ Windows.** The `materials.yml` render gate runs
  `check-render.mjs` on Linux Chromium, whose fonts render wider than Windows Segoe UI —
  a page that passes the full local render matrix can still fail "horizontal overflow
  (mobile)" at 320px (bit WEN-286, WEN-292 and module 3 again on 2026-07-12). Prefer
  defensive wrapping up front (`overflow-wrap` on code/nav labels, wrapping flex rows,
  `overflow-x: auto` on wide tables) and treat the pushed CI run as the real verdict —
  watch it before declaring done.
- **The participant-site shell IS the quality bar.** A content-complete but unframed
  site reads as total failure to the stakeholder. Preserve the shell (sidebar tree,
  in-page TOC, sticky header, card pager, `--svg-w` diagram width capping) in any site
  work, keep diagrams near design size, and verify "damage" reports in a real browser —
  the symptom is often presentation, not lost content.
- **GitHub MCP OAuth fails from Claude Code** ("does not support dynamic client
  registration" at `api.githubcopilot.com`; Linear/Neon/Vercel MCP OAuth are fine). Use
  the `gh` CLI for GitHub work. The `github` entry STAYS in both `.mcp.json` files —
  the workaround is documented for participants instead. Optional per-machine silence:
  `.claude/settings.local.json` → `"disabledMcpjsonServers": ["github"]` (untracked).
  A PAT-header route exists (`claude mcp add -s local -t http github … -H
  "Authorization: Bearer <PAT>"`) but is not the default.
