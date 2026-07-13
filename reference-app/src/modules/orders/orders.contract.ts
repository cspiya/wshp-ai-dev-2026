/**
 * PUBLIC CONTRACT of the `orders` module (webshop purchase journey).
 * This is the ONLY file other modules (and src/app, src/platform, scripts,
 * e2e) may import from `orders` (lint-enforced). Every export is a promise;
 * exports are added when a consumer appears, never "for later".
 */

// The use-cases as a router FACTORY — the composition root
// (src/platform/api/root.ts) picks the repo adapter and injects it.
export { createOrdersRouter } from "./application/orders.router";

// The one repo adapter the composition root can choose today (a Drizzle
// adapter is a documented follow-up — WEN-324 build journal).
export { createInMemoryOrderRepo } from "./infra/in-memory-order-repo";

// The slice's UI entry — rendered by src/app/shop/page.tsx. The journey's
// client components import the domain RELATIVELY (never through this
// barrel): importing the contract from a "use client" module would drag the
// router factory — and with it @trpc/server — into the browser bundle.
export { ShopJourney } from "./ui/shop-journey";
