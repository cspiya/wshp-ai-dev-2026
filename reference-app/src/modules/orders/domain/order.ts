import { z } from "zod";

/**
 * Domain vocabulary of the `orders` module: the webshop purchase aggregate
 * (buyer, contact, billing, items, coupon) and its money math. All amounts
 * are integer HUF; names say whether a figure is net or gross. Everything
 * here — the coupon catalog, the 27% VAT rate, the order-number scheme — is
 * INVENTED training data, not fiscal advice.
 */

export const MAX_SEATS_PER_WORKSHOP = 5;

/**
 * Shown wherever the seat cap bites (schema message, product-page hint):
 * above the cap the shop stops selling and points at the organizer.
 */
export const CUSTOM_OFFER_MESSAGE =
  `Maximum ${MAX_SEATS_PER_WORKSHOP} seats per workshop — ` +
  "contact the organizer for a custom group offer.";

/** Applied to the net total AFTER discount; rounded half-up to integer HUF. */
export const VAT_RATE_PERCENT = 27;

export const buyerSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("person"),
    name: z.string().trim().min(1, "Name is required").max(200),
  }),
  z.object({
    kind: z.literal("company"),
    companyName: z.string().trim().min(1, "Company name is required").max(200),
    // Format-lenient ON PURPOSE (invented sample data): required and
    // non-empty is the whole rule — no real-world tax-number checksum here.
    taxNumber: z.string().trim().min(1, "Tax number is required").max(50),
  }),
]);

export type Buyer = z.infer<typeof buyerSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(200),
  email: z.email("Enter a valid email").max(320),
  phone: z.string().trim().min(1, "Phone is required").max(50),
});

export type Contact = z.infer<typeof contactSchema>;

export const billingAddressSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(100),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  city: z.string().trim().min(1, "City is required").max(100),
  street: z.string().trim().min(1, "Street address is required").max(200),
});

export type BillingAddress = z.infer<typeof billingAddressSchema>;

export const orderItemSchema = z.object({
  workshopId: z.uuid(),
  title: z.string().min(1).max(200),
  unitNetHuf: z.int().positive(),
  quantity: z
    .int()
    .min(1, "At least 1 seat is required")
    .max(MAX_SEATS_PER_WORKSHOP, CUSTOM_OFFER_MESSAGE),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

/**
 * Invented coupon catalog — a percentage off the NET subtotal. Deliberately
 * data, not code: adding a coupon must not require new branching logic.
 */
const COUPON_CATALOG: Record<string, { percentOff: number }> = {
  WELCOME10: { percentOff: 10 },
};

export type Coupon = { code: string; percentOff: number };

/** Unknown codes resolve to null — the caller decides how to report it. */
export function resolveCoupon(code: string): Coupon | null {
  const entry = COUPON_CATALOG[code];
  return entry ? { code, percentOff: entry.percentOff } : null;
}

export const unknownCouponMessage = (code: string) =>
  `Unknown coupon "${code}" — remove it or use a valid code.`;

export const orderTotalsSchema = z.object({
  netSubtotalHuf: z.int().nonnegative(),
  discountHuf: z.int().nonnegative(),
  netAfterDiscountHuf: z.int().nonnegative(),
  vatHuf: z.int().nonnegative(),
  grossHuf: z.int().nonnegative(),
  couponCode: z.string().nullable(),
});

export type OrderTotals = z.infer<typeof orderTotalsSchema>;

/**
 * The one place the shop's money math lives:
 *
 *   netSubtotal  = Σ unitNet × quantity
 *   discount     = floor(netSubtotal × percentOff / 100)   (coupon only)
 *   vat          = netAfterDiscount × 27%, rounded HALF-UP to integer HUF
 *   gross        = netAfterDiscount + vat
 *
 * Integer arithmetic throughout — `(x * 27 + 50) / 100` floored implements
 * half-up exactly, with no floating-point drift.
 */
export function computeTotals(items: OrderItem[], coupon?: Coupon | null): OrderTotals {
  const netSubtotalHuf = items.reduce((sum, item) => sum + item.unitNetHuf * item.quantity, 0);
  const discountHuf = coupon ? Math.floor((netSubtotalHuf * coupon.percentOff) / 100) : 0;
  const netAfterDiscountHuf = netSubtotalHuf - discountHuf;
  const vatHuf = Math.floor((netAfterDiscountHuf * VAT_RATE_PERCENT + 50) / 100);
  return {
    netSubtotalHuf,
    discountHuf,
    netAfterDiscountHuf,
    vatHuf,
    grossHuf: netAfterDiscountHuf + vatHuf,
    couponCode: coupon?.code ?? null,
  };
}

/**
 * Presentation helper: the gross for a single NET amount at the fixed VAT
 * rate (same half-up rounding as computeTotals). Every price surface shows
 * net + gross; this keeps the per-seat gross consistent with the totals.
 */
export function grossFromNet(netHuf: number): number {
  return netHuf + Math.floor((netHuf * VAT_RATE_PERCENT + 50) / 100);
}

/** What a buyer submits: everything except server-assigned fields. */
export const orderDraftSchema = z.object({
  buyer: buyerSchema,
  contact: contactSchema,
  billing: billingAddressSchema,
  items: z.array(orderItemSchema).min(1, "The cart is empty"),
  couponCode: z.string().trim().min(1).max(50).optional(),
});

export type OrderDraft = z.infer<typeof orderDraftSchema>;

/**
 * What a repo persists: the draft plus the payment authorization id (from
 * the checkout module's PaymentPort, passed through by the client) and the
 * server-computed totals. The repo assigns id, orderNumber and placedAt.
 */
export const orderRecordInputSchema = orderDraftSchema.extend({
  paymentAuthorizationId: z.string().min(1).max(100),
  totals: orderTotalsSchema,
});

export type OrderRecordInput = z.infer<typeof orderRecordInputSchema>;

/** Sequential, human-readable order number: REF-2026-0001, -0002, … */
export function formatOrderNumber(sequence: number): string {
  return `REF-2026-${String(sequence).padStart(4, "0")}`;
}

export const orderSchema = orderRecordInputSchema.extend({
  id: z.uuid(),
  orderNumber: z.string().regex(/^REF-2026-\d{4,}$/),
  placedAt: z.iso.datetime(),
});

export type Order = z.infer<typeof orderSchema>;
