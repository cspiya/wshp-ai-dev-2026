import { publicProcedure, router } from "@/platform/api/trpc";

import { calculatePricing, pricingInputSchema } from "../domain/pricing";

export function createPricingRouter() {
  return router({
    quote: publicProcedure.input(pricingInputSchema).query(({ input }) => calculatePricing(input)),
  });
}
