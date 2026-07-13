# AI-first participant material and visual-system remediation plan

**Status:** ratified implementation plan

**Coordinator:** visual foundation and integration package

**Sibling packages:** AI-first journey; toolchain, glossary and starter

**Baseline:** `5f1d95a69809f5c13602357eec7fde3f289a8b5a`

**Delivery date:** 2026-07-14

## 1. Why this programme exists

The executable C0-C7 golden thread is now present, but the participant experience
still communicates two conflicting operating models:

- the method says that Claude Code or Codex performs technical work inside an
  evidence-driven, human-gated loop;
- several participant pages still ask the human to copy exact Git, npm,
  PowerShell, API or product commands;
- a small number of newly authored diagrams use a colored, navigable visual
  language, while adjacent pages still use monochrome box-and-line diagrams;
- the participant tools page, glossary registry, explanatory Markdown and actual
  workshop use of AI describe different capability sets.

This programme removes those contradictions as three large packages. It is not a
page-polish backlog and must not be decomposed into diagram-, link-, sentence- or
command-level issues.

## 2. Ratified participant operating contract

### 2.1 Minimal bootstrap exception

The participant may enter exact technical syntax only when it is required to:

1. install Scoop when it is not already available;
2. launch Claude Code or Codex for the first time;
3. create or select the working folder in which the agent starts.

After the agent is active, the participant does not type or paste exact CLI, Git,
npm, Windows/Linux, API or product commands. The agent performs those operations.

### 2.2 The agent stays present for the whole day

Claude Code or Codex is not only a code generator used in selected labs. It is the
active learning and delivery companion for orientation, explanation, repository
inspection, specification, implementation, review, browser verification,
evidence collection, recovery and reflection.

Every participant exercise follows the same contract:

1. **Human intent or decision** -- the desired outcome, boundaries and decision
   that the AI may not make.
2. **Tell the agent** -- a natural-language assignment with scope and completion
   evidence, not syntax-sensitive magic wording.
3. **Agent execution** -- investigation, file changes, commands, browser work and
   evidence collection.
4. **Agent return** -- changed artifacts, checks run, results, risks and decisions
   still required.
5. **Human gate and RUG** -- accept, refine or reject; repeat until good and use an
   independent reviewer where the package requires it.

Exact commands remain valid in agent instructions, engineering contracts and
execution traces. On a participant page they must be explicitly marked as
`agent-run` or `non-executable example`; they are never framed as human input.

### 2.3 One required agent, optional comparison

One active Claude Code or Codex session is sufficient for the mandatory workshop
path. Using the other agent is an optional portability/evaluation exercise, not a
completion dependency.

The preferred route is Claude Code with Claude Opus 4.8. The material must not
promise that a Claude Pro allowance lasts for the complete day. The immediate
provider-neutral fallback is Codex. Further fallbacks are a separately assigned
compliant Max/Team/usage-credit seat and a trainer-run or validated replay path.
Shared consumer-account credentials are not an accepted fallback.

Dynamic workflows are optional when the account supports them. The portable
skill plus RUG path is the required baseline.

## 3. AI-reinforced human learning loop

The pedagogical micro-loop used throughout the workshop is:

`human prediction or decision -> AI explanation/execution -> evidence inspection -> correction -> human synthesis`

The participant updates both the artifact and their mental model. This is a
workshop-owned pedagogical concept, not model training and not RLHF. Use the full
Hungarian participant-facing name, **AI-val megerősített emberi tanulási ciklus**,
instead of the ambiguous `RHEL` acronym.

## 4. Shared visual contract

`materials/repo-terkep/index.html` is the initial quality reference, not a frozen
template. The shared system uses semantic roles already present in the site
palette:

| Role | Purpose |
|---|---|
| human | intent, approval, decision and learning synthesis |
| agent | investigation, generation and bounded execution |
| machine | deterministic hook, validator or automated gate |
| artifact | versioned output passed to the next stage |
| evidence | observable result that supports a conclusion |
| risk | blocked state, unsafe action or unresolved decision |

Every diagram must answer a declared learner question and include a one-sentence
takeaway plus a complete text equivalent. Use color, grouping and whitespace to
communicate meaning; do not use color as the only signal.

### 4.1 Diagram navigation

A node is a link only when it represents a real canonical destination such as a
module, glossary entry, toolkit guide or participant surface. Linked nodes must:

- use an internal, route-resolved link;
- expose an accessible name;
- show hover and keyboard-focus affordance;
- have the same target available in the adjacent HTML fallback.

Pure explanatory states and process steps stay static. Making every shape look
clickable would be misleading.

### 4.2 Readability

- Prefer full-width or stacked visuals when a grid would shrink explanatory text.
- Author SVG text for a readable rendered size; 13 px table-like SVG text is not
  an acceptable desktop target.
- Preserve mobile local scrolling only when the information cannot be expressed
  responsively without losing its relationships.
- Keep diagrams complete and readable in print and without JavaScript.

### 4.3 Instruction surfaces

- Inline code uses the light inline-code treatment.
- A command, prompt, transcript or multi-line technical example uses one
  uninterrupted dark surface with white monospace text.
- Nested `pre code` must not add another background, border or padding.
- Page `h1` text is plain. Glossary links belong in the lead or first explanatory
  occurrence, not inside the page title.

## 5. Package ownership

### Package A -- visual foundation and integration coordinator

Owns the canonical plan, material standard, shared assets, material-site builder
and validators, root surface and the coordinator-owned non-module material pages.
It creates the early-merge A0 foundation, continues the non-module visual
migration on exclusive paths and runs final composed-main acceptance.

### Package B -- AI-first C0-C7 participant journey

Owns preparation, agenda, big picture, the eight module detail pages, their
Markdown counterparts and the golden-thread package. It converts the complete
journey from human-entered commands to agent-executed work while preserving the
central invented workload and checkpoint evidence.

### Package C -- AI toolchain, glossary, starter and take-home toolkit

Owns the tools chapter, glossary, participant starter and participant-readable
toolkit guides. It completes the capability model, reconciles shared glossary
definitions, adds official further reading and converts starter/toolkit recipes to
agent execution.

The Linear descriptions are the package specifications and contain the exact path
boundaries. Root/shared files remain Package A-owned.

## 6. Delivery and merge sequence

1. Package A produces A0: this plan, canonical standards, shared styles and focused
   regression gates.
2. A fresh-context reviewer verifies A0. Accepted findings are fixed and checked
   once as a coherent package.
3. The human decides whether A0 may merge to `main`.
4. Packages B and C branch from the accepted A0 SHA. Package A may continue on
   its exclusive page paths.
5. Each package performs one proportionate consolidated validation and RUG loop,
   then requests human merge approval.
6. After all three packages merge, Package A runs one final composed-main build,
   link/glossary/diagram/public-boundary gate and desktop/mobile/keyboard/print/
   no-JS browser acceptance.

Do not run the full validation matrix after every sentence, SVG node or CSS edit.

## 7. Ratcheted migration debt

A0 must keep `main` green while preventing new regressions. The render validator
therefore records the exact pre-existing pages that still contain a linked `h1`
or a second local shell. New occurrences fail immediately. Packages A, B and C
remove their named legacy occurrences; Package A removes the temporary allowlist
at final integration. No new exception may be added without a recorded human
decision.

## 8. Programme acceptance

The programme is complete only when:

- outside the bootstrap exception, no participant instruction asks the human to
  enter exact technical syntax;
- every technical operation names Claude Code or Codex as executor;
- every participant exercise exposes agent action, human gate, evidence and a
  repeat-until-good path;
- one primary agent is enough for the mandatory route;
- browser automation is the Module 6 default;
- the legacy route groups use the shared semantic visual system;
- every meaningful diagram destination is mouse- and keyboard-operable with an
  equivalent HTML link;
- block code and prompts render as one dark surface with white monospace text;
- the glossary has one site shell, readable overview visuals and consistent
  JSON/HTML/Markdown definitions;
- the tools chapter covers Claude Code, Codex, plugins, skills, hooks, workflows,
  Goals, RUG, guardrails, MCP, browser agents and project memory;
- capacity/fallback guidance makes no unlimited-Pro or shared-credential promise;
- all mechanical gates and the final browser matrix pass;
- fresh-context review leaves no verified blocker/high finding.

## 9. Current official product references

Fast-moving product statements must be rechecked against primary sources when
their package is implemented:

- Claude Opus: <https://www.anthropic.com/claude/opus>
- Claude Code with Pro/Max: <https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan>
- Max plan: <https://support.claude.com/en/articles/11049741-what-is-the-max-plan>
- Claude Code Goals: <https://code.claude.com/docs/en/goal>
- Claude Code plugins: <https://code.claude.com/docs/en/plugins>
- Plugin discovery: <https://code.claude.com/docs/en/discover-plugins>
- Extension overview: <https://code.claude.com/docs/en/features-overview>

Product documentation supports tool facts. The provider-neutral engineering
method, human gates and evidence contract remain the canonical workshop promise.
