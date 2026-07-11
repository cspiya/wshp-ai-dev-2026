# checkout module — agent instructions

- Only `checkout.contract.ts` is public.
- `PaymentPort` is the varying vendor boundary and lives in application code.
- Adapters never compose themselves; the composition root injects one.
- Every adapter passes the shared PaymentPort contract suite.
