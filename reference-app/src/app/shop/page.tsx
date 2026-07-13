import type { Metadata } from "next";

import { ShopJourney } from "@/modules/orders/orders.contract";

export const metadata: Metadata = { title: "Shop — Reference Lab" };

export default function ShopPage() {
  return <ShopJourney />;
}
