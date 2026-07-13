# v0 design brief — reference app visual system

**Status:** pre-generation contract; visual direction not yet selected

**Work package:** `WEN-311`

**Canonical plan:** [`../../PLAN.md`](../../PLAN.md)

**Canonical standard:**
[`../../../toolkit/standards/engineering-standards.md`](../../../toolkit/standards/engineering-standards.md)

This brief is the contract given to v0 and the human design gate. It describes the
same working application in three visual directions. It does not authorize a new
product, new behavior, or a new architecture.

## 1. Product story

The reference app is an explicitly invented training webshop and a worked example
of agent-ready software delivery. It must make two stories visible at the same time:

1. a user can discover a workshop, calculate a price, authorize a fake payment,
   register, confirm, and cancel;
2. an engineer can see that the app is a validation workload for specification,
   modular boundaries, quality gates, RUG review, evidence, and deployment.

The interface should feel deliberately designed for a technical workshop: clear,
confident, memorable, and easy to demonstrate on a projector. It must not look like
a generic SaaS admin dashboard or an unfinished component-library sample.

## 2. Users and primary jobs

| User | Primary job | Design implication |
|---|---|---|
| Workshop participant | understand the full flow and safely operate it | obvious sequence, plain labels, visible feedback and recovery |
| Instructor | demonstrate one checkpoint at a time on a projector | large hierarchy, stable navigation, state that can be narrated |
| Developer/reviewer | inspect architecture and evidence without confusing it with product UI | restrained technical metadata, links to the golden path, no debug noise in the main journey |

The application language remains English because it is a technical artifact. All
sample content stays lifelike but explicitly invented.

## 3. Current UI truth

The current UI is functional but visually generic:

- root layout uses Geist Sans/Mono and neutral shadcn tokens;
- home is one centered card with health status and text links;
- `/workshops` is one CRUD card with a desktop-first table and inline form;
- `/shop` is one long card that progressively reveals Auth, Price, Payment and
  Registration sections;
- loading, empty and error copy exists, but there is no shared navigation, progress
  language, visual system, mobile table strategy, or completion moment;
- domain, tRPC, Auth, persistence and tests already exist and are not design scope.

Baseline screenshots are a required generation input, but cannot be captured until
the approved browser connection is available. Their absence blocks v0 generation;
it does not authorize guessing that the current app is visually accepted.

## 4. Information architecture

Use one shared application shell:

- compact wordmark: `Reference Lab`;
- persistent primary navigation: `Overview`, `Workshops`, `Shop journey`;
- small environment/proof label such as `INVENTED TRAINING DATA`;
- page-level title, one-sentence purpose, and contextual next action;
- footer or low-emphasis proof strip linking the experience to the golden-path
  architecture without exposing internal/private project state.

### Route purpose

| Route | Purpose | Primary action |
|---|---|---|
| `/` | explain what the reference workload proves and show system health | start the shop journey or inspect workshops |
| `/workshops` | demonstrate the golden-path CRUD slice | create or edit an invented workshop |
| `/shop` | run the cross-slice end-to-end journey | complete the next available step |

The shop journey must expose the sequence without pretending later steps are
available early. Prefer a visible four-step rail with current/completed/locked
states over one undifferentiated long form.

## 5. Required surface and state matrix

| Surface | Required states to design |
|---|---|
| Shared shell | desktop nav, compact mobile nav, active route, keyboard focus |
| Overview/health | checking, healthy, API unreachable |
| Workshops | loading, populated, empty, create, edit, validation errors, save pending, delete pending/failure |
| Account | signed out, form pending, auth error, signed in, sign-out pending |
| Pricing | initial values, calculate pending, valid quote, invalid/error |
| Payment | locked, ready, pending, authorized, declined/error |
| Registration | workshop loading/empty/error, ready, pending, confirmed, cancelled, unauthorized |
| Journey ending | success summary and a clear restart/replay action |

Do not fabricate backend states or procedures to make a mockup easier. A visual state
may be documented for later implementation, but the integrated UI must be driven by
the existing real query/mutation state.

## 6. Responsive contract

- Design mobile-first from 360 px, then tablet and desktop/projector widths.
- Primary actions remain visible without horizontal page scrolling.
- The workshops table becomes a deliberate compact/card or labeled-row treatment on
  narrow screens; do not merely shrink six columns.
- Minimum interactive target is 44 px where practical.
- Forms are single-column on mobile and may become two-column only when label/value
  comprehension remains obvious.
- The journey rail may scroll or stack, but current/completed/locked meaning must be
  perceivable without color alone.
- Projector mode needs strong hierarchy and readable body text at a distance.

## 7. Accessibility contract

- Preserve semantic landmarks, heading order, labels, table meaning, and `role=alert`
  behavior.
- Provide visible `:focus-visible` states with sufficient contrast.
- Never communicate status using color alone; pair color with text/icon/shape.
- Support keyboard operation for navigation, forms and all journey actions.
- Respect reduced-motion preference; animation is optional and never required for
  comprehension.
- Use AA-level contrast for normal text and controls.
- Loading controls expose disabled/pending language, not only a spinner.
- Destructive cancellation/delete actions remain visually distinct but are not
  presented as the primary next action.

## 8. Protected behavior and files

### v0 may change

- `src/app/globals.css` design tokens and presentation utilities;
- shared layout/navigation presentation in `src/app/layout.tsx` or new
  presentation-only components;
- route-shell presentation in `src/app/page.tsx`, `src/app/workshops/page.tsx` and
  `src/app/shop/page.tsx`;
- existing UI components under module `ui/` folders and `src/app/shop/` while
  preserving their inputs, queries, mutations and observable behavior;
- shadcn primitives or new presentation-only components under `src/components/ui/`;
- public, invented copy and accessible labels that do not change business meaning.

### v0 must not change

- any `domain/`, `application/`, `infra/`, `*.contract.ts`, platform API/Auth/DB,
  migration, script, test, workflow, env or agent-rule file;
- tRPC procedure names, inputs, outputs or call order;
- pricing, payment, registration, cancellation or authorization rules;
- Drizzle schema, Neon setup, Auth/session model or `PaymentPort`;
- tests merely to accept a different UI behavior;
- package dependencies without an explicit, reviewed need;
- routes or navigation targets outside `/`, `/workshops`, and `/shop`.

Generated code is an untrusted proposal. The accepted diff is normalized to the
existing shadcn/Tailwind/Geist system and passes the normal RUG and application gates.

## 9. Secret-isolation gate

Read-only Vercel inventory on 2026-07-13 found encrypted `DATABASE_URL` and
`DATABASE_URL_UNPOOLED` entries in Development, Production, and branch-scoped Preview
environments. Neon Auth variables were not present. No values were read or copied.

Decision for this package:

- import the GitHub repository and select the `reference-app` monorepo root;
- **do not connect** the production-linked Vercel project to v0;
- if the selected v0 workflow cannot proceed without a Vercel project, stop and ask
  for a human decision before creating a dedicated secret-free design project;
- do not paste tokenized import URLs, private preview URLs or environment files into
  prompts, Git, screenshots or the journal.

## 10. Three directions for v0

All directions use the same content, routes, states and protected boundaries. They
must differ in composition, rhythm and visual voice — not only in accent color.

### Direction A — Precision Workshop Console

- Mood: precise engineering instrument, calm rather than “cyberpunk”.
- Composition: dark ink shell, warm off-white work surfaces, amber proof accents,
  strong grid and mono micro-labels.
- Signature: visible journey rail and compact evidence/proof strip; status resembles
  an instrument panel without becoming a monitoring dashboard.
- Avoid: neon gradients, terminal cosplay, excessive dark cards, tiny monospace body
  copy.

### Direction B — Editorial Field Guide

- Mood: modern technical handbook, human and tactile.
- Composition: warm paper background, near-black type, coral or vermilion actions,
  editorial margins, numbered chapters and generous whitespace.
- Signature: each shop step reads like a field-guide chapter; workshop rows become
  well-labelled specimens/cards on mobile.
- Avoid: magazine decoration, serif body copy that harms form readability, washed-out
  contrast.

### Direction C — Mission Passport

- Mood: energetic workshop expedition, playful but professional.
- Composition: deep indigo with cyan/mint proof accents, clear checkpoint stamps,
  modular panels and a stronger success moment.
- Signature: the user collects four visible completion marks through the shop flow;
  overview explains the validation mission.
- Avoid: gamification points, leaderboards, cartoon styling, color-only progress.

## 11. Common v0 prompt

Use this prompt once per direction, appending the direction-specific paragraph above:

```text
Redesign the existing `reference-app` UI in this imported repository. This is a
working Next.js 16 App Router application using React 19, Tailwind CSS 4, shadcn/ui,
Geist, tRPC, Zod, Drizzle, Neon and Neon Auth.

Treat `reference-app/docs/design/v0-design-brief.md` as the design and safety
contract. Preserve all existing routes, queries, mutations, business behavior,
test IDs and module boundaries. Change presentation only. Do not edit domain,
application, infra, contracts, platform, migrations, scripts, tests, workflows,
environment files or agent rules. Do not add a backend, database, authentication
system, payment system, route or product feature.

Produce a coherent responsive direction for `/`, `/workshops` and `/shop`, including
the documented loading, empty, error, unauthorized, pending and success states.
Use existing shadcn primitives and Tailwind tokens, semantic HTML, visible focus,
AA contrast and reduced-motion-safe behavior. Mobile at 360px and projector-readable
desktop are both acceptance targets. Return a reviewable branch/version; do not merge.

Visual direction: <append exactly one direction from section 10>.
```

## 12. Human design gate

Compare the three rendered directions using the same route, content and viewport.

| Criterion | Weight |
|---|---:|
| Journey clarity and state comprehension | 25 |
| Workshop teaching/story value | 20 |
| Responsive and required-state coverage | 20 |
| Accessibility quality | 15 |
| Distinctive but professional visual voice | 10 |
| Fit with existing shadcn/Tailwind architecture | 10 |

The human records:

- selected direction and score;
- rejected directions and one-sentence reasons;
- any elements intentionally borrowed from a rejected direction;
- required corrections before integration.

No generated direction enters the application branch before this gate closes.

## 13. Evidence required from v0

- direction name and sanitized v0 version/branch identifier;
- screenshots of Overview, Workshops and three Shop checkpoints at desktop;
- Overview, Workshops and active Shop step at 360 px;
- visible loading/error/unauthorized example without fabricated backend changes;
- generated file list and diff summary;
- statement that no protected file changed;
- human scorecard and decision.
