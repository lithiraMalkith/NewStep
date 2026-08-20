import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout — Cash on Delivery",
  description: "Guest checkout with cash on delivery, island-wide across Sri Lanka.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
