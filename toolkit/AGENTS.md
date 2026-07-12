# Participant agent instructions — starter

## Mission

Deliver the smallest change that satisfies the approved specification. Treat the specification, repository rules, and test evidence as the working contract.

## Before changing code

1. Read the task, the approved spec, and the nearest repository instructions.
2. Read `toolkit/standards/engineering-standards.md` and apply every applicable item. Update this path if the toolkit is copied elsewhere.
3. Inspect the existing implementation and tests. Do not assume the task description is current.
4. If acceptance criteria, ownership, or safety boundaries are ambiguous, return `DECISION REQUIRED` with options and impact.

## While changing code

- Keep the change inside the agreed scope.
- Prefer a vertical, testable slice over broad scaffolding.
- Preserve public contracts unless the approved spec changes them.
- Never use production/customer data in examples, fixtures, logs, or prompts.
- Record intentional deviations from the plan and why they were necessary.

## Definition of done

- Acceptance criteria are covered by tests or explicit verification evidence.
- Required lint, typecheck, unit, integration, and e2e commands have run.
- Documentation changed when behavior or an operating rule changed.
- An independent fresh-context reviewer has reviewed the change against the same canonical standard.
- Accepted findings were fixed and re-verified; rejected findings have evidence.

## Evidence format

Report changed files, commands run with outcomes, remaining risks, and any human decision still required. Never claim a check ran when it did not.

## House rules

- **SOLID without scaffolding:** introduce a port/interface only at a boundary
  that actually varies (database, payment vendor, LLM provider). One
  implementation means no interface. No factories, wrappers, or config objects
  "for flexibility" that nothing exercises.
- **Language policy:** code, prompts, AI instructions, commits, and technical
  artifacts are English; participant-facing prose follows the project's
  audience language. Business-spec examples may be written in the audience
  language and translated into English acceptance criteria.
