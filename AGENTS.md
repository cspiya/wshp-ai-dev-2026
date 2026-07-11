# Workshop repo — agent rules

Wenova AI-Assisted Development Workshop (delivery 2026-07-14): participant materials
(`materials/`, Hungarian), take-home toolkit (`toolkit/`), participant starter
(`participant-starter/`), and a reference app (`reference-app/`). We build it **with the
method we teach** (dogfooding). Session context bridge: `HANDOFF.md`; the big picture:
`materials/big-picture.md`.

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
3. **RUG loop:** builder → independent fresh-context review → bounce-back fix →
   re-verify → trace comment on the issue (full contract: `HANDOFF.md` §4).
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
   Sample data is "lifelike but INVENTED" — never "realistic".
