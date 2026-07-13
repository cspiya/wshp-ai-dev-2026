# `orders` module

The webshop purchase journey's backend (WEN-324): a guest (person or
company) buys workshop seats — up to 5 per workshop, above that the shop
points at a custom group offer. Totals are integer HUF: net subtotal, an
optional catalog coupon (WELCOME10, 10% off net, floored), 27% VAT rounded
half-up, gross. `preview` quotes a cart; `place` validates the full draft,
recomputes totals server-side, records the payment authorization id issued
by the checkout module, and persists with a sequential `REF-2026-XXXX`
order number. Clients send only `{ workshopId, quantity }` per line — title
and unit price are resolved server-side from the workshop catalog (injected
`WorkshopSource`), so a client can never influence what it pays. All data is
invented training data.
