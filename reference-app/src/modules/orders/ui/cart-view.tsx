"use client";

import { WarnGlyph } from "@/components/ui/glyphs";
import { formatDate, formatHufAmount } from "@/lib/format";
import { trpc } from "@/platform/api/client";

import { QtyStepper } from "./qty-stepper";
import { JourneyRail, type JourneyStep } from "./journey-rail";
import { useCart, type CartLine } from "./shop-journey";

export function cartItemsInput(lines: CartLine[]) {
  return lines.map((line) => ({
    workshopId: line.workshop.id,
    title: line.workshop.title,
    unitNetHuf: line.workshop.listPriceHuf,
    quantity: line.quantity,
  }));
}

/**
 * View 3/5 — cart (mock: several workshops, quantities, summary). Totals are
 * the server's `orders.preview` answer — the client never adds numbers up.
 */
export function CartView({
  onCheckout,
  onContinueShopping,
}: {
  onCheckout: () => void;
  onContinueShopping: () => void;
}) {
  const cart = useCart();
  const preview = trpc.orders.preview.useQuery(
    { items: cartItemsInput(cart.lines) },
    { enabled: cart.lines.length > 0 },
  );

  const steps: JourneyStep[] = [
    {
      index: "01",
      label: "Cart",
      state: "current",
      note: `${cart.seatCount} seats · ${cart.lines.length} workshops`,
    },
    { index: "02", label: "Your details", state: "locked", note: "Locked", lockedReason: "proceed to checkout" },
    { index: "03", label: "Billing", state: "locked", note: "Locked", lockedReason: "proceed to checkout" },
    { index: "04", label: "Payment", state: "locked", note: "Locked", lockedReason: "complete checkout" },
    { index: "05", label: "Done", state: "locked", note: "Locked", lockedReason: "complete checkout" },
  ];

  return (
    <>
      <JourneyRail steps={steps} className="rail-5" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Your cart
      </h1>

      {cart.lines.length === 0 ? (
        <div className="mod mt-6">
          <div className="mod-head">
            <span className="mod-tag">Items</span>
            <span className="mod-stat">
              <span className="dotlamp" aria-hidden="true" />0 items
            </span>
          </div>
          <div className="mod-body">
            <p className="text-sm text-muted-foreground">
              Your cart is empty — pick a workshop in the catalog first.
            </p>
            <button
              type="button"
              className="keycap mt-4 min-h-11"
              onClick={onContinueShopping}
            >
              Browse the catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
          <section aria-labelledby="items-heading" className="mod">
            <div className="mod-head">
              <span className="mod-tag" id="items-heading">
                Items
              </span>
              <span className="mod-stat">
                <span className="dotlamp dotlamp-amber" aria-hidden="true" />
                {cart.seatCount} seats
              </span>
            </div>
            <div className="mod-body">
              {cart.lines.map((line) => (
                <div key={line.workshop.id} className="cartline">
                  <span className="cartline-t">
                    {line.workshop.title}
                    <small>
                      {formatDate(line.workshop.date)} · net{" "}
                      {formatHufAmount(line.workshop.listPriceHuf)} / seat
                    </small>
                  </span>
                  <QtyStepper
                    value={line.quantity}
                    onChange={(next) => cart.setQuantity(line.workshop.id, next)}
                    label={`seats for ${line.workshop.title}`}
                  />
                  <span className="cartline-lp">
                    {formatHufAmount(line.workshop.listPriceHuf * line.quantity)}
                    <small>net</small>
                  </span>
                  <button
                    type="button"
                    className="min-h-11 cursor-pointer text-sm text-destructive underline underline-offset-2"
                    onClick={() => cart.remove(line.workshop.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <p className="mini mt-3.5">
                Max 5 seats / workshop · need more? Ask for a custom offer
              </p>
            </div>
          </section>

          <div className="sumbox">
            {preview.isPending && <p className="mini py-1">Calculating totals…</p>}
            {preview.isError && (
              <p role="alert" className="inline-flex items-center gap-1.5 py-1 text-sm text-destructive">
                <WarnGlyph />
                {preview.error.message}
              </p>
            )}
            {preview.data && (
              <>
                <div className="sumrow">
                  <span className="sumrow-k">Net subtotal</span>
                  <span className="sumrow-v" data-testid="cart-net">
                    {formatHufAmount(preview.data.netSubtotalHuf)}
                  </span>
                </div>
                <div className="sumrow">
                  <span className="sumrow-k">VAT 27%</span>
                  <span className="sumrow-v" data-testid="cart-vat">
                    {formatHufAmount(preview.data.vatHuf)}
                  </span>
                </div>
                <div className="sumrow sumrow-grand">
                  <span className="sumrow-k">Gross total</span>
                  <span className="sumrow-v" data-testid="cart-gross">
                    {formatHufAmount(preview.data.grossHuf)}
                  </span>
                </div>
              </>
            )}
            <button
              type="button"
              className="keycap mt-4 min-h-11 w-full"
              data-testid="proceed-checkout"
              onClick={onCheckout}
              disabled={!preview.data}
            >
              Proceed to checkout
            </button>
            <button
              type="button"
              className="btn-plate mt-2 min-h-11 w-full"
              onClick={onContinueShopping}
            >
              Continue shopping
            </button>
          </div>
        </div>
      )}
    </>
  );
}
