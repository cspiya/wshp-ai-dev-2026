import { describe, expect, it } from "vitest";

import { createInMemoryOrderRepo } from "../infra/in-memory-order-repo";
import { createOrdersRouter } from "./orders.router";

const items = [
  {
    workshopId: "3f8a2c1e-0000-4000-8000-000000000001",
    title: "Sample Workshop: Checkout Flow",
    unitNetHuf: 10_000,
    quantity: 2,
  },
  {
    workshopId: "3f8a2c1e-0000-4000-8000-000000000002",
    title: "Contract Testing Lab",
    unitNetHuf: 18_500,
    quantity: 1,
  },
];

const draft = {
  buyer: { kind: "person", name: "Kiss Anna" } as const,
  contact: { name: "Kiss Anna", email: "anna.kiss@example.test", phone: "+36 30 123 4567" },
  billing: { country: "Hungary", postalCode: "1051", city: "Budapest", street: "Minta utca 12." },
  items,
  paymentAuthorizationId: "fake_shop-test",
};

// GUEST caller on purpose: the webshop's procedures are public — no session.
function guestCaller() {
  return createOrdersRouter(createInMemoryOrderRepo()).createCaller({ userId: null });
}

describe("orders router — preview", () => {
  it("computes coupon-free totals for a guest", async () => {
    await expect(guestCaller().preview({ items })).resolves.toMatchObject({
      netSubtotalHuf: 38_500,
      discountHuf: 0,
      vatHuf: 10_395,
      grossHuf: 48_895,
    });
  });

  it("applies WELCOME10 to the net subtotal", async () => {
    await expect(guestCaller().preview({ items, couponCode: "WELCOME10" })).resolves.toMatchObject(
      { discountHuf: 3_850, netAfterDiscountHuf: 34_650, vatHuf: 9_356, grossHuf: 44_006 },
    );
  });

  it("rejects an unknown coupon with a clean message", async () => {
    await expect(guestCaller().preview({ items, couponCode: "NOPE99" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/unknown coupon "NOPE99"/i),
    });
  });
});

describe("orders router — place", () => {
  it("places a guest person order and returns the sequential order number", async () => {
    const api = guestCaller();
    const order = await api.place({ ...draft, couponCode: "WELCOME10" });

    expect(order.orderNumber).toBe("REF-2026-0001");
    expect(order.buyer).toEqual({ kind: "person", name: "Kiss Anna" });
    expect(order.paymentAuthorizationId).toBe("fake_shop-test");
    expect(order.totals).toMatchObject({
      netSubtotalHuf: 38_500,
      discountHuf: 3_850,
      netAfterDiscountHuf: 34_650,
      vatHuf: 9_356,
      grossHuf: 44_006,
      couponCode: "WELCOME10",
    });

    const second = await api.place(draft);
    expect(second.orderNumber).toBe("REF-2026-0002");
  });

  it("places a company order when the tax number is present", async () => {
    const order = await guestCaller().place({
      ...draft,
      buyer: { kind: "company", companyName: "Példa Kft. (invented)", taxNumber: "12345678-2-42" },
    });
    expect(order.buyer).toMatchObject({ kind: "company", taxNumber: "12345678-2-42" });
  });

  it("rejects a company order without a tax number", async () => {
    await expect(
      guestCaller().place({
        ...draft,
        buyer: { kind: "company", companyName: "Példa Kft. (invented)", taxNumber: "  " },
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("Tax number is required"),
    });
  });

  it("rejects 6 seats and points at the custom group offer", async () => {
    await expect(
      guestCaller().place({ ...draft, items: [{ ...items[0], quantity: 6 }] }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("custom group offer"),
    });
  });

  it("rejects an unknown coupon at place time too", async () => {
    await expect(guestCaller().place({ ...draft, couponCode: "NOPE99" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/unknown coupon/i),
    });
  });

  it("ignores client-sent totals and recomputes them server-side", async () => {
    const forged = {
      ...draft,
      couponCode: "WELCOME10",
      totals: { netSubtotalHuf: 1, discountHuf: 0, netAfterDiscountHuf: 1, vatHuf: 0, grossHuf: 1, couponCode: null },
    };
    // The extra `totals` key is stripped by the input schema…
    const order = await guestCaller().place(forged as typeof draft);
    // …and the persisted totals are the domain's, not the client's.
    expect(order.totals.grossHuf).toBe(44_006);
  });
});
