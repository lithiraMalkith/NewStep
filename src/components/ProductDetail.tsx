"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "./CartProvider";
import { LKR } from "@/lib/format";
import type { Product } from "@/lib/types";
import ReviewSection from "./ReviewSection";
import ClientProductRating from "./ClientProductRating";

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

  // Extract all distinct colours for this product
  const allProductColours = Array.from(
    new Set(
      (product.variants || []).flatMap((v) =>
        v.colours && v.colours.length > 0
          ? v.colours.map((c) => c.colour)
          : product.colour && product.colour.includes(" / ")
            ? product.colour.split(" / ").map((c) => c.trim())
            : [product.colour || "Standard"]
      )
    )
  ).filter(Boolean);

  const hasColourVariants = allProductColours.length > 0;

  const [size, setSize] = useState<number | null>(null);
  const [selectedColour, setSelectedColour] = useState<string | null>(allProductColours[0] || null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);
  const [colourError, setColourError] = useState(false);

  // Selected size variant
  const selectedVariant = product.variants.find((v) => v.size === size);

  // Stock helper: variant stock in given colour
  const getVariantStockForColour = (v: typeof product.variants[0], col: string | null): number => {
    if (!col) {
      if (v.colours && v.colours.length > 0) {
        return v.colours.reduce((sum, c) => sum + c.stockQty, 0);
      }
      return v.stockQty ?? 0;
    }
    if (v.colours && v.colours.length > 0) {
      const match = v.colours.find((c) => c.colour.toLowerCase() === col.toLowerCase());
      return match ? match.stockQty : 0;
    }
    return v.stockQty ?? 0;
  };

  // Stock helper: colour stock in given size (or across all sizes if size is null)
  const getColourStockForSize = (col: string, s: number | null): number => {
    if (s !== null) {
      const v = product.variants.find((item) => item.size === s);
      if (!v) return 0;
      return getVariantStockForColour(v, col);
    }
    return product.variants.reduce((sum, v) => sum + getVariantStockForColour(v, col), 0);
  };

  // Current stock for selected combo
  const selectedStock = selectedVariant
    ? getVariantStockForColour(selectedVariant, selectedColour)
    : 0;

  // Check if shoe is entirely sold out
  const soldOut = product.variants.every(
    (v) => getVariantStockForColour(v, null) === 0
  );

  // Customer selects size
  const handleSizeSelect = (s: number) => {
    setSize(s);
    setError(false);
    // If a colour was already selected, check if it's in stock for this new size
    if (selectedColour && getColourStockForSize(selectedColour, s) === 0) {
      // Pick first colour that IS in stock for this size, if any
      const inStockCol = allProductColours.find((c) => getColourStockForSize(c, s) > 0);
      setSelectedColour(inStockCol || null);
    }
  };

  // Customer selects colour manually
  const handleColourSelect = (c: string) => {
    setSelectedColour(c);
    setColourError(false);
    // If a size was already selected, check if it's in stock for this new colour
    if (size !== null) {
      const currentVariant = product.variants.find((v) => v.size === size);
      if (currentVariant && getVariantStockForColour(currentVariant, c) === 0) {
        setSize(null);
      }
    }
  };

  const onAdd = () => {
    if (!selectedVariant) {
      setError(true);
      return;
    }
    setError(false);
    setColourError(false);
    const chosenColour = selectedColour || allProductColours[0] || product.colour;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colour: chosenColour,
      image: product.images[0]!,
      size: selectedVariant.size,
      price: product.price,
      qty: 1,
      maxQty: Math.min(selectedStock > 0 ? selectedStock : 1, 5),
    });
  };

  return (
    <div>
      <div className="container-x grid gap-10 py-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-10">
        {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden bg-mist">
          <Image
            src={(product.images && product.images[active]) || (product.images && product.images[0]) || "/brand-visuals/p1.jpg"}
            alt={`${product.name} in ${product.colour || "Standard"}`}
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

        <ClientProductRating productId={product.id} showText />

        {/* Colour selector — customer can choose colour manually anytime */}
        {hasColourVariants && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="eyebrow">
                Select colour {selectedColour ? `· ${selectedColour}` : ""}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {allProductColours.map((c) => {
                const stockInColour = getColourStockForSize(c, size);
                const isColAvailable = stockInColour > 0;
                const isActive = selectedColour === c;
                return (
                  <button
                    key={c}
                    disabled={!isColAvailable}
                    onClick={() => handleColourSelect(c)}
                    aria-pressed={isActive}
                    className={`px-4 py-2 border text-sm transition-colors rounded ${
                      !isColAvailable
                        ? "cursor-not-allowed border-line text-muted/50"
                        : isActive
                          ? "border-ink bg-ink text-paper font-medium"
                          : "border-line hover:border-ink"
                    }`}
                  >
                    {!isColAvailable ? `🚫 ${c}` : c}
                  </button>
                );
              })}
            </div>
            {colourError && <p className="mt-2 text-sm text-sale">Please select a colour.</p>}
          </div>
        )}

        {/* Size selector */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow">
              Select size (EU) {size ? `· EU ${size}` : ""}
            </span>
            <a href="#size-guide" className="text-sm underline underline-offset-4">
              Size guide
            </a>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {product.variants.map((v) => {
              const stockInSize = getVariantStockForColour(v, selectedColour);
              const available = stockInSize > 0;
              const isActive = size === v.size;
              return (
                <button
                  key={v.size}
                  disabled={!available}
                  onClick={() => handleSizeSelect(v.size)}
                  aria-pressed={isActive}
                  className={`relative border py-3 text-[15px] transition-colors ${
                    !available
                      ? "cursor-not-allowed border-line text-muted/50"
                      : isActive
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink"
                  }`}
                >
                  {!available ? "🚫" : v.size}
                </button>
              );
            })}
          </div>

          {error && <p className="mt-3 text-sm text-sale">Please select a size first.</p>}
          {selectedVariant && selectedStock <= 3 && selectedStock > 0 && (
            <p className="mt-3 text-sm font-medium text-sale">
              Only {selectedStock} left in EU {selectedVariant.size}
              {selectedColour ? ` · ${selectedColour}` : ""}
            </p>
          )}
          {selectedVariant && selectedStock > 3 && (
            <p className="mt-3 text-sm text-ink flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink" />
              In stock &mdash; ready to ship {selectedColour ? `(${selectedColour})` : ""}
            </p>
          )}
          {!size && selectedColour && (
            <p className="mt-2 text-xs text-muted">
              Showing available EU sizes for {selectedColour}
            </p>
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

      {/* Reviews Section */}
      <section id="reviews" className="border-t border-line/60 bg-paper py-12 lg:py-16">
        <div className="container-x">
          <ReviewSection productId={product.id} />
        </div>
      </section>
    </div>
  );
}
