import type { Metadata } from "next";

import { ShopDemo } from "./shop-demo";

export const metadata: Metadata = { title: "Shop demo — Reference App" };

export default function ShopPage() {
  return <ShopDemo />;
}
