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

export const appRouter = router({
  workshops: createWorkshopsRouter(workshopRepo),
  pricing: createPricingRouter(),
  checkout: createCheckoutRouter(createFakePaymentAdapter()),
  registrations: createRegistrationsRouter(createRegistrationRepo(), workshopSchedule),

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
