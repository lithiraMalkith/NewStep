"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { DISTRICTS, FREE_DELIVERY_THRESHOLD, LKR, deliveryFor } from "@/lib/format";

export default function CartView() {
  const { lines, subtotal, setQty, remove, ready } = useCart();
  const [district, setDistrict] = useState("");
  const delivery = deliveryFor(district, subtotal);
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;

  if (!ready) {
    return <div className="container-x py-24 text-center text-muted">Loading your bag…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-x flex flex-col items-center gap-5 py-24 text-center">
        <h1 className="display text-3xl">Your bag is empty</h1>
        <p className="max-w-sm text-[15px] text-muted">
          Nothing here yet. Browse the catalogue and check your size availability
          in real time.
        </p>
        <Link href="/shop" className="btn btn-solid">
          Shop all shoes
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <h1 className="display text-[clamp(1.75rem,6vw,3rem)]">Your Bag</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => (
            <li key={`${l.productId}-${l.size}`} className="flex gap-4 py-5 sm:gap-6">
              <Link href={`/product/${l.slug}`} className="relative h-28 w-28 shrink-0 bg-mist sm:h-36 sm:w-36">
                <Image src={l.image} alt={l.name} fill sizes="144px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/product/${l.slug}`} className="block truncate text-[15px] font-medium">
                      {l.name}
                    </Link>
                    <p className="text-sm text-muted">{l.colour}</p>
                    <p className="text-sm text-muted">Size EU {l.size}</p>
                  </div>
                  <p className="whitespace-nowrap text-[15px] font-medium">
                    {LKR(l.price * l.qty)}
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-4 pt-4">
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      aria-label="Decrease quantity"
                      disabled={l.qty <= 1}
                      onClick={() => setQty(l.productId, l.size, l.qty - 1)}
                      className="px-3 py-1.5 text-lg leading-none disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm">{l.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      disabled={l.qty >= l.maxQty}
                      onClick={() => setQty(l.productId, l.size, l.qty + 1)}
                      className="px-3 py-1.5 text-lg leading-none disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.productId, l.size)}
                    className="text-sm text-muted underline underline-offset-4"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="display text-xl">Summary</h2>

          <div className="mt-5">
            <label htmlFor="district" className="eyebrow">
              Estimate delivery
            </label>
            <select
              id="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-2 w-full border border-line px-4 py-3 text-[15px]"
            >
              <option value="">Select your district</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {remaining > 0 && (
            <p className="mt-4 border border-line p-3 text-sm text-muted">
              Add {LKR(remaining)} more for free island-wide delivery.
            </p>
          )}

          <dl className="mt-5 space-y-2 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{LKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{district ? (delivery === 0 ? "Free" : LKR(delivery)) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
              <dt>Total</dt>
              <dd>{LKR(subtotal + delivery)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="btn btn-solid mt-6 w-full">
            Checkout &mdash; Cash on Delivery
          </Link>
          <Link href="/shop" className="btn btn-outline mt-2 w-full">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
