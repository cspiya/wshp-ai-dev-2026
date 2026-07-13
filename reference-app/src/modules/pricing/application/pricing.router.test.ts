import { expect, it } from "vitest";

import { createPricingRouter } from "./pricing.router";

it("exposes quote calculation through the validated API boundary", async () => {
  const caller = createPricingRouter().createCaller({ userId: "test-user" });
  const quote = await caller.quote({
    currency: "HUF",
    listPriceMinor: 10_000,
    couponMinor: 1_000,
    groupDiscountBps: 1_000,
    vatBps: 2_700,
  });
  expect(quote.totalMinor).toBe(10_287);
});
