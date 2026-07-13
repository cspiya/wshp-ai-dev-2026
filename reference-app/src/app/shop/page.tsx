import type { Metadata } from "next";

import { ShopDemo } from "./shop-demo";

export const metadata: Metadata = { title: "Shop journey — Reference Lab" };

export default function ShopPage() {
  return <ShopDemo />;
}
