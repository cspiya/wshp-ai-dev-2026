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

const previewInputSchema = orderDraftSchema.pick({ items: true, couponCode: true });

/**
 * A plain z.object (NOT strict): a `totals` key smuggled into the payload is
 * stripped at the boundary and the totals are recomputed below — a client
 * can never dictate its own price.
 */
const placeOrderInputSchema = orderDraftSchema.extend({
  paymentAuthorizationId: z.string().min(1).max(100),
});

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
export function createOrdersRouter(repo: OrderRepo) {
  return router({
    preview: publicProcedure.input(previewInputSchema).query(({ input }) =>
      computeTotals(input.items, requireCoupon(input.couponCode)),
    ),

    place: publicProcedure.input(placeOrderInputSchema).mutation(async ({ input }) => {
      // Server-side recomputation: whatever totals a client believes in,
      // the persisted order carries the domain's numbers.
      const totals = computeTotals(input.items, requireCoupon(input.couponCode));
      return repo.save({ ...input, totals });
    }),
  });
}
