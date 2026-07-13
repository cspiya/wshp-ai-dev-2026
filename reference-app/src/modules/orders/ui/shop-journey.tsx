"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { inferRouterOutputs } from "@trpc/server";

import type { Order } from "../domain/order";
import { MAX_SEATS_PER_WORKSHOP } from "../domain/order";
import type { AppRouter } from "@/platform/api/root";

import { CartView } from "./cart-view";
import { CatalogView } from "./catalog-view";
import { CheckoutView } from "./checkout-view";
import { ConfirmationView } from "./confirmation-view";
import { ProductView } from "./product-view";

/**
 * Webshop purchase journey (accepted mock: docs/design/mock-webshop-journey.html):
 * one client-side wizard over five views — catalog → product detail → cart →
 * checkout → confirmation. The cart is page-level React context; everything
 * money-related comes from the server (`orders.preview` / `orders.place`) —
 * the client renders totals, it never computes them.
 */

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type CatalogWorkshop = RouterOutputs["workshops"]["list"][number];

export type CartLine = { workshop: CatalogWorkshop; quantity: number };

type CartApi = {
  lines: CartLine[];
  seatCount: number;
  /** Adds seats, merging with an existing line; clamped at the per-workshop cap. */
  addSeats: (workshop: CatalogWorkshop, quantity: number) => void;
  setQuantity: (workshopId: string, quantity: number) => void;
  remove: (workshopId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function useCart(): CartApi {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside the shop journey");
  return cart;
}

type View =
  | { name: "catalog" }
  | { name: "product"; workshop: CatalogWorkshop }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "confirmation"; order: Order };

function crumbFor(view: View): ReactNode {
  switch (view.name) {
    case "catalog":
      return <>CATALOG</>;
    case "product":
      return <>CATALOG · {view.workshop.title}</>;
    case "cart":
      return <>CART</>;
    case "checkout":
      return <>CHECKOUT</>;
    case "confirmation":
      return <>ORDER · {view.order.orderNumber}</>;
  }
}

export function ShopJourney() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [view, setView] = useState<View>({ name: "catalog" });

  const cart = useMemo<CartApi>(() => {
    const clamp = (quantity: number) =>
      Math.min(MAX_SEATS_PER_WORKSHOP, Math.max(1, quantity));
    return {
      lines,
      seatCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      addSeats: (workshop, quantity) =>
        setLines((current) => {
          const existing = current.find((line) => line.workshop.id === workshop.id);
          if (!existing) return [...current, { workshop, quantity: clamp(quantity) }];
          return current.map((line) =>
            line.workshop.id === workshop.id
              ? { ...line, quantity: clamp(line.quantity + quantity) }
              : line,
          );
        }),
      setQuantity: (workshopId, quantity) =>
        setLines((current) =>
          current.map((line) =>
            line.workshop.id === workshopId ? { ...line, quantity: clamp(quantity) } : line,
          ),
        ),
      remove: (workshopId) =>
        setLines((current) => current.filter((line) => line.workshop.id !== workshopId)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return (
    <CartContext.Provider value={cart}>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
      >
        {/* page-header row: breadcrumb + the cart chip (mock's bar counter,
            rendered here because the page owns the cart — not the site header) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="crumb">
            <b>SHOP</b> · {crumbFor(view)}
          </p>
          <button
            type="button"
            className="btn-plate min-h-11 gap-2 text-sm"
            data-testid="cart-chip"
            aria-label={`Open cart, ${cart.seatCount} seats`}
            onClick={() => setView({ name: "cart" })}
          >
            Cart
            <span
              className="rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground"
              data-testid="cart-count"
            >
              {cart.seatCount}
            </span>
          </button>
        </div>

        {view.name === "catalog" && (
          <CatalogView
            onViewDetails={(workshop) => setView({ name: "product", workshop })}
            onAddToCart={(workshop) => {
              cart.addSeats(workshop, 1);
              setView({ name: "cart" });
            }}
          />
        )}
        {view.name === "product" && (
          <ProductView
            workshop={view.workshop}
            onAddToCart={(workshop, quantity) => {
              cart.addSeats(workshop, quantity);
              setView({ name: "cart" });
            }}
            onBack={() => setView({ name: "catalog" })}
          />
        )}
        {view.name === "cart" && (
          <CartView
            onCheckout={() => setView({ name: "checkout" })}
            onContinueShopping={() => setView({ name: "catalog" })}
          />
        )}
        {view.name === "checkout" && (
          <CheckoutView
            onBackToCart={() => setView({ name: "cart" })}
            onPlaced={(order) => {
              // The purchase is complete — the cart empties with it (the
              // confirmation certificate carries the order snapshot).
              cart.clear();
              setView({ name: "confirmation", order });
            }}
          />
        )}
        {view.name === "confirmation" && (
          <ConfirmationView
            order={view.order}
            onBackToCatalog={() => {
              cart.clear();
              setView({ name: "catalog" });
            }}
          />
        )}
      </main>
    </CartContext.Provider>
  );
}
