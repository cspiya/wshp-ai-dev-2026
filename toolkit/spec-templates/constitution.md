# Project constitution

This file records invariants that every feature specification, plan, task, and implementation
must obey. Keep it short, versioned, and owned. A feature cannot silently override it.

## Identity and mission

- Product/repository mission:
- Primary users and outcomes:
- Explicit non-goals:

## Non-negotiable boundaries

- Allowed modules/data:
- Forbidden modules/data:
- Stable public contracts:
- Authorization and privacy invariants:
- Public-repository hygiene:
- Supported compatibility/locale/time assumptions:

## Canonical standards and real gates

- Repository instructions:
- Engineering standard:
- Required check commands:
  - Format/lint:
  - Type/build:
  - Unit/contract/integration:
  - End-to-end/manual:
  - Security/public-content:
- Evidence location:

## Decision authority

| Decision type | Human owner | Agent may decide? | Escalation path |
|---|---|---|---|
| Product behavior |  | no | `DECISION REQUIRED` |
| Architecture inside approved boundaries |  | with evidence | review |
| Security/privacy exception |  | no | stop and escalate |
| Scope change |  | no | return to spec gate |

## Change control

- Constitution version:
- Approved by:
- Approved at:
- Next review:
- Supersedes:

A feature that conflicts with this constitution is `BLOCKED` until a human owner changes
the constitution or the feature. The implementation agent must not invent an exception.

## Constitution gate

- [ ] Mission and non-goals are explicit.
- [ ] Boundaries and stable contracts are named.
- [ ] Real check commands and evidence location are known.
- [ ] Decision owners are named.
- [ ] No unresolved contradiction exists.
- [ ] Human approval, version, and timestamp are recorded.
