# Repeat-Until-Good orchestration contract

This is a manual, runtime-neutral workflow contract. It works with coding-agent products that can create independent sessions or subagents. Product-specific commands and hook schemas are adapter points: use the official documentation of the selected tool.

## Inputs

- approved spec and acceptance criteria;
- bounded file/repository scope;
- `../standards/engineering-standards.md`;
- repository instructions and actual check commands;
- a place to record the run log (issue comment, PR, or local note).

## Loop

```text
PLAN -> SPEC GATE -> IMPLEMENT -> RUN CHECKS
  -> FRESH REVIEWERS -> DEDUPLICATE + VERIFY FINDINGS
  -> FIX ACCEPTED FINDINGS -> RE-RUN CHECKS -> RE-REVIEW
  -> repeat until no verified blocking findings remain
```

1. **Plan.** Inspect current code and write a small plan with files, risks, and verification.
2. **Spec gate.** A human approves behavior, scope, and acceptance criteria. No implementation before approval.
3. **Implement.** Give the maker the task, approved spec, bounded scope, repository rules, and a link to the canonical standards.
4. **Test.** Run the real mechanical gates and capture exact evidence.
5. **Review independently.** Start fresh reviewer contexts. Give them artifacts, not the maker's reasoning or conclusions. Use one reviewer per genuinely different risk surface when useful.
6. **Deduplicate and verify.** Merge equivalent findings. Reproduce or inspect each claim before accepting it; review feedback is evidence to test, not gospel.
7. **Bounce back.** Give only verified findings to a fixer, with severity, evidence, expected behavior, and the same canonical standards.
8. **Repeat.** Re-run affected and regression checks, then ask a fresh reviewer to inspect the new state. Close only when the exit criteria hold.

## Exit criteria

- the approved acceptance criteria are demonstrably satisfied;
- all required checks pass, or an explicit human-owned exception records the risk;
- no verified critical/high finding remains;
- every accepted finding is fixed and re-verified;
- the run log links spec, evidence, findings, decisions, and residual risk.

## Hordozható, agent által futtatott recept

Mondd Claude Code-nak vagy Codexnek, hogy a jóváhagyott specből, a repószabályokból
és a kanonikus standardból hajtsa végre a következő receptet. A fájl-, Git- és
ellenőrzési műveleteket az agent végzi; az ember jóváhagyja a specet, review-zza
az evidence-et és dönt a merge-ről.

1. Copy `../spec-templates/` into the work item and complete it.
2. Apply `prompts/maker.md` in one agent context.
3. Start a new context for each selected role in `reviewer-agents.md`; apply `prompts/reviewer.md`.
4. Consolidate results with `dedup-and-verify.md`.
5. Apply `prompts/fixer.md` in a builder/fixer context.
6. Run the configured checks, then repeat steps 3–5 until the exit criteria hold.

Do not pretend context is fresh by merely changing the role in the same conversation. Start a new agent/session with only the review packet.

## Minimal run log

```markdown
Task/spec:
Scope:
Maker change summary:
Checks and outcomes:
Reviewer roles:
Verified findings (accepted/rejected + evidence):
Fixes and re-checks:
Human decisions:
Residual risks:
```

## Executable form

Ez a futtatható workflow opcionális adapter az azt támogató környezetekhez; nem
kötelező, Pro-safe alapút. A hordozható baseline a fenti szerződés, a repó skillje
és egy valóban friss kontextusú reviewer.

`rug-cycle.workflow.js` is the runnable distillation of this contract for
Claude Code's Workflow tool: maker → two fresh-context reviewer lenses →
per-finding verification → fixer, max two rounds, every prompt LINKING the
role files and the canonical standard. `trace/sample-run.md` is one complete
real run (with the machine-readable journal beside it) — including a
materially false maker summary caught by review, a mutation-tested finding,
and a rejected false positive.
