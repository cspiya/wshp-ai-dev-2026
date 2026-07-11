---
name: rug-review
description: Run a Repeat-Until-Good independent review of a completed code change, test change, or technical artifact. Use when a maker reports a change ready for review, when green checks need a fresh-context challenge, when reviewer findings must be deduplicated and verified, or when accepted fixes require regression re-review.
---

# RUG Review

## Prepare the review packet

Read the approved spec, acceptance criteria, changed artifacts or diff, relevant repository instructions, and test evidence. Locate and read `toolkit/standards/engineering-standards.md`; stop with `DECISION REQUIRED` if the canonical standard or approved behavior is unavailable.

Do not load the maker's chain of thought, self-review, or desired verdict. Preserve fresh-context independence.

## Review

1. Select only relevant roles from `toolkit/orchestrator/reviewer-agents.md`.
2. Check the complete canonical standard, emphasizing the selected risk surface.
3. Inspect code paths and run focused reproduction checks when safe and available.
4. Report every finding in the required structured format with location, evidence, impact, and a verification method.
5. State `No verified findings` when no issue is supported. Never fill a finding quota.

## Verify and bounce back

Apply `toolkit/orchestrator/dedup-and-verify.md` to merge duplicates and classify findings as `accepted`, `rejected`, or `decision-required`. Treat reviewer output as a claim to verify.

Send accepted findings to a separate fixer context with the approved spec and the same canonical standard. Require a regression check where feasible. Re-run affected mechanical gates, then start a fresh review of the new state.

Repeat until the exit criteria in `toolkit/orchestrator/README.md` hold. Report exact commands and outcomes, unresolved human decisions, and residual risks.
