import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review your New Step Footwear order before checking out with cash on delivery.",
  robots: { index: false },
};

export default function CartPage() {
  return <CartView />;
}
