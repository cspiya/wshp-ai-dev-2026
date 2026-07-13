import type { OrderRepo } from "../application/orders.router";
import { formatOrderNumber, type Order } from "../domain/order";

/**
 * In-memory OrderRepo — currently the ONLY adapter, wired for every
 * environment by the composition root (src/platform/api/root.ts). Orders
 * therefore live in one server process and vanish on restart; a Drizzle
 * adapter (jsonb-backed order aggregate + migration) is a documented
 * follow-up — see docs/build-journal/2026-07-13-wen-324-webshop.md. Any
 * future adapter must pass infra/orders.repo.contract.test.ts.
 *
 * Like the other in-memory adapters: no live reference to internal state
 * ever escapes (structuredClone in AND out — the aggregate is nested),
 * and order numbers are assigned sequentially inside the repo.
 */
export function createInMemoryOrderRepo(): OrderRepo {
  const rows = new Map<string, Order>();
  let sequence = 0;

  return {
    save: async (input) => {
      sequence += 1;
      const order: Order = {
        ...structuredClone(input),
        id: crypto.randomUUID(),
        orderNumber: formatOrderNumber(sequence),
        placedAt: new Date().toISOString(),
      };
      rows.set(order.orderNumber, order);
      return structuredClone(order);
    },

    getByNumber: async (orderNumber) => {
      const order = rows.get(orderNumber);
      return order ? structuredClone(order) : null;
    },

    // Oldest-first by placedAt, bounded to 50 like the other adapters.
    list: async () =>
      [...rows.values()]
        .sort((a, b) => Date.parse(a.placedAt) - Date.parse(b.placedAt))
        .slice(0, 50)
        .map((order) => structuredClone(order)),
  };
}
