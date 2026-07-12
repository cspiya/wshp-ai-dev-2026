# Task breakdown

Required input: approved spec and plan versions. Tasks must be independently verifiable,
small enough to review, and assigned exclusive file/module ownership where parallel work is used.

## Input versions

- Constitution:
- Spec:
- Plan:
- Human approval evidence:

## Ordered tasks

| ID | Task/outcome | Exclusive scope/owner | Depends on | AC IDs | Done evidence | Status |
|---|---|---|---|---|---|---|
| T1 |  |  |  |  |  | not-started |

## Per-task execution contract

Before editing, the builder:

1. restates the linked ACs and scope;
2. reads repository instructions and canonical standards;
3. reports `DECISION REQUIRED` rather than inventing behavior;
4. runs the named checks and records command, exit code, and relevant output;
5. hands the artifact and evidence to an independent fresh-context review.

A task is done only when its ACs pass, accepted findings are fixed and re-verified, and
remaining risk has a human owner.

## Verification matrix

| AC ID | Task(s) | Automated evidence | Manual evidence | Verdict |
|---|---|---|---|---|
| AC-1 |  |  |  | pending |

## Decision and deviation log

| Decision/deviation | Owner | Options/impact or reason | Outcome | Evidence |
|---|---|---|---|---|

## Common failures and Plan B

- **Hidden shared-file overlap:** pause; re-slice ownership before parallel edits.
- **Task exposes a product gap:** mark `BLOCKED` and return to the spec gate.
- **Configured check is unavailable:** record the failure; use the agreed local or
  trainer-owned fallback, but do not claim the original check passed.
- **Plan no longer fits the code:** document evidence and request plan re-approval;
  do not silently expand scope.
