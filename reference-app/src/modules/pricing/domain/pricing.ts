import { z } from "zod";

const MAX_AMOUNT_MINOR = 1_000_000_000;
const BASIS_POINTS = 10_000;

export const pricingInputSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/),
    listPriceMinor: z.int().min(0).max(MAX_AMOUNT_MINOR),
    couponMinor: z.int().min(0).max(MAX_AMOUNT_MINOR).default(0),
    groupDiscountBps: z.int().min(0).max(BASIS_POINTS).default(0),
    vatBps: z.int().min(0).max(BASIS_POINTS),
  })
  .refine((input) => input.couponMinor <= input.listPriceMinor, {
    path: ["couponMinor"],
    message: "Coupon cannot exceed list price",
  });

export type PricingInput = z.infer<typeof pricingInputSchema>;

export const pricingQuoteSchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  listPriceMinor: z.int().nonnegative(),
  couponMinor: z.int().nonnegative(),
  afterCouponMinor: z.int().nonnegative(),
  groupDiscountBps: z.int().min(0).max(BASIS_POINTS),
  groupDiscountMinor: z.int().nonnegative(),
  netMinor: z.int().nonnegative(),
  vatBps: z.int().min(0).max(BASIS_POINTS),
  vatMinor: z.int().nonnegative(),
  totalMinor: z.int().nonnegative(),
});

export type PricingQuote = z.infer<typeof pricingQuoteSchema>;

/** Fixed order: list − coupon − group discount + VAT. */
export function calculatePricing(rawInput: PricingInput): PricingQuote {
  const input = pricingInputSchema.parse(rawInput);
  const afterCouponMinor = input.listPriceMinor - input.couponMinor;
  const groupDiscountMinor = Math.floor(
    (afterCouponMinor * input.groupDiscountBps) / BASIS_POINTS,
  );
  const netMinor = afterCouponMinor - groupDiscountMinor;
  const vatMinor = Math.floor((netMinor * input.vatBps + BASIS_POINTS / 2) / BASIS_POINTS);

  return pricingQuoteSchema.parse({
    ...input,
    afterCouponMinor,
    groupDiscountMinor,
    netMinor,
    vatMinor,
    totalMinor: netMinor + vatMinor,
  });
}
