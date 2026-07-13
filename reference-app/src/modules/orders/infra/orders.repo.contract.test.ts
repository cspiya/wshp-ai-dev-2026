import { beforeEach, describe, expect, it } from "vitest";

import type { OrderRepo } from "../application/orders.router";
import { computeTotals, resolveCoupon, type OrderRecordInput } from "../domain/order";
import { createInMemoryOrderRepo } from "./in-memory-order-repo";

/**
 * Shared port-contract suite (pattern: workshop-repo.contract.test.ts).
 * Today only the in-memory adapter exists; when the Drizzle adapter lands
 * (documented follow-up, WEN-324 journal) it must run this SAME suite under
 * TEST_DATABASE_URL like the other modules' adapters do.
 */

const items = [
  {
    workshopId: "3f8a2c1e-0000-4000-8000-000000000001",
    title: "Sample Workshop: Checkout Flow",
    unitNetHuf: 10_000,
    quantity: 2,
  },
];

const input: OrderRecordInput = {
  buyer: { kind: "company", companyName: "Példa Kft. (invented)", taxNumber: "12345678-2-42" },
  contact: { name: "Kiss Anna", email: "anna.kiss@example.test", phone: "+36 30 123 4567" },
  billing: { country: "Hungary", postalCode: "1051", city: "Budapest", street: "Minta utca 12." },
  items,
  couponCode: "WELCOME10",
  paymentAuthorizationId: "fake_shop-contract",
  totals: computeTotals(items, resolveCoupon("WELCOME10")),
};

function orderRepoContract(makeRepo: () => OrderRepo) {
  let repo: OrderRepo;

  beforeEach(() => {
    repo = makeRepo();
  });

  it("assigns sequential order numbers starting at REF-2026-0001", async () => {
    const first = await repo.save(input);
    const second = await repo.save(input);
    expect(first.orderNumber).toBe("REF-2026-0001");
    expect(second.orderNumber).toBe("REF-2026-0002");
    expect(first.id).not.toBe(second.id);
  });

  it("persists the full aggregate and retrieves it by number", async () => {
    const saved = await repo.save(input);
    const loaded = await repo.getByNumber(saved.orderNumber);
    expect(loaded).toEqual(saved);
  });

  it("returns snapshots, not live references (nested aggregate included)", async () => {
    const saved = await repo.save(input);
    saved.items[0].quantity = 99;
    if (saved.buyer.kind === "company") saved.buyer.companyName = "MUTATED";

    const loaded = await repo.getByNumber(saved.orderNumber);
    expect(loaded?.items[0].quantity).toBe(2);
    expect(loaded?.buyer).toMatchObject({ companyName: "Példa Kft. (invented)" });
  });

  it("returns null for a missing order number", async () => {
    await expect(repo.getByNumber("REF-2026-9999")).resolves.toBeNull();
  });

  it("lists orders oldest-first", async () => {
    const first = await repo.save(input);
    const second = await repo.save(input);
    const listed = await repo.list();
    expect(listed.map((order) => order.orderNumber)).toEqual([
      first.orderNumber,
      second.orderNumber,
    ]);
  });
}

describe("OrderRepo contract — in-memory adapter", () => {
  orderRepoContract(() => createInMemoryOrderRepo());
});
