import { describe, expect, it } from "vitest";

import { createInMemoryOrderRepo } from "../infra/in-memory-order-repo";
import { createOrdersRouter, type WorkshopSource } from "./orders.router";

// The fake catalog — the ONLY place prices exist. Clients send ids and
// quantities; every priced expectation below derives from these two rows.
const catalog = {
  "3f8a2c1e-0000-4000-8000-000000000001": {
    title: "Sample Workshop: Checkout Flow",
    listPriceHuf: 10_000,
  },
  "3f8a2c1e-0000-4000-8000-000000000002": {
    title: "Contract Testing Lab",
    listPriceHuf: 18_500,
  },
} as const;

const workshopSource: WorkshopSource = async (id) => {
  const entry = catalog[id as keyof typeof catalog];
  return entry ? { id, ...entry } : null;
};

// 2× 10 000 + 1× 18 500 = 38 500 net — the accepted mock's worked numbers.
const items = [
  { workshopId: "3f8a2c1e-0000-4000-8000-000000000001", quantity: 2 },
  { workshopId: "3f8a2c1e-0000-4000-8000-000000000002", quantity: 1 },
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
  return createOrdersRouter(createInMemoryOrderRepo(), workshopSource).createCaller({
    userId: null,
  });
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

  it("rejects an unknown workshop id, naming the id", async () => {
    const unknownId = "3f8a2c1e-0000-4000-8000-00000000dead";
    await expect(
      guestCaller().preview({ items: [{ workshopId: unknownId, quantity: 1 }] }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining(unknownId),
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

  it("rejects an unknown workshop id at place time, naming the id", async () => {
    const unknownId = "3f8a2c1e-0000-4000-8000-00000000dead";
    await expect(
      guestCaller().place({ ...draft, items: [{ workshopId: unknownId, quantity: 1 }] }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining(unknownId),
    });
  });

  it("rejects duplicate workshop lines in one request", async () => {
    await expect(
      guestCaller().place({
        ...draft,
        items: [
          { workshopId: items[0].workshopId, quantity: 1 },
          { workshopId: items[0].workshopId, quantity: 2 },
        ],
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/duplicate workshop/i),
    });
  });

  it("rejects more than 20 order lines", async () => {
    const tooMany = Array.from({ length: 21 }, () => ({
      workshopId: items[0].workshopId,
      quantity: 1,
    }));
    await expect(guestCaller().place({ ...draft, items: tooMany })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("at most 20 lines"),
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

  it("prices from the catalog — client-sent unitNetHuf/title are stripped and powerless", async () => {
    // Price tampering is impossible BY CONSTRUCTION: the input schema has no
    // price field at all. Even smuggling `unitNetHuf`/`title` keys onto the
    // lines changes nothing — zod strips them and the server re-resolves
    // every line from the workshop source.
    const tampered = {
      ...draft,
      items: [
        { ...items[0], unitNetHuf: 1, title: "Almost Free" },
        { ...items[1], unitNetHuf: 1, title: "Also Free" },
      ],
    };
    const order = await guestCaller().place(tampered as typeof draft);

    // Totals derive from the SOURCE prices: 2× 10 000 + 1× 18 500.
    expect(order.totals).toMatchObject({ netSubtotalHuf: 38_500, grossHuf: 48_895 });
    // The persisted lines carry the catalog's title and price, not the client's.
    expect(order.items).toEqual([
      {
        workshopId: items[0].workshopId,
        title: "Sample Workshop: Checkout Flow",
        unitNetHuf: 10_000,
        quantity: 2,
      },
      {
        workshopId: items[1].workshopId,
        title: "Contract Testing Lab",
        unitNetHuf: 18_500,
        quantity: 1,
      },
    ]);
  });
});
