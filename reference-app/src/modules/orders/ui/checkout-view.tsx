"use client";

import { useState } from "react";

import { WarnGlyph } from "@/components/ui/glyphs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatHufAmount } from "@/lib/format";
import { orderDraftSchema, type Order, type OrderDraft } from "../domain/order";
import { trpc } from "@/platform/api/client";

import { cartItemsInput } from "./cart-view";
import { JourneyRail, type JourneyStep } from "./journey-rail";
import { useCart } from "./shop-journey";

/**
 * View 4/5 — checkout (mock: guest purchase, company mode, coupon; account
 * strictly optional). The form validates with the SAME zod schema the server
 * validates with (orders.contract.ts); totals — including the coupon
 * discount — are always the server's `orders.preview` answer. Payment runs
 * through the EXISTING checkout module (`checkout.authorize`) for the gross
 * amount; `orders.place` then records the returned authorization id.
 */
export function CheckoutView({
  onBackToCart,
  onPlaced,
}: {
  onBackToCart: () => void;
  onPlaced: (order: Order) => void;
}) {
  const cart = useCart();

  // contact
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // buyer
  const [isCompany, setIsCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  // billing
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  // coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  // validation + payment
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  // One payment reference per checkout attempt set — stable across renders.
  const [paymentReference] = useState(() => `shop-${Date.now()}`);

  const preview = trpc.orders.preview.useQuery(
    { items: cartItemsInput(cart.lines), couponCode: appliedCoupon ?? undefined },
    { enabled: cart.lines.length > 0, retry: false },
  );
  const authorize = trpc.checkout.authorize.useMutation();
  const place = trpc.orders.place.useMutation();

  const buildDraft = (): OrderDraft => ({
    buyer: isCompany
      ? { kind: "company", companyName, taxNumber }
      : { kind: "person", name: fullName },
    contact: { name: fullName, email, phone },
    billing: { country, postalCode, city, street },
    items: cartItemsInput(cart.lines),
    couponCode: appliedCoupon ?? undefined,
  });

  const submit = async () => {
    setFormError(null);
    const parsed = orderDraftSchema.safeParse(buildDraft());
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        // The person buyer's name IS the contact full name — surface its
        // error on the one field the user actually sees.
        const key = issue.path.join(".").replace(/^buyer\.name$/, "contact.name");
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    if (!preview.data) return;
    try {
      const auth = await authorize.mutateAsync({
        reference: paymentReference,
        amountMinor: preview.data.grossHuf,
        currency: "HUF",
      });
      if (auth.status !== "authorized") {
        setFormError(`Payment declined: ${auth.reason}`);
        return;
      }
      const order = await place.mutateAsync({
        ...parsed.data,
        paymentAuthorizationId: auth.paymentId,
      });
      onPlaced(order);
    } catch {
      // authorize.error / place.error render below — nothing to duplicate.
    }
  };

  const paymentAuthorized = authorize.data?.status === "authorized";
  const paymentBusy = authorize.isPending || place.isPending;

  const steps: JourneyStep[] = [
    { index: "01", label: "Cart", state: "completed", note: `${cart.seatCount} seats` },
    { index: "02", label: "Your details", state: "current", note: "Now" },
    { index: "03", label: "Billing", state: "current", note: isCompany ? "Company" : "Person" },
    {
      index: "04",
      label: "Payment",
      state: paymentAuthorized ? "completed" : paymentBusy ? "current" : "locked",
      note: paymentAuthorized ? "Authorized" : paymentBusy ? "Now" : "Locked",
      lockedReason: "complete the forms",
    },
    { index: "05", label: "Done", state: "locked", note: "Locked", lockedReason: "pay first" },
  ];

  if (cart.lines.length === 0) {
    return (
      <div className="mod mt-6">
        <div className="mod-head">
          <span className="mod-tag">Checkout</span>
          <span className="mod-stat">
            <span className="dotlamp" aria-hidden="true" />0 items
          </span>
        </div>
        <div className="mod-body">
          <p className="text-sm text-muted-foreground">
            Your cart is empty — there is nothing to check out yet.
          </p>
          <button type="button" className="keycap mt-4 min-h-11" onClick={onBackToCart}>
            Back to the cart
          </button>
        </div>
      </div>
    );
  }

  const couponError = appliedCoupon && preview.isError ? preview.error.message : null;

  return (
    <>
      <JourneyRail steps={steps} className="rail-5" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Checkout
      </h1>

      <div className="mt-6 grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
        <div>
          {/* ── contact (guest checkout; auth is a separate future slice) ── */}
          <section aria-labelledby="contact-heading" className="mod">
            <div className="mod-head">
              <span className="mod-tag" id="contact-heading">
                Contact — guest checkout
              </span>
              <span className="mod-stat">No account required</span>
            </div>
            <div className="mod-body">
              <p className="okbox mb-4">
                No account or sign-in is required. This workshop build uses guest checkout;
                authentication will be connected separately.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="contact-name"
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  error={fieldErrors["contact.name"]}
                />
                <FormField
                  id="contact-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={fieldErrors["contact.email"]}
                />
                <FormField
                  id="contact-phone"
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  error={fieldErrors["contact.phone"]}
                />
              </div>
            </div>
          </section>

          {/* ── billing: buyer mode + address ─────────────────────────── */}
          <section aria-labelledby="billing-heading" className="mod mt-4">
            <div className="mod-head">
              <span className="mod-tag" id="billing-heading">
                Billing address
              </span>
              <span className="mod-stat">For the invoice</span>
            </div>
            <div className="mod-body">
              <label className="switch-row mb-4 min-h-11 text-sm">
                <input
                  type="checkbox"
                  checked={isCompany}
                  onChange={(event) => setIsCompany(event.target.checked)}
                />
                <span>
                  I&rsquo;m buying as a <b>company</b>
                </span>
              </label>
              {!isCompany && (
                <p className="mini mb-4">
                  Person mode · the buyer name is the full name from the contact block
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {isCompany && (
                  <>
                    <FormField
                      id="company-name"
                      label="Company name (this will be the buyer name)"
                      value={companyName}
                      onChange={setCompanyName}
                      error={fieldErrors["buyer.companyName"]}
                    />
                    <FormField
                      id="tax-number"
                      label="Tax number (adószám)"
                      value={taxNumber}
                      onChange={setTaxNumber}
                      error={fieldErrors["buyer.taxNumber"]}
                    />
                  </>
                )}
                <FormField
                  id="billing-country"
                  label="Country"
                  value={country}
                  onChange={setCountry}
                  error={fieldErrors["billing.country"]}
                />
                <FormField
                  id="billing-postal"
                  label="Postal code"
                  value={postalCode}
                  onChange={setPostalCode}
                  error={fieldErrors["billing.postalCode"]}
                />
                <FormField
                  id="billing-city"
                  label="City"
                  value={city}
                  onChange={setCity}
                  error={fieldErrors["billing.city"]}
                />
                <FormField
                  id="billing-street"
                  label="Street address"
                  value={street}
                  onChange={setStreet}
                  error={fieldErrors["billing.street"]}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── summary + coupon + pay ──────────────────────────────────── */}
        <div>
          <div className="sumbox">
            {preview.isPending && <p className="mini py-1">Calculating totals…</p>}
            {preview.isError && !appliedCoupon && (
              <p role="alert" className="inline-flex items-center gap-1.5 py-1 text-sm text-destructive">
                <WarnGlyph />
                {preview.error.message}
              </p>
            )}
            {couponError && (
              <p className="mini py-1">Totals unavailable — fix the coupon below.</p>
            )}
            {preview.data && (
              <>
                <div className="sumrow">
                  <span className="sumrow-k">Net subtotal</span>
                  <span className="sumrow-v" data-testid="sum-net">
                    {formatHufAmount(preview.data.netSubtotalHuf)}
                  </span>
                </div>
                {preview.data.couponCode && (
                  <div className="sumrow sumrow-disc">
                    <span className="sumrow-k">Coupon {preview.data.couponCode}</span>
                    <span className="sumrow-v" data-testid="sum-discount">
                      &minus; {formatHufAmount(preview.data.discountHuf)}
                    </span>
                  </div>
                )}
                <div className="sumrow">
                  <span className="sumrow-k">VAT 27%</span>
                  <span className="sumrow-v" data-testid="sum-vat">
                    {formatHufAmount(preview.data.vatHuf)}
                  </span>
                </div>
                <div className="sumrow sumrow-grand">
                  <span className="sumrow-k">Gross total</span>
                  <span className="sumrow-v" data-testid="sum-gross">
                    {formatHufAmount(preview.data.grossHuf)}
                  </span>
                </div>
              </>
            )}
          </div>

          <section aria-labelledby="coupon-heading" className="mod mt-4">
            <div className="mod-head">
              <span className="mod-tag" id="coupon-heading">
                Coupon
              </span>
              <span className="mod-stat">
                {appliedCoupon && preview.data ? (
                  <>
                    <span className="dotlamp dotlamp-ok" aria-hidden="true" />
                    Applied
                  </>
                ) : couponError ? (
                  <>
                    <span className="dotlamp dotlamp-bad" aria-hidden="true" />
                    Error
                  </>
                ) : appliedCoupon ? (
                  <>
                    <span className="dotlamp dotlamp-amber" aria-hidden="true" />
                    Checking
                  </>
                ) : (
                  <>
                    <span className="dotlamp" aria-hidden="true" />
                    None
                  </>
                )}
              </span>
            </div>
            <div className="mod-body">
              <div className="flex items-end gap-2.5">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="coupon-code" className="micro-label">
                    Coupon code
                  </Label>
                  <Input
                    id="coupon-code"
                    className="bg-white"
                    value={appliedCoupon ?? couponInput}
                    readOnly={appliedCoupon !== null}
                    onChange={(event) => setCouponInput(event.target.value)}
                  />
                </div>
                {appliedCoupon === null ? (
                  <button
                    type="button"
                    className="btn-plate min-h-11"
                    data-testid="coupon-apply"
                    disabled={couponInput.trim() === ""}
                    onClick={() => setAppliedCoupon(couponInput.trim().toUpperCase())}
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-plate min-h-11"
                    data-testid="coupon-remove"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput("");
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {couponError && (
                <p
                  role="alert"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive"
                >
                  <WarnGlyph />
                  {couponError}
                </p>
              )}
            </div>
          </section>

          <button
            type="button"
            className="keycap mt-4 min-h-11 w-full"
            data-testid="continue-to-payment"
            onClick={submit}
            disabled={paymentBusy || !preview.data}
          >
            {authorize.isPending
              ? "Authorizing…"
              : place.isPending
                ? "Placing order…"
                : preview.data
                  ? `Continue to payment · ${formatHufAmount(preview.data.grossHuf)}`
                  : "Continue to payment"}
          </button>
          <p className="mini mt-2.5">Fake payment · nothing real is charged</p>

          {formError && (
            <p role="alert" className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive">
              <WarnGlyph />
              {formError}
            </p>
          )}
          {authorize.isError && (
            <p role="alert" className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive">
              <WarnGlyph />
              {authorize.error.message}
            </p>
          )}
          {place.isError && (
            <p role="alert" className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive">
              <WarnGlyph />
              {place.error.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button type="button" className="back-link min-h-11" onClick={onBackToCart}>
          &larr; Back to cart
        </button>
      </div>
    </>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="micro-label">
        {label} <span aria-hidden="true" className="text-destructive">*</span>
      </Label>
      <Input
        id={id}
        type={type}
        className="bg-white"
        value={value}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
