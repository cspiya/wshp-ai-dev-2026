import { describe, expect, it } from "vitest";

import { calculatePricing, pricingInputSchema } from "../domain/pricing";

describe("calculatePricing", () => {
  it("applies coupon, group discount, then VAT", () => {
    expect(
      calculatePricing({
        currency: "HUF",
        listPriceMinor: 10_000,
        couponMinor: 1_000,
        groupDiscountBps: 1_000,
        vatBps: 2_700,
      }),
    ).toMatchObject({
      afterCouponMinor: 9_000,
      groupDiscountMinor: 900,
      netMinor: 8_100,
      vatMinor: 2_187,
      totalMinor: 10_287,
    });
  });

  it("rounds group discount down and VAT half up in integer arithmetic", () => {
    const quote = calculatePricing({
      currency: "EUR",
      listPriceMinor: 101,
      couponMinor: 0,
      groupDiscountBps: 333,
      vatBps: 2_000,
    });
    expect(quote.groupDiscountMinor).toBe(3);
    expect(quote.vatMinor).toBe(20);
    expect(quote.totalMinor).toBe(118);
  });

  it("rejects a coupon larger than the list price", () => {
    expect(() =>
      pricingInputSchema.parse({
        currency: "HUF",
        listPriceMinor: 1_000,
        couponMinor: 1_001,
        groupDiscountBps: 0,
        vatBps: 2_700,
      }),
    ).toThrow(/Coupon cannot exceed/);
  });
});
