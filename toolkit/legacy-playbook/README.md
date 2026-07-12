# Legacy playbook — safety net first, modernization second

Participant-shareable kit for working with AI agents on legacy .NET /
MS-SQL code. Everything here uses INVENTED sample data.

## The method (in this order)

1. **Characterize the behavior you must not break.**
   No refactoring before a pinning test exists. Characterization tests
   record what the code DOES today — bugs included; they are a safety
   net, not a correctness claim.
2. **Find the cheapest seam.** In the sample the database calls are
   overridable (`subclass-to-test`); that one virtual method is what makes
   the class testable without touching its logic.
3. **Pin the database twin too.** The same rules usually live twice
   (C# + stored proc). tSQLt fakes the tables and pins the proc's numbers.
4. **Strangle, don't rewrite.** A YARP proxy carves out one route at a
   time; the pinned tests referee old vs new until the numbers match.
5. **Only then let the agent refactor** — with the tests as the agent's
   Definition of Done, same as in greenfield work.

## Contents

| Path | What it is |
|---|---|
| `sample/LegacyShop/OrderTotalsService.cs` | Deliberately gnarly service: hidden static cache, magic rules, culture-sensitive output, hidden clock |
| `sample/LegacyShop.Tests/` | Runnable characterization tests (xunit + Verify snapshots) — `dotnet test` from that folder |
| `sample/sql/usp_CalculateOrderTotals.sql` | The stored-proc twin of the same rules (cursor, temp table, GETDATE smell) |
| `sample/sql/tsqlt-template.sql` | tSQLt test-class template pinning the proc |
| `strangler-fig-yarp.md` | The proxy seam: one modernized route, catch-all stays legacy |

## Run the lab

```powershell
cd toolkit/legacy-playbook/sample/LegacyShop.Tests
dotnet test
```

Expected: 3 passed. Then try the lab exercise: change one magic number in
`OrderTotalsService.cs` and watch the snapshot test name exactly what
behavior you just altered — that feedback is the whole point.

## Traps worth teaching

- The loyalty discount depends on `DateTime.Today`/`GETDATE()`, not the
  statement period — snapshots stay deterministic only because the test
  anchors the first-order year RELATIVE to today. Hidden clocks are the
  most common characterization surprise.
- The output is culture-sensitive; the test pins `hu-HU`. On a
  differently-configured server the "same" code produces different bytes.
- The static cache leaks state between calls — tests must use distinct
  customer ids or they pass for the wrong reason.
