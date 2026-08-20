"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { LKR } from "@/lib/format";

export default function CartDrawer() {
  const { lines, subtotal, drawerOpen, closeDrawer, remove, setQty } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div
      className={`fixed inset-0 z-[70] ${drawerOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!drawerOpen}
    >
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="display text-lg">Your Bag</h2>
          <button aria-label="Close bag" onClick={closeDrawer} className="p-1 text-2xl leading-none">
            &times;
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-muted">Your bag is empty.</p>
            <Link href="/shop" onClick={closeDrawer} className="btn btn-solid">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={`${l.productId}-${l.size}`} className="flex gap-4 py-4">
                  <Link
                    href={`/product/${l.slug}`}
                    onClick={closeDrawer}
                    className="relative h-24 w-24 shrink-0 bg-mist"
                  >
                    <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{l.name}</p>
                    <p className="text-sm text-muted">
                      {l.colour} &middot; EU {l.size}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          aria-label="Decrease quantity"
                          className="px-3 py-1 text-lg leading-none disabled:opacity-30"
                          disabled={l.qty <= 1}
                          onClick={() => setQty(l.productId, l.size, l.qty - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">{l.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="px-3 py-1 text-lg leading-none disabled:opacity-30"
                          disabled={l.qty >= l.maxQty}
                          onClick={() => setQty(l.productId, l.size, l.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[15px] font-medium">{LKR(l.price * l.qty)}</span>
                    </div>
                    <button
                      onClick={() => remove(l.productId, l.size)}
                      className="mt-2 text-sm text-muted underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-4">
              <div className="flex justify-between text-[15px]">
                <span>Subtotal</span>
                <span className="font-medium">{LKR(subtotal)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                Delivery calculated at checkout by district.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/checkout" onClick={closeDrawer} className="btn btn-solid w-full">
                  Checkout &mdash; Cash on Delivery
                </Link>
                <Link href="/cart" onClick={closeDrawer} className="btn btn-outline w-full">
                  View bag
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
