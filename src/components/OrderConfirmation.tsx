"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LKR } from "@/lib/format";
import { readOrder } from "@/lib/orders";
import { getWhatsAppLink } from "@/lib/config";
import type { Order } from "@/lib/types";

export default function OrderConfirmation({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const local = readOrder(id);
    if (local) {
      setOrder(local);
      setLoaded(true);
      return;
    }

    // Fallback fetch from server by orderRef / ID
    fetch(`/api/account/orders?ref=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const sOrder = data.data[0];
          setOrder({
            id: sOrder.orderRef || sOrder.id,
            createdAt: sOrder.createdAt || new Date().toISOString(),
            customer: {
              fullName: sOrder.customer?.name || "",
              phone: sOrder.customer?.phone || "",
              email: sOrder.customer?.email || "",
              address: sOrder.deliveryAddress?.address || "",
              city: sOrder.deliveryAddress?.city || "",
              district: sOrder.deliveryAddress?.district || "",
              notes: sOrder.deliveryAddress?.notes,
            },
            lines: (sOrder.items || []).map((item: any) => ({
              productId: item.productId || "",
              slug: item.slug || "",
              name: item.productName || item.name || "",
              colour: item.colour || "",
              image: item.image || "",
              size: item.size || 0,
              price: item.price || 0,
              qty: item.quantity || item.qty || 1,
              maxQty: 10,
            })),
            subtotal: sOrder.subtotal || 0,
            delivery: sOrder.deliveryFee ?? sOrder.delivery ?? 0,
            total: sOrder.total || 0,
            paymentMethod: "COD",
            status: sOrder.status || "Pending",
          });
        }
      })
      .catch((err) => console.error("Error fetching order confirmation from server:", err))
      .finally(() => setLoaded(true));
  }, [id]);

  useEffect(() => {
    if (!loaded || !root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-conf]",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" },
      );
    }, root);
    return () => ctx.revert();
  }, [loaded]);

  if (!loaded) {
    return <div className="container-x py-24 text-center text-muted">Loading order…</div>;
  }

  return (
    <div ref={root} className="container-x max-w-2xl py-14">
      <div data-conf className="grid h-14 w-14 place-items-center rounded-full bg-ink text-paper">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 data-conf className="display mt-6 text-[clamp(2rem,7vw,3.25rem)]">
        Order confirmed
      </h1>
      <p data-conf className="mt-3 text-[15px] text-muted">
        Thank you{order ? `, ${order.customer.fullName.split(" ")[0]}` : ""}. Your
        order has been placed and our team will call to confirm before dispatch.
      </p>

      <div data-conf className="mt-8 border border-line p-5">
        <p className="eyebrow text-muted">Order reference</p>
        <p className="display mt-1 text-2xl">{id}</p>
        <p className="mt-3 text-sm text-muted">
          Payment method: Cash on Delivery &middot; Status: Pending
        </p>
      </div>

      {order && (
        <div data-conf className="mt-6 border border-line">
          <ul className="divide-y divide-line px-5">
            {order.lines.map((l) => (
              <li key={`${l.productId}-${l.size}`} className="flex justify-between gap-4 py-3 text-[15px]">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="text-sm text-muted">
                    EU {l.size} &middot; Qty {l.qty}
                  </span>
                </span>
                <span className="whitespace-nowrap">{LKR(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line px-5 py-4 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{LKR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery — {order.customer.district}</dt>
              <dd>{order.delivery === 0 ? "Free" : LKR(order.delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
              <dt>Pay on delivery</dt>
              <dd>{LKR(order.total)}</dd>
            </div>
          </dl>
          <div className="border-t border-line px-5 py-4 text-sm text-muted">
            <p className="font-medium text-ink">Delivering to</p>
            <p className="mt-1">
              {order.customer.address}, {order.customer.city}, {order.customer.district}
            </p>
            <p>{order.customer.phone}</p>
          </div>
        </div>
      )}

      <div data-conf className="mt-6 border border-line p-5 text-[15px] text-muted">
        <p className="font-medium text-ink">What happens next</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>We call or WhatsApp you to confirm the order and size.</li>
          <li>Your parcel is handed to our island-wide courier partner.</li>
          <li>Delivery in 2 – 4 working days; pay the courier in cash.</li>
        </ol>
      </div>

      <div data-conf className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-solid">
          Continue shopping
        </Link>
        <a
          href={getWhatsAppLink(`Hi, about my order ${id}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Ask about this order
        </a>
      </div>
    </div>
  );
}
