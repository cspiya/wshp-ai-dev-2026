import { z } from "zod";

import {
  createDrizzleWorkshopRepo,
  createInMemoryWorkshopRepo,
  createWorkshopsRouter,
} from "@/modules/workshops/workshops.contract";
import {
  createCheckoutRouter,
  createFakePaymentAdapter,
} from "@/modules/checkout/checkout.contract";
import {
  createInMemoryOrderRepo,
  createOrdersRouter,
} from "@/modules/orders/orders.contract";
import { createPricingRouter } from "@/modules/pricing/pricing.contract";
import {
  createDrizzleRegistrationRepo,
  createInMemoryRegistrationRepo,
  createRegistrationsRouter,
} from "@/modules/registrations/registrations.contract";
import { publicProcedure, router } from "@/platform/api/trpc";

/**
 * COMPOSITION ROOT. This is the one place that turns factories into a
 * running app: it picks concrete adapters and injects them into each
 * module's router factory (always imported from the module's public
 * contract). Modules never compose themselves.
 */

/**
 * Adapter choice for the workshops slice.
 *
 * `E2E_IN_MEMORY_DB=1` is a LOCAL-E2E-ONLY seam: playwright.config.ts sets
 * it so the Playwright happy path runs against a plain `next start` with no
 * database. The guard below makes misuse impossible, not just documented:
 * on Vercel the flag kills the server at startup instead of silently
 * serving an empty throwaway store. (`NODE_ENV === "production"` cannot be
 * part of the guard — the local e2e run itself is a production build.)
 */
function createWorkshopRepo() {
  if (process.env.E2E_IN_MEMORY_DB === "1") {
    if (process.env.VERCEL) {
      throw new Error(
        "E2E_IN_MEMORY_DB is a local-e2e-only seam and must never be set on a " +
          "deployment — remove the env var (data would live in one server " +
          "process and vanish on every restart).",
      );
    }
    return createInMemoryWorkshopRepo([
      {
        id: "3f8a2c1e-0000-4000-8000-000000000001",
        title: "Sample Workshop: Checkout Flow",
        description: "Generic local-e2e fixture.",
        date: "2028-01-15T09:00:00.000Z",
        location: "Online",
        listPriceHuf: 10_000,
        capacity: 20,
        createdAt: "2027-01-01T00:00:00.000Z",
      },
    ]);
  }
  return createDrizzleWorkshopRepo();
}

function shouldUseLocalE2eStore() {
  if (process.env.E2E_IN_MEMORY_DB !== "1") return false;
  if (process.env.VERCEL) {
    throw new Error(
      "E2E_IN_MEMORY_DB is a local-e2e-only seam and must never be set on a deployment.",
    );
  }
  return true;
}

function createRegistrationRepo() {
  return shouldUseLocalE2eStore()
    ? createInMemoryRegistrationRepo()
    : createDrizzleRegistrationRepo();
}

const workshopRepo = createWorkshopRepo();
const workshopSchedule = {
  getStartsAt: async (workshopId: string) =>
    (await workshopRepo.getById(workshopId))?.date ?? null,
};

/**
 * Cancellation window is deployment-configurable (WEN-118 ratified rule:
 * exclusive boundary). Env parsing lives HERE at the composition root — the
 * domain and router take a plain number and stay env-free. Invalid or unset
 * values fall back to the module's 48h default (undefined → router default).
 */
function configuredCancellationWindowMs(): number | undefined {
  const hours = Number(process.env.CANCELLATION_WINDOW_HOURS);
  return Number.isFinite(hours) && hours > 0 ? hours * 3_600_000 : undefined;
}

export const appRouter = router({
  workshops: createWorkshopsRouter(workshopRepo),
  pricing: createPricingRouter(),
  checkout: createCheckoutRouter(createFakePaymentAdapter()),
  /**
   * Orders (webshop journey, WEN-324) have ONLY the in-memory adapter for
   * now: the order aggregate (buyer union + items array) needs a
   * jsonb-backed table and migration, deferred as a documented follow-up
   * (docs/build-journal/2026-07-13-wen-324-webshop.md). Orders therefore
   * live in the server process and vanish on restart in EVERY environment —
   * acceptable for the teaching journey, unacceptable for production, and
   * said out loud here so nobody mistakes it for done.
   */
  orders: createOrdersRouter(createInMemoryOrderRepo()),
  registrations: createRegistrationsRouter(
    createRegistrationRepo(),
    workshopSchedule,
    undefined,
    configuredCancellationWindowMs(),
  ),

  health: router({
    // End-to-end wiring proof: Zod-validated input, typed output,
    // consumed by the homepage via TanStack Query.
    // `min(1)` rejects the empty string AT the boundary, so the handler
    // needs no emptiness check — validate in the schema, not in the logic.
    ping: publicProcedure
      .input(z.object({ name: z.string().min(1).max(50).optional() }).optional())
      .query(({ input }) => ({
        ok: true as const,
        message: input?.name ? `pong, ${input.name}` : "pong",
        time: new Date().toISOString(),
      })),
  }),
});

export type AppRouter = typeof appRouter;
