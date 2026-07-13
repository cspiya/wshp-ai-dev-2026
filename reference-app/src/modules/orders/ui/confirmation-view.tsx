"use client";

import { formatHuf, formatHufAmount } from "@/lib/format";
import type { Order } from "../domain/order";

import { JourneyRail, type JourneyStep } from "./journey-rail";

/**
 * View 5/5 — confirmation (mock: order-summary certificate with the invoice
 * data). Every ledger value comes from the PLACED order the server returned;
 * nothing is recomputed or fabricated client-side.
 */
export function ConfirmationView({
  order,
  onBackToCatalog,
}: {
  order: Order;
  onBackToCatalog: () => void;
}) {
  const steps: JourneyStep[] = [
    { index: "01", label: "Cart", state: "completed", note: "Done" },
    { index: "02", label: "Your details", state: "completed", note: "Done" },
    {
      index: "03",
      label: "Billing",
      state: "completed",
      note: order.buyer.kind === "company" ? "Company" : "Person",
    },
    { index: "04", label: "Payment", state: "completed", note: "Authorized" },
    { index: "05", label: "Done", state: "completed", note: "Order placed" },
  ];

  return (
    <>
      <JourneyRail steps={steps} className="rail-5" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Thank you — order placed.
      </h1>
      <p className="lede mt-2">
        Confirmation and the invoice details go to {order.contact.email}. Everything below
        is invented training data.
      </p>

      <section aria-labelledby="order-heading" className="cert mt-7">
        <span className="cert-stamp" aria-hidden="true">
          PAID · INVENTED
        </span>
        <h2
          id="order-heading"
          data-testid="order-number"
          className="flex items-center gap-2.5 pr-24 text-[1.35rem] font-bold tracking-tight"
        >
          <span className="dotlamp dotlamp-ok size-3" aria-hidden="true" />
          Order {order.orderNumber} — summary
        </h2>
        <div className="ledger">
          <div>
            <span className="ledger-k">Buyer</span>
            <span className="ledger-v" data-testid="order-buyer">
              {order.buyer.kind === "company"
                ? `${order.buyer.companyName} · tax nr ${order.buyer.taxNumber}`
                : order.buyer.name}
            </span>
          </div>
          <div>
            <span className="ledger-k">Contact</span>
            <span className="ledger-v">
              {order.contact.name} · {order.contact.phone} · {order.contact.email}
            </span>
          </div>
          <div>
            <span className="ledger-k">Billing</span>
            <span className="ledger-v">
              {order.billing.postalCode} {order.billing.city}, {order.billing.street},{" "}
              {order.billing.country}
            </span>
          </div>
          <div>
            <span className="ledger-k">Items</span>
            <span className="ledger-v" data-testid="order-items">
              {order.items
                .map(
                  (item) =>
                    `${item.quantity}× ${item.title} (net ${formatHuf(item.unitNetHuf * item.quantity)})`,
                )
                .join(" · ")}
            </span>
          </div>
          <div>
            <span className="ledger-k">Coupon</span>
            <span className="ledger-v" data-testid="order-coupon">
              {order.totals.couponCode
                ? `${order.totals.couponCode} · −${formatHufAmount(order.totals.discountHuf)} net`
                : "—"}
            </span>
          </div>
          <div>
            <span className="ledger-k">Totals</span>
            <span className="ledger-v" data-testid="order-totals">
              net {formatHuf(order.totals.netAfterDiscountHuf)} + VAT{" "}
              {formatHuf(order.totals.vatHuf)} ={" "}
              <b>gross {formatHufAmount(order.totals.grossHuf)}</b>
            </span>
          </div>
          <div>
            <span className="ledger-k">Payment auth</span>
            <span className="ledger-v" data-testid="order-payment-auth">
              {order.paymentAuthorizationId}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dashed border-[#cfe0cf] pt-4">
          <button type="button" className="keycap min-h-11" onClick={onBackToCatalog}>
            Back to catalog
          </button>
          <span className="mini">Back to catalog resets the cart</span>
        </div>
      </section>
    </>
  );
}
