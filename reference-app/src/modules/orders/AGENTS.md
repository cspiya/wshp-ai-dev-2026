# orders module — agent instructions

- Only `orders.contract.ts` is public.
- Persistence is injected through `OrderRepo`; the repo assigns id,
  sequential order number and placedAt.
- Money math lives ONLY in `domain/order.ts` (integer HUF; discount floors,
  VAT rounds half-up). Never recompute totals elsewhere.
- Both procedures are public — guest checkout is the feature. Payment is the
  checkout module's job; this module only records the authorization id.
- Every adapter passes `infra/orders.repo.contract.test.ts`.
