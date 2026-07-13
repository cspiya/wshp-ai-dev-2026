"use client";

import { useState } from "react";

import { grossFromNet } from "../domain/order";
import { formatDate, formatHufAmount } from "@/lib/format";

import { PriceBlock } from "./price-block";
import { QtyStepper } from "./qty-stepper";
import type { CatalogWorkshop } from "./shop-journey";

/**
 * View 2/5 — product detail (mock: description + quantity 1–5, above that a
 * custom offer). The description comes from the workshop's own description
 * field; the facts rows show only what the record really contains.
 */
export function ProductView({
  workshop,
  onAddToCart,
  onBack,
}: {
  workshop: CatalogWorkshop;
  onAddToCart: (workshop: CatalogWorkshop, quantity: number) => void;
  onBack: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const lineGrossHuf = grossFromNet(workshop.listPriceHuf * quantity);

  return (
    <>
      <div className="mt-2 grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {workshop.title}
          </h1>
          <p className="lede mt-2">
            {workshop.description ||
              "No description has been added to this workshop yet — the facts below are the live record."}
          </p>
          <section aria-labelledby="facts-heading" className="mod mt-6">
            <div className="mod-head">
              <span className="mod-tag" id="facts-heading">
                Workshop facts
              </span>
              <span className="mod-stat">
                <span className="dotlamp dotlamp-ok" aria-hidden="true" />
                In catalog
              </span>
            </div>
            <div className="mod-body">
              <div className="read">
                <span className="read-k">Date</span>
                <span className="read-v">{formatDate(workshop.date)}</span>
              </div>
              <div className="read">
                <span className="read-k">Location</span>
                <span className="read-v">{workshop.location}</span>
              </div>
              <div className="read">
                <span className="read-k">Capacity</span>
                <span className="read-v">{workshop.capacity} seats</span>
              </div>
            </div>
          </section>
        </div>

        <section aria-labelledby="order-heading" className="mod mt-0">
          <div className="mod-head">
            <span className="mod-tag" id="order-heading">
              Order this training
            </span>
          </div>
          <div className="mod-body">
            <PriceBlock netHuf={workshop.listPriceHuf} perSeat className="mb-4" />
            <p className="micro-label mb-1.5" id="seats-label">
              Seats
            </p>
            <div className="flex items-center gap-3">
              <QtyStepper
                value={quantity}
                onChange={setQuantity}
                label={`seats for ${workshop.title}`}
                testId="qty-value"
              />
              <span className="mini">Max 5</span>
            </div>
            <p className="hintbox mt-3">
              Need more than 5 seats? Contact the organizer for a custom group offer — the
              cart is capped at 5 per workshop.
            </p>
            <button
              type="button"
              className="keycap mt-4 min-h-11 w-full"
              data-testid="add-to-cart"
              onClick={() => onAddToCart(workshop, quantity)}
            >
              Add {quantity} {quantity === 1 ? "seat" : "seats"} to cart ·{" "}
              {formatHufAmount(lineGrossHuf)} gross
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <button type="button" className="back-link min-h-11" onClick={onBack}>
          &larr; Back to catalog
        </button>
      </div>
    </>
  );
}
