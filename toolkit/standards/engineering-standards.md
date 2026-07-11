# Canonical engineering standards — participant template

This is the single checklist used by makers, fixers, and reviewers. Link to this file; do not copy it into role prompts. Add project-specific rules here once, then keep all roles aligned.

## Scope and contract

- [ ] Implement only the approved task and acceptance criteria.
- [ ] Prefer the smallest complete vertical slice; apply KISS and YAGNI.
- [ ] State and justify deviations from the approved plan.
- [ ] Escalate unresolved ambiguity as `DECISION REQUIRED: <decision> | OPTIONS: <options> | IMPACT: <impact>`.

## Correctness and evidence

- [ ] Cover observable behavior, important failures, and boundary cases.
- [ ] Run the repository's real checks; do not substitute narrated confidence for execution.
- [ ] Keep test doubles contract-equal to real adapters; use shared contract tests where behavior can drift.
- [ ] Record exact commands, results, skipped checks, and remaining risk.

## Design and maintainability

- [ ] Keep responsibilities separated and dependencies pointing toward domain policy.
- [ ] Introduce a port/interface only at a genuinely varying external boundary.
- [ ] Prefer clear names and small cohesive units; remove dead code.
- [ ] Avoid premature abstraction: small duplication is cheaper than the wrong abstraction.
- [ ] Compose concrete dependencies at the application composition root, not at import time.

## Security and public-repo hygiene

- [ ] Do not expose secrets, tokens, invite links, private URLs, customer names, or real commercial data.
- [ ] Use explicitly invented examples and synthetic test data.
- [ ] Validate untrusted input and preserve authorization boundaries.
- [ ] Fail closed when a test-only or development-only switch reaches preview/production.

## Delivery quality

- [ ] Keep code, AI instructions, comments, and technical artifacts in English unless the project says otherwise.
- [ ] Update docs and decisions when behavior or architecture changes.
- [ ] Preserve repository conventions and avoid unrelated formatting or refactors.
- [ ] Obtain independent fresh-context review and verify each accepted fix.

## Project-specific mechanical gates

Replace these placeholders with the repository's actual commands before use:

- Format/lint: `<command>`
- Typecheck/build: `<command>`
- Unit/contract tests: `<command>`
- Integration/e2e: `<command>`
- Security/public-content guard: `<command>`
