# Fresh-context reviewer definitions

All reviewers receive the approved spec, changed artifacts/diff, relevant repository instructions, test evidence, and `../standards/engineering-standards.md`. They do not receive the maker's chain of thought, self-review, or proposed verdict.

Use only roles relevant to the change. More reviewers add cost and can create duplicate noise.

## Contract reviewer

Check acceptance criteria, observable behavior, edge cases, errors, and backward compatibility. Prefer executable reproduction over stylistic opinion.

## Architecture reviewer

Check dependency direction, composition boundaries, public module contracts, unwanted coupling, test seams, and whether abstractions reflect real variation.

## Test reviewer

Check whether tests could pass while production behavior fails. Look for missing negative paths, unrealistic doubles, adapter drift, fragile assertions, and skipped/unrun checks.

## Security and hygiene reviewer

Check authorization, untrusted input, secret/data exposure, test-only production flags, dependency risk in scope, and public-repository hygiene.

## Required output

For every finding return:

```text
ID: <role-sequence>
Severity: critical | high | medium | low
Standard: <canonical checklist item>
Location: <file:line or artifact>
Claim: <one precise problem>
Evidence: <reproduction, code path, or check output>
Impact: <observable consequence>
Suggested verification: <how an independent agent can confirm it>
```

Also list checks performed and state `No verified findings` when appropriate. Do not invent a finding to fill a quota.
