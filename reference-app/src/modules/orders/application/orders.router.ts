import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "@/platform/api/trpc";

import {
  computeTotals,
  orderDraftSchema,
  resolveCoupon,
  unknownCouponMessage,
  type Coupon,
  type Order,
  type OrderItem,
  type OrderItemInput,
  type OrderRecordInput,
} from "../domain/order";

/**
 * Port for order persistence — earned for the same reason as WorkshopRepo:
 * the concrete store is a boundary that actually varies. Today only the
 * in-memory adapter exists (a Drizzle adapter is a documented follow-up,
 * see docs/build-journal/2026-07-13-wen-324-webshop.md); the shared suite
 * in infra/orders.repo.contract.test.ts is what any future adapter must pass.
 */
export interface OrderRepo {
  /** Assigns id, the next sequential orderNumber and placedAt; stores a snapshot. */
  save(input: OrderRecordInput): Promise<Order>;
  getByNumber(orderNumber: string): Promise<Order | null>;
  /** Oldest-first by placedAt, bounded (first 50). */
  list(): Promise<Order[]>;
}

/**
 * Catalog lookup the orders slice depends on — the minimal slice of a
 * workshop that pricing needs. The composition root injects an adapter over
 * the workshops module's repo; orders never imports that module directly.
 */
export type WorkshopSource = (
  id: string,
) => Promise<{ id: string; title: string; listPriceHuf: number } | null>;

const previewInputSchema = orderDraftSchema.pick({ items: true, couponCode: true });

/**
 * A plain z.object (NOT strict): unknown keys smuggled into the payload
 * (`totals`, a `unitNetHuf` on an item, …) are STRIPPED at the boundary.
 * Items carry only `{ workshopId, quantity }` — title and unit price are
 * resolved server-side from the catalog and the totals are recomputed
 * below, so a client can never dictate its own price.
 */
const placeOrderInputSchema = orderDraftSchema.extend({
  paymentAuthorizationId: z.string().min(1).max(100),
});

/**
 * Turns the client's `{ workshopId, quantity }` lines into the
 * authoritative order items: title and unit net price come from the
 * catalog, never from the request. Unknown ids and duplicate lines are
 * clean BAD_REQUESTs naming the offending id.
 */
async function resolveItems(
  inputItems: OrderItemInput[],
  workshopSource: WorkshopSource,
): Promise<OrderItem[]> {
  const seen = new Set<string>();
  for (const { workshopId } of inputItems) {
    if (seen.has(workshopId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Duplicate workshop "${workshopId}" in the cart — merge it into one line.`,
      });
    }
    seen.add(workshopId);
  }
  return Promise.all(
    inputItems.map(async ({ workshopId, quantity }) => {
      const workshop = await workshopSource(workshopId);
      if (!workshop) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown workshop "${workshopId}" — remove it from the cart.`,
        });
      }
      return {
        workshopId: workshop.id,
        title: workshop.title,
        unitNetHuf: workshop.listPriceHuf,
        quantity,
      };
    }),
  );
}

/**
 * Coupon codes are validated against the domain catalog HERE (not in the Zod
 * schema) so the client receives a clean, human message instead of a
 * serialized issue list.
 */
function requireCoupon(code: string | undefined): Coupon | null {
  if (code === undefined) return null;
  const coupon = resolveCoupon(code);
  if (!coupon) {
    throw new TRPCError({ code: "BAD_REQUEST", message: unknownCouponMessage(code) });
  }
  return coupon;
}

/**
 * The webshop's use-cases. Both procedures are PUBLIC on purpose: guest
 * checkout is the point of the journey — no session is required to preview
 * or place an order. Payment is NOT called here: the client authorizes the
 * gross amount through the existing checkout module (PaymentPort untouched)
 * and passes the authorization id in; `place` only records it.
 */
export function createOrdersRouter(repo: OrderRepo, workshopSource: WorkshopSource) {
  return router({
    preview: publicProcedure.input(previewInputSchema).query(async ({ input }) => {
      const items = await resolveItems(input.items, workshopSource);
      return computeTotals(items, requireCoupon(input.couponCode));
    }),

    place: publicProcedure.input(placeOrderInputSchema).mutation(async ({ input }) => {
      // Server-side pricing AND recomputation: the persisted lines carry the
      // catalog's title/price and the totals are the domain's numbers —
      // whatever a client believes it pays has no effect.
      const items = await resolveItems(input.items, workshopSource);
      const totals = computeTotals(items, requireCoupon(input.couponCode));
      return repo.save({ ...input, items, totals });
    }),
  });
}
