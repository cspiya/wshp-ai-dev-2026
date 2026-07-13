import { describe, expect, it } from "vitest";

import {
  CUSTOM_OFFER_MESSAGE,
  MAX_SEATS_PER_WORKSHOP,
  buyerSchema,
  computeTotals,
  grossFromNet,
  orderItemSchema,
  resolveCoupon,
} from "../domain/order";

const item = (unitNetHuf: number, quantity: number) => ({
  workshopId: "3f8a2c1e-0000-4000-8000-000000000001",
  title: "Sample Workshop: Checkout Flow",
  unitNetHuf,
  quantity,
});

describe("order item quantity", () => {
  it("accepts 1 through the cap", () => {
    expect(orderItemSchema.safeParse(item(10_000, 1)).success).toBe(true);
    expect(orderItemSchema.safeParse(item(10_000, MAX_SEATS_PER_WORKSHOP)).success).toBe(true);
  });

  it("rejects zero seats", () => {
    const result = orderItemSchema.safeParse(item(10_000, 0));
    expect(result.success).toBe(false);
  });

  it("rejects 6 seats and names the custom group offer", () => {
    const result = orderItemSchema.safeParse(item(10_000, 6));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(CUSTOM_OFFER_MESSAGE);
    expect(CUSTOM_OFFER_MESSAGE).toContain("custom group offer");
  });
});

describe("buyer", () => {
  it("accepts a person with a name", () => {
    expect(buyerSchema.safeParse({ kind: "person", name: "Kiss Anna" }).success).toBe(true);
  });

  it("rejects a person without a name", () => {
    expect(buyerSchema.safeParse({ kind: "person", name: "  " }).success).toBe(false);
  });

  it("accepts a company with a non-empty tax number (format-lenient)", () => {
    const result = buyerSchema.safeParse({
      kind: "company",
      companyName: "Példa Kft. (invented)",
      taxNumber: "12345678-2-42",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a company with an empty tax number", () => {
    const result = buyerSchema.safeParse({
      kind: "company",
      companyName: "Példa Kft. (invented)",
      taxNumber: "   ",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Tax number is required");
  });
});

describe("coupons", () => {
  it("resolves the invented WELCOME10 catalog entry", () => {
    expect(resolveCoupon("WELCOME10")).toEqual({ code: "WELCOME10", percentOff: 10 });
  });

  it("resolves an unknown coupon to null", () => {
    expect(resolveCoupon("NOPE99")).toBeNull();
  });
});

describe("computeTotals", () => {
  it("reproduces the accepted mock's worked numbers exactly", () => {
    // 2× 10 000 + 1× 18 500 = 38 500 net; WELCOME10 → −3 850;
    // 34 650 × 27% = 9 355.5 → half-up 9 356; gross 44 006.
    const totals = computeTotals(
      [item(10_000, 2), item(18_500, 1)],
      resolveCoupon("WELCOME10"),
    );
    expect(totals).toEqual({
      netSubtotalHuf: 38_500,
      discountHuf: 3_850,
      netAfterDiscountHuf: 34_650,
      vatHuf: 9_356,
      grossHuf: 44_006,
      couponCode: "WELCOME10",
    });
  });

  it("computes coupon-free totals (the cart view's numbers)", () => {
    const totals = computeTotals([item(10_000, 2), item(18_500, 1)]);
    expect(totals).toMatchObject({
      netSubtotalHuf: 38_500,
      discountHuf: 0,
      vatHuf: 10_395,
      grossHuf: 48_895,
      couponCode: null,
    });
  });

  it("rounds VAT half-up at the exact .5 boundary", () => {
    // 50 × 27% = 13.5 → 14 (half-up), never 13 (half-down / bankers).
    expect(computeTotals([item(50, 1)])).toMatchObject({ vatHuf: 14, grossHuf: 64 });
    // 46 × 27% = 12.42 → 12 (below .5 still rounds down).
    expect(computeTotals([item(46, 1)])).toMatchObject({ vatHuf: 12, grossHuf: 58 });
  });

  it("floors a fractional discount to integer HUF", () => {
    // 105 × 10% = 10.5 → 10; net after 95; VAT 95 × 27% = 25.65 → 26.
    const totals = computeTotals([item(105, 1)], resolveCoupon("WELCOME10"));
    expect(totals).toMatchObject({
      discountHuf: 10,
      netAfterDiscountHuf: 95,
      vatHuf: 26,
      grossHuf: 121,
    });
  });
});

describe("grossFromNet", () => {
  it("matches the accepted mock's per-seat gross prices", () => {
    expect(grossFromNet(10_000)).toBe(12_700);
    expect(grossFromNet(18_500)).toBe(23_495);
    expect(grossFromNet(14_000)).toBe(17_780);
  });
});
