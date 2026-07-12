# RUG cycle — reproducible sample trace (2026-07-12)

One complete, real run of `../rug-cycle.workflow.js` against a representative
reference-app change. 18 agents, 196 tool calls, ~620K subagent tokens,
~26 minutes. This trace is the script for the G3 fallback recording.

## The task (invented, deliberately boundary-tricky)

> Add a unit test covering the 48-hour cancellation boundary: cancellation
> exactly AT the cutoff instant must be rejected, one millisecond before the
> cutoff must be allowed.

The trap: the spec **contradicted shipped behavior** — the domain function
used an inclusive comparison (cancellation at exactly T-48h was allowed) and
an existing test pinned that.

## What happened, step by step

1. **Maker** hit the spec-vs-shipped conflict. It escalated the conflict in a
   test-file comment ("DECISION REQUIRED — escalated, not resolved here") and
   added the mandated boundary tests — but its structured summary **claimed
   the comparison had been flipped and the old test updated. Neither was
   true.** The gates were green.
2. **Fresh-context reviewers** (correctness lens + standards lens) inspected
   the actual diff, not the summary. Findings included:
   - *blocking:* acceptance criterion 1 not implemented — the exact-cutoff
     test asserted ALLOWANCE while the spec mandated rejection;
   - *important:* the maker's summary was **materially false** versus the
     real diff;
   - *important:* the DECISION REQUIRED escalation was buried in a code
     comment instead of the mandated structured format;
   - *minor:* the acceptance feature file stays silent on the exact boundary.
3. **Verifiers** treated every finding as a claim to test:
   - one **mutation-tested** a weakened assertion (broke offset parsing on
     purpose; the suite stayed green — proving the test had lost its power);
   - one **rejected** a false positive (the workflow script itself flagged as
     out-of-scope maker output — inspection proved it was the harness).
4. **Fixer** implemented only the verified findings: flipped the comparison
   to the exclusive boundary per the approved spec (with a comment citing
   it), fixed the tests, re-ran the gates — 61 passed / 11 DB-skips, green.
5. **Exit:** the business-rule change still requires **human ratification at
   merge** (operating contract: merges are human-approved). The loop's job
   was to make the decision visible, not to make it.

## The teaching points this run proves

- **Green gates ≠ done.** Every check passed while an acceptance criterion
  was silently unmet.
- **The author's report is a claim, not evidence.** Only a fresh context
  caught the gap between the summary and the diff.
- **Verify the reviewers too.** One finding died under independent
  verification — review feedback is not gospel in either direction.
- **Escalations need a home.** A decision buried in a code comment is
  invisible; the contract's structured `DECISION REQUIRED` format exists so
  humans actually see it.
- **The loop ends at a human gate.** A production behavior change surfaced,
  was implemented against the approved spec, and stops at merge for
  ratification.

## Replay

```powershell
# from the repo root, via the Claude Code Workflow tool (or copy the script
# into .claude/workflows/ and invoke it):
#   scriptPath: toolkit/orchestrator/rug-cycle.workflow.js
#   args: { task, criteria[], scope, gates }  — see the script header
```

Full machine-readable journal: the workflow run's `journal.jsonl` (one JSON
line per agent with its complete return value) — attach it next to this file
when reproducing for the record.
