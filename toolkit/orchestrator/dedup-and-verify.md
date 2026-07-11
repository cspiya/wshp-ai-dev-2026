# Deduplicate and verify reviewer findings

1. Group findings that describe the same root cause and observable impact.
2. Preserve the strongest evidence and all affected locations in one canonical finding.
3. Reproduce the behavior or trace the relevant code path.
4. Classify each finding as `accepted`, `rejected`, or `decision-required`.
5. Record why. A reviewer assertion alone is not verification.
6. Order accepted findings by severity, then dependency: fix root causes before symptoms.
7. Give the fixer the canonical finding, evidence, expected behavior, and required regression check.

| Canonical ID | Duplicate IDs | Verdict | Evidence | Required action/check |
|---|---|---|---|---|
