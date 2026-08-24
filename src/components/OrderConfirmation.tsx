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
      <div data-conf className="flex justify-center mb-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-mist/50 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-ink/10"></div>
          <svg className="w-16 h-16 md:w-20 md:h-20 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h1 data-conf className="display text-[clamp(2rem,7vw,3.25rem)]">
          Your order has been successfully placed.
        </h1>
        <p data-conf className="mt-3 text-[18px] font-medium text-ink">
          Thank you for your order{order ? `, ${order.customer.fullName.split(" ")[0]}` : ""}!
        </p>
        <p data-conf className="mt-2 text-[15px] text-muted max-w-lg mx-auto">
          We've received your order and our team will call you shortly to confirm the details before dispatch.
        </p>
      </div>

      <div data-conf className="mt-10 border border-line p-6 bg-paper rounded-xl shadow-sm text-center">
        <p className="eyebrow text-muted">Order reference</p>
        <p className="display mt-1 text-3xl tracking-tight text-ink">{id}</p>
        <p className="mt-3 text-sm font-medium px-3 py-1 bg-mist inline-block rounded-full">
          Payment: Cash on Delivery &middot; Status: Pending
        </p>
      </div>

      {order && (
        <div data-conf className="mt-8 border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line px-5">
            {order.lines.map((l) => (
              <li key={`${l.productId}-${l.size}`} className="flex items-center gap-4 py-4 text-[15px]">
                <div className="w-16 h-16 shrink-0 bg-mist rounded-lg overflow-hidden relative">
                  <img src={l.image || "/images/p1.jpg"} alt={l.name} className="object-cover w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{l.name}</span>
                  <span className="text-sm text-muted">
                    EU {l.size} &middot; Qty {l.qty}
                  </span>
                </div>
                <span className="whitespace-nowrap font-medium">{LKR(l.price * l.qty)}</span>
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
