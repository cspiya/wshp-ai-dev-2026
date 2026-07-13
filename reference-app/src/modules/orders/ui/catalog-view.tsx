"use client";

import { WarnGlyph } from "@/components/ui/glyphs";
import { formatDate } from "@/lib/format";
import { trpc } from "@/platform/api/client";

import { PriceBlock } from "./price-block";
import type { CatalogWorkshop } from "./shop-journey";

/**
 * View 1/5 — catalog (mock: "Book your training"). Cards come from the live
 * `workshops.list` query; net price is the workshop's listPriceHuf and every
 * card shows net + gross per seat.
 */
export function CatalogView({
  onViewDetails,
  onAddToCart,
}: {
  onViewDetails: (workshop: CatalogWorkshop) => void;
  onAddToCart: (workshop: CatalogWorkshop) => void;
}) {
  const workshops = trpc.workshops.list.useQuery();

  return (
    <>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Book your training
      </h1>
      <p className="lede mt-2">
        All prices are net; the training VAT (27%, invented) and the gross total are always
        shown. Add up to 5 seats per workshop — need more? Ask the organizer for a custom
        offer.
      </p>

      <section aria-label="Workshop catalog" className="mt-7">
        {workshops.isPending && (
          <div className="grid gap-4 md:grid-cols-3" aria-label="Loading workshops">
            {[0, 1, 2].map((i) => (
              <div key={i} className="wcard p-0">
                <div className="wcard-strip opacity-30" />
                <div className="wcard-in">
                  <p className="text-sm text-muted-foreground">Loading workshops…</p>
                  <div className="h-6 rounded bg-muted motion-safe:animate-pulse" />
                  <div className="h-6 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {workshops.isError && (
          <div role="alert" className="mod border-destructive/40">
            <div className="mod-head">
              <span className="mod-tag">Catalog</span>
              <span className="mod-stat">
                <span className="dotlamp dotlamp-bad" aria-hidden="true" />
                Error
              </span>
            </div>
            <div className="mod-body">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                <WarnGlyph />
                Could not load the workshop catalog.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{workshops.error.message}</p>
            </div>
          </div>
        )}

        {workshops.data?.length === 0 && (
          <div className="mod">
            <div className="mod-head">
              <span className="mod-tag">Catalog</span>
              <span className="mod-stat">
                <span className="dotlamp" aria-hidden="true" />0 records
              </span>
            </div>
            <div className="mod-body">
              <p role="alert" className="inline-flex items-center gap-1.5 text-sm">
                <WarnGlyph className="text-destructive" />
                No workshop is available. Seed the database first.
              </p>
            </div>
          </div>
        )}

        {workshops.data && workshops.data.length > 0 && (
          <ul className="grid list-none gap-4 md:grid-cols-3">
            {workshops.data.map((workshop) => (
              <li key={workshop.id} className="wcard">
                <div className="wcard-strip" aria-hidden="true" />
                <div className="wcard-in">
                  <span className="wcard-kind">{workshop.location}</span>
                  <h2 className="wcard-title">{workshop.title}</h2>
                  <div className="wcard-meta">
                    <span>
                      Date <b>{formatDate(workshop.date)}</b>
                    </span>
                    <span>
                      Seats <b>{workshop.capacity}</b>
                    </span>
                  </div>
                  <div className="mt-auto pt-3">
                    <PriceBlock netHuf={workshop.listPriceHuf} perSeat />
                  </div>
                  <button
                    type="button"
                    className="btn-plate mt-2 min-h-11"
                    onClick={() => onViewDetails(workshop)}
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    className="keycap min-h-11"
                    onClick={() => onAddToCart(workshop)}
                  >
                    Add to cart
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
