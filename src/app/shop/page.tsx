import type { Metadata } from "next";
import ShopBrowser from "@/components/ShopBrowser";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "All Shoes — Buy Footwear Online in Sri Lanka",
  description:
    "Browse the full New Step catalogue: men's, women's and kids' footwear with live size availability, island-wide delivery and cash on delivery.",
};

export default function ShopPage() {
  return (
    <ShopBrowser
      products={products}
      heading="All Shoes"
      intro="Every pair we stock, with real size-level availability. Filter by size so you only see what actually fits."
    />
  );
}
