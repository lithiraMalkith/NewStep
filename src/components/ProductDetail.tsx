"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { LKR } from "@/lib/format";
import type { Product } from "@/lib/types";

const SIZE_GUIDE = [
  { eu: 39, uk: 6, cm: 24.5 },
  { eu: 40, uk: 6.5, cm: 25 },
  { eu: 41, uk: 7.5, cm: 26 },
  { eu: 42, uk: 8, cm: 26.5 },
  { eu: 43, uk: 9, cm: 27.5 },
  { eu: 44, uk: 9.5, cm: 28 },
  { eu: 45, uk: 10.5, cm: 29 },
];

function Accordion({
  title,
  children,
  id,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border-b border-line">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left text-[15px] font-medium"
      >
        {title}
        <span className="text-xl leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-5 text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export default function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);

  const selected = product.variants.find((v) => v.size === size);
  const soldOut = product.variants.every((v) => v.stockQty === 0);

  const onAdd = () => {
    if (!selected) {
      setError(true);
      return;
    }
    setError(false);
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colour: product.colour,
      image: product.images[0]!,
      size: selected.size,
      price: product.price,
      qty: 1,
      maxQty: Math.min(selected.stockQty, 5),
    });
  };

  return (
    <div className="container-x grid gap-10 py-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-10">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden bg-mist">
          <Image
            src={product.images[active]!}
            alt={`${product.name} in ${product.colour}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {product.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative h-20 w-20 overflow-hidden bg-mist ring-1 transition-all ${
                  i === active ? "ring-ink" : "ring-line hover:ring-muted"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy box */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <nav className="text-sm text-muted">
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          {" / "}
          <Link href={`/shop/${product.category}`} className="hover:text-ink">
            {product.categoryLabel}
          </Link>
        </nav>

        <h1 className="display mt-3 text-[clamp(1.6rem,5vw,2.5rem)]">{product.name}</h1>
        <p className="mt-1 text-[15px] text-muted">{product.subtitle}</p>
        <p className="text-[15px] text-muted">{product.colour}</p>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xl font-semibold">{LKR(product.price)}</span>
          {product.compareAtPrice && (
            <>
              <span className="text-[15px] text-muted line-through">
                {LKR(product.compareAtPrice)}
              </span>
              <span className="eyebrow bg-sale px-2 py-1 text-paper">
                {Math.round((1 - product.price / product.compareAtPrice) * 100)}% off
              </span>
            </>
          )}
        </div>

        <p className="mt-2 text-sm text-muted">
          ★ {product.rating.toFixed(1)} · {product.reviewCount} reviews
        </p>

        {/* Size selector */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Select size (EU)</span>
            <a href="#size-guide" className="text-sm underline underline-offset-4">
              Size guide
            </a>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {product.variants.map((v) => {
              const out = v.stockQty === 0;
              const isActive = size === v.size;
              return (
                <button
                  key={v.size}
                  disabled={out}
                  onClick={() => {
                    setSize(v.size);
                    setError(false);
                  }}
                  aria-pressed={isActive}
                  className={`relative border py-3 text-[15px] transition-colors ${
                    out
                      ? "cursor-not-allowed border-line text-muted/50 line-through"
                      : isActive
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink"
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 text-sm text-sale">Please select a size first.</p>
          )}
          {selected && selected.stockQty <= 3 && (
            <p className="mt-3 text-sm font-medium text-sale">
              Only {selected.stockQty} left in EU {selected.size}
            </p>
          )}
          {selected && selected.stockQty > 3 && (
            <p className="mt-3 text-sm text-ok">In stock &mdash; ready to ship</p>
          )}
        </div>

        <div className="mt-6 grid gap-2">
          <button onClick={onAdd} disabled={soldOut} className="btn btn-solid w-full">
            {soldOut ? "Sold out" : "Add to bag"}
          </button>
          <a
            href={`https://wa.me/94770000000?text=Hi%2C%20is%20${encodeURIComponent(product.name)}%20available%3F`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline w-full"
          >
            Ask about this shoe
          </a>
        </div>

        <div className="mt-4 space-y-1 text-sm text-muted">
          <p>Cash on delivery available island-wide.</p>
          <p>Free delivery on orders over Rs. 15,000.</p>
        </div>

        <div className="mt-8">
          <Accordion title="Description" defaultOpen>
            <p>{product.description}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Accordion>

          <Accordion title="Size guide" id="size-guide">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink">
                  <th className="py-2">EU</th>
                  <th className="py-2">UK</th>
                  <th className="py-2">Foot length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((r) => (
                  <tr key={r.eu} className="border-b border-line/60">
                    <td className="py-2">{r.eu}</td>
                    <td className="py-2">{r.uk}</td>
                    <td className="py-2">{r.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3">
              Measure your foot from heel to longest toe in the evening, then add
              0.5cm for comfort.
            </p>
          </Accordion>

          <Accordion title="Delivery & returns">
            <p>
              Colombo Rs. 350, Western Province Rs. 400, other districts Rs. 450 –
              Rs. 580. Free over Rs. 15,000. Delivery in 2 – 4 working days by
              island-wide courier, paid in cash on arrival.
            </p>
            <p className="mt-3">
              Unworn shoes in original packaging can be exchanged for another size
              within 7 days.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
