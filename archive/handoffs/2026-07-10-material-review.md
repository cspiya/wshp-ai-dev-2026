> **OBSOLETE — distilled into `HANDOFF.md`, the participant materials, toolkit, and Linear work on 2026-07-10. Do not use as the active session handoff.**

> **ARCHIVED 2026-07-11:** review findings were adopted or transferred into the canonical root
> `HANDOFF.md` and `materials/notebooks/README.md`. This file is retained as the original review record.

# Wenova AI Workshop Review — Handoff

**Project:** `wshp-ai-dev-2026`<br>
**Repo:** `cspiya/wshp-ai-dev-2026`<br>
**Workshop:** Wenova AI-Assisted Development Workshop — 2026.07.14, 09:00–17:00<br>
**Context:** AI-assisted / agentic software development workshop for experienced Hungarian enterprise developers and BAs, mostly coming from .NET / C# / MS-SQL / TFS–Azure DevOps background.

---

## 1. High-level status

The repo already contains a strong foundation. It is not merely a tool tutorial; it is shaping into a serious engineering-methodology workshop around:

- spec-driven development,
- human validation gates,
- Claude Code / coding agents,
- orchestrator + subagent workflow,
- Repeat-Until-Good review loop,
- fresh-context reviewer agents,
- AGENTS.md / CLAUDE.md rules,
- hooks, CI and deterministic guardrails,
- vertical-slice modular architecture,
- golden-path reference implementation,
- legacy .NET / MS-SQL / Azure DevOps adaptation,
- 30/60/90 organizational adoption.

The current risk is **not lack of substance**, but **too much density for a one-day workshop**.

The teaching material currently uses several deep TypeScript/Node/Next.js concepts too tersely. Even a 25-year enterprise .NET/C#/MS-SQL architect may find some passages hard to parse if they are written in “modern TS architecture shorthand”.

Primary editorial principle going forward:

> **Do not simplify the professional content. Translate it into the participant’s enterprise/.NET mental model first, then show the TypeScript/Next.js implementation.**

---

## 2. Core workshop positioning

Recommended central message:

> **AI-assisted development is not about getting AI to write code instead of you.<br>
> It is about redesigning the development process so that AI can work as a reliable junior developer: with clear specification, bounded context, explicit rules, tool access, acceptance criteria, mechanical gates, and independent review.**

The Wenova-specific mental model:

> Treat the AI like a very fast, tireless junior colleague with huge lexical knowledge. It becomes reliable only if it receives:
>
> 1. clear, precise instruction,
> 2. the right tools and access,
> 3. explicit boundaries,
> 4. acceptance criteria / definition of done.

Map this to the workshop:

| Junior-developer requirement | Workshop mechanism |
|---|---|
| Clear instruction | Spec-driven development, Linear issue, AGENTS.md |
| Tools and access | Claude Code, MCP, GitHub, Linear, Vercel, Neon |
| Boundaries | vertical slice, module contract, lint-enforced boundaries |
| Acceptance criteria | Given-When-Then, tests, e2e, RUG review |

This should be the backbone of the first module and the opening script.

---

## 3. Repo files already reviewed

Important files reviewed in this session:

- `README.md`
- `materials/agenda.md`
- `materials/setup-guide.md`
- `materials/fogalomtar.md`
- `materials/big-picture.md`
- `materials/mernoki-standardok.md`
- `materials/plugins-es-skillek.md`
- `materials/notebooks/README.md`
- `materials/epitesi-naplo/day-1.md`
- `materials/epitesi-naplo/day-2.md`
- `participant-starter/README.md`
- `reference-app/README.md`
- `reference-app/AGENTS.md`
- `reference-app/SETUP-STATUS.md`
- `reference-app/docs/adr/0001-workshops-is-the-golden-path.md`
- `reference-app/src/modules/workshops/README.md`

Useful discovered repo facts:

- Workshop is one-day, hands-on, Claude Code CLI-based.
- Stack: Linear + GitHub + Vercel + Neon + Next.js/React.
- Participant materials are Hungarian; code, prompts, AI instructions and technical artifacts are English.
- Reference app is a modular monolith of vertical slices.
- `workshops/` is now the golden-path slice.
- `identity/` is only a minimal boundary demo, not the template.
- Vercel/Neon manual setup is still a critical open gate.
- Notebooks are planned but mostly not yet written.

---

## 4. Strong parts of the current material

### 4.1 Big Picture

`materials/big-picture.md` is strong. It correctly frames the workshop as a work-mode shift:

- developer time moves from typing to directing and validating,
- team bottleneck shifts toward specification, review and testing,
- the method is the product, not the prompt.

Keep this document as the “north star”.

### 4.2 Day 1 journal

`materials/epitesi-naplo/day-1.md` contains one of the strongest teaching stories:

> The builder-agent passed all green gates, but an independent fresh-context review still found 10 real issues.

This should become a central teaching example, not remain hidden in the journal.

Core takeaway:

> **Green pipeline does not mean done. Author and reviewer must not be the same context.**

### 4.3 Day 2 journal

`materials/epitesi-naplo/day-2.md` is even stronger from an architecture teaching perspective.

It shows how a chain of small architectural issues can produce hidden real bugs:

> import-time module composition → bad e2e seam → production flag risk → browser bundle risk → test double drift → Safari date bug.

This is a high-value case study, but currently too compressed. It must be rewritten with .NET analogies.

### 4.4 Glossary

`materials/fogalomtar.md` is useful and should be expanded. It already uses .NET parallels for parts of the stack. Extend that style to agentic/architecture terms as well.

### 4.5 Engineering standards

`materials/mernoki-standardok.md` is strong because it says the same engineering standard must be injected into both maker and reviewer agents, and mechanically enforced where possible.

Core takeaway:

> **The professional standard is not “knowledge the agent will apply by itself”; it is an operating contract injected into every role.**

### 4.6 Plugin / skill limits

`materials/plugins-es-skillek.md` is useful and honest. Keep the message, but teach it live in a shorter form:

> **Few curated skills + good descriptions + short skill files + deterministic hooks for anything mandatory.**

---

## 5. Main risks

### 5.1 One-day overload

Current agenda has too many large concepts:

- Claude Code,
- Linear/GitHub/Vercel/Neon,
- Next.js/React/Tailwind/shadcn,
- Drizzle/tRPC/Zod/TanStack Query,
- vertical slice architecture,
- spec-driven SDLC,
- RUG review,
- hooks/skills/plugins,
- e2e and token/cost,
- legacy .NET block,
- team operating model.

This can work only if every block has a single clear teaching point.

### 5.2 Too much TypeScript-native shorthand

Several concepts are currently named as if the audience were already familiar with Node/TS/Next.js architecture:

- import-time composition,
- composition root,
- e2e seam,
- browser bundle,
- test double drift,
- contract test,
- adapter,
- port,
- module contract.

For the target audience, each must be explained in three layers:

1. Hungarian engineering meaning.
2. Enterprise/.NET analogy.
3. TypeScript/Next.js implementation detail.

### 5.3 Setup risk

The setup guide requires GitHub, Vercel, Neon, Linear, v0, Claude subscription, Git, Node.js, Claude Code CLI.

MCP setup is planned during the workshop. This is risky.

There must be a preflight checklist and preferably a pre-workshop support slot.

### 5.4 Vercel/Neon critical path

`reference-app/SETUP-STATUS.md` shows manual Vercel/Neon integration is not yet fully done.

This is a workshop risk. Add a Plan B:

- trainer-owned demo preview,
- local in-memory e2e,
- DB-branch-per-preview shown as a demo if participant accounts fail.

---

## 6. Recommended agenda refinement

Current agenda is structurally good. Keep it, but sharpen the teaching outcome per block.

Suggested live framing:

| Time | Focus |
|---|---|
| 09:00–09:20 | AI as junior developer: mental model |
| 09:20–09:45 | Claude Code + stack + setup check |
| 09:45–10:45 | Greenfield starter + first success |
| 11:00–11:45 | Spec as working contract: BA gate, Given-When-Then |
| 11:45–12:30 | RUG: author ≠ reviewer, Day 1 / Day 2 cases |
| 13:15–14:00 | Rules / skills / hooks: prompt is request, hook is guarantee |
| 14:00–14:45 | QA / e2e / token budget: verify, do not believe |
| 15:00–16:00 | Legacy adaptation: .NET / MS-SQL / Azure DevOps |
| 16:00–16:35 | Team operating model + 30/60/90 |
| 16:35–17:00 | Closing: personal adoption plan + Q&A |

Recommended takeaway sentence per block:

| Block | Takeaway |
|---|---|
| Intro | The AI must be managed like a junior developer, not worshipped like magic. |
| Greenfield | Good architecture is the first lever of AI quality. |
| Spec-driven | The spec is the agent’s work contract. |
| RUG | The author and reviewer must not be the same context. |
| Rules/skills/hooks | A prompt is a request; a hook is a guarantee. |
| QA/e2e | If it did not run, the AI only narrated it. |
| Legacy | Safety net first, modernization second. |
| Team adoption | Turn individual tricks into team operating habits. |

---

## 7. Priority changes

### P0 — Must do before workshop

1. Create `materials/notebooks/00-bevezeto.html`
   - AI as junior developer
   - token/context basics only as mental model
   - why context is finite
   - why boundaries matter
   - why acceptance criteria matter
   - why review must be independent

2. Add “takeaway sentence” to every agenda block.

3. Add preflight checklist to `materials/setup-guide.md`:
   - `node --version`
   - `git --version`
   - `claude --version`
   - `claude` login works
   - GitHub login works
   - Vercel login via GitHub works
   - Linear account exists
   - participant has a simple web idea

4. Add Plan B note for Vercel/Neon:
   - if participant preview setup fails, continue with local/in-memory path,
   - trainer demonstrates preview + DB branch,
   - avoid losing the day to OAuth/integration friction.

5. Rewrite or expand the Day 2 hibalánc explanation in participant-friendly language.

### P1 — Important

1. Create `materials/notebooks/03-orchestrator-rug.html`
   - Day 1 and Day 2 as case studies.
   - Two loops: human loop and agent loop.
   - RUG flow.
   - fresh-context reviewer.

2. Expand glossary with .NET analogies for:
   - composition root,
   - seam,
   - test double,
   - contract test,
   - browser bundle,
   - adapter,
   - port,
   - boundary lint.

3. Add anti-pattern list:
   - vibe coding,
   - one huge context,
   - reviewer-less merge,
   - too many global skills,
   - prompt-only governance,
   - fake green pipeline,
   - undocumented human decisions.

### P2 — Later

1. Full notebook set.
2. Take-home toolkit completion.
3. Legacy .NET playbook as separate deep module.
4. 30/60/90 adoption template.
5. Scripted trainer notes for every module.

---

## 8. Key rewritten explanation: Day 2 hibalánc

Use this version instead of shorthand.

### Participant-friendly version

A reference-appban volt egy tanulságos architekturális hibalánc.

Elsőre csak annyi történt, hogy egy modul saját maga rakta össze a függőségeit. Vagyis nem az alkalmazás központi bekötési pontján döntöttük el, hogy valódi adatbázis-adaptert vagy teszt-adaptert használjon, hanem a modul már betöltéskor kiválasztotta ezt magának.

.NET-es fejjel ez olyan, mintha egy osztály nem konstruktoron keresztül kapná meg az `IRepository` implementációt, hanem maga példányosítaná a konkrét SQL-es repositoryt. Ezzel elveszik a tiszta dependency injection.

Ebből több probléma következett:

1. Nehezebb lett tisztán lecserélni a valódi adatbázist in-memory teszt-adapterre.
2. Emiatt bekerült egy környezeti kapcsoló, amely e2e tesztnél fake adattárra váltott.
3. Ez a kapcsoló veszélyes lett volna preview vagy production környezetben, ha véletlenül bekapcsolva marad.
4. A public modul-contracton keresztül szerveroldali adatbázis-kód is túl közel került a kliensoldali importokhoz.
5. Az in-memory teszt-adapter nem pontosan úgy viselkedett, mint a valódi Postgres/Drizzle adapter.
6. Emiatt a tesztek zöldek voltak, de a valódi adapter Safari böngészőben hibás dátumformátumot adott volna.

The teaching point:

> **This is not “the AI wrote bad code”.<br>
> This is “a weak architectural seam allowed a chain of errors to stay hidden”.**

Therefore we need:

- central composition root,
- dependency injection style wiring,
- contract tests over both fake and real adapters,
- hard guards in production,
- mechanically enforced module boundaries.

---

## 9. Glossary translation table

Add or use these explanations.

| Current shorthand | Better Hungarian / .NET-oriented explanation |
|---|---|
| import-time composition | A modul már betöltéskor létrehozza a saját függőségeit. .NET analógia: nem DI-ból kapja az `IRepository`-t, hanem maga new-zza. |
| composition root | Az alkalmazás központi bekötési pontja. .NET analógia: `Program.cs` / `Startup.cs`, ahol a DI konténert összerakod. |
| e2e seam | Tesztelési cserepont: hol tudjuk a valódi DB-t fake/in-memory adattárra cserélni. |
| production flag | Környezeti kapcsoló, ami veszélyes, ha éles/preview környezetben véletlenül bekapcsolva marad. |
| browser bundle | A böngészőbe kikerülő kliensoldali JavaScript-csomag. Ide nem kerülhet szerveroldali DB-driver. |
| double drift | A fake/in-memory teszt-adapter viselkedése eltér a valódi adatbázis-adapterétől. |
| contract test | Ugyanaz a viselkedési teszt fut a fake és a valódi adapteren is. |
| adapter | Konkrét technikai megvalósítás egy port/interface mögött. Példa: SQL repository, fake repository. |
| port | Interface/absztrakció egy tényleg változó külső függőségre. |
| boundary lint | Gépileg kikényszerített modulhatár: nem csak megbeszéljük, hanem lint/test el is kapja a szabályszegést. |

---

## 10. Suggested Codex / Claude Code prompt

Use this from the command line in the repo.

```text
Review and improve the participant-facing teaching materials in the wshp-ai-dev-2026 repository.

Goal:
Make the workshop easier to understand for experienced enterprise .NET / C# / MS-SQL developers and BAs who are not native TypeScript/Node/Next.js engineers.

Do not change reference-app runtime behavior in this task.

Tasks:
1. Add a short "AI as junior developer" mental model to the intro materials.
2. Add a "Vidd haza" takeaway sentence for every agenda block in materials/agenda.md.
3. Add a preflight checklist to materials/setup-guide.md.
4. Add a Plan B note for Vercel/Neon preview setup risk.
5. Expand materials/fogalomtar.md with .NET-oriented explanations for:
   - composition root
   - e2e seam
   - test double
   - double drift
   - contract test
   - browser bundle
   - port
   - adapter
   - boundary lint
6. Draft materials/notebooks/00-bevezeto.html from materials/notebooks/_template.html.
7. In the new intro notebook, explain:
   - AI as junior developer
   - why context matters
   - why clear specs matter
   - why tools/access matter
   - why boundaries matter
   - why acceptance criteria matter
   - why author and reviewer cannot be the same context
8. Rewrite the Day 2 hibalánc explanation in participant-friendly language with .NET analogies.

Constraints:
- Teaching prose is Hungarian.
- Code, prompts, AI instructions, comments and technical artifacts are English.
- Do not invent claims, fake numbers, fake stories, or fake customer examples.
- Preserve repo structure.
- Keep the workshop focused on method, not tool hype.
- Prefer enterprise/.NET analogy first, TypeScript implementation second.
- Report all changed files and the reason for each change.
```

---

## 11. Review checklist for future edits

When reviewing generated changes, check:

- Does every deep concept have a .NET/C#/MS-SQL analogy?
- Does every block have one clear takeaway?
- Does every exercise have:
  - goal,
  - steps,
  - done criteria,
  - typical failure modes?
- Does the text avoid hype?
- Does it avoid invented claims/stories/numbers?
- Are participant materials Hungarian?
- Are code/prompts/instructions English?
- Does the setup have a fallback path?
- Does the workshop teach method before tools?
- Does the material repeatedly connect back to:
  - AI as junior developer,
  - spec as contract,
  - context discipline,
  - mechanical guardrails,
  - independent review,
  - legacy adaptation.

---

## 12. Final editorial principle

The workshop should not feel like:

> “Here are many modern tools.”

It should feel like:

> “Here is the new operating model for professional software development with AI agents — and here is a safe, enterprise-grade way to introduce it into your existing .NET / MS-SQL / Azure DevOps reality.”

That is the Wenova differentiation.
