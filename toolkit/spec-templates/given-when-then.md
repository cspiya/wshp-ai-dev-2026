# Given–When–Then scenarios

## Scenario: `<observable behavior>`

**Given** `<relevant initial state, actor, and permissions>`

**When** `<one user/system action>`

**Then** `<observable result>`
**And** `<additional externally visible result, if necessary>`

### Test mapping

- Test level/file:
- Important boundary values:
- Required fake/real adapter contract:

Write separate scenarios for denial, invalid input, dependency failure, and concurrency only when they are meaningful. Avoid implementation details unless they are part of the public contract.
