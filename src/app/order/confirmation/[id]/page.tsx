import type { Metadata } from "next";
import OrderConfirmation from "@/components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your New Step Footwear cash-on-delivery order has been placed.",
  robots: { index: false },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderConfirmation id={id} />;
}
