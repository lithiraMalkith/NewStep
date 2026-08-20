"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];
const PRICE_BANDS = [
  { id: "u5", label: "Under Rs. 5,000", test: (p: number) => p < 5000 },
  { id: "5-10", label: "Rs. 5,000 – 10,000", test: (p: number) => p >= 5000 && p < 10000 },
  { id: "10-15", label: "Rs. 10,000 – 15,000", test: (p: number) => p >= 10000 && p < 15000 },
  { id: "o15", label: "Over Rs. 15,000", test: (p: number) => p >= 15000 },
];
const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
];

function ShopBrowserInner({
  products,
  heading,
  intro,
}: {
  products: Product[];
  heading: string;
  intro?: string;
}) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [sizes, setSizes] = useState<number[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const results = useMemo(() => {
    let out = products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const queryOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.colour.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.details.some((d) => d.toLowerCase().includes(q));

      const sizeOk =
        sizes.length === 0 ||
        p.variants.some((v) => sizes.includes(v.size) && v.stockQty > 0);
      const bandOk =
        bands.length === 0 ||
        PRICE_BANDS.filter((b) => bands.includes(b.id)).some((b) => b.test(p.price));
      const stockOk =
        !inStockOnly || p.variants.some((v) => v.stockQty > 0);

      return queryOk && sizeOk && bandOk && stockOk;
    });

    if (sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "new")
      out = [...out].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return out;
  }, [products, searchQuery, sizes, bands, inStockOnly, sort]);

  const activeCount =
    sizes.length + bands.length + (inStockOnly ? 1 : 0) + (searchQuery.trim() ? 1 : 0);


  const Filters = (
    <div className="space-y-8">
      <fieldset>
        <legend className="eyebrow">Size (EU)</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle(sizes, s, setSizes)}
              aria-pressed={sizes.includes(s)}
              className={`border py-2 text-sm transition-colors ${
                sizes.includes(s)
                  ? "border-ink bg-ink text-paper"
                  : "border-line hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Price</legend>
        <div className="mt-3 space-y-2">
          {PRICE_BANDS.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                checked={bands.includes(b.id)}
                onChange={() => toggle(bands, b.id, setBands)}
                className="h-4 w-4 accent-[#0a0a0a]"
              />
              {b.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Availability</legend>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => setInStockOnly((v) => !v)}
            className="h-4 w-4 accent-[#0a0a0a]"
          />
          In stock only
        </label>
      </fieldset>

      {activeCount > 0 && (
        <button
          onClick={() => {
            setSizes([]);
            setBands([]);
            setInStockOnly(false);
          }}
          className="text-sm underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.75rem,6vw,3.25rem)]">{heading}</h1>
          {intro && <p className="mt-2 max-w-xl text-[15px] text-muted">{intro}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted">{results.length} products</p>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 border border-line px-3 py-1 text-xs text-ink">
                Matching: &ldquo;{searchQuery}&rdquo;
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-full p-0.5 hover:bg-ink hover:text-paper"
                  aria-label="Clear search query"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* In-page search input */}
          <div className="relative flex-1 sm:w-64">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this collection..."
              className="w-full rounded-full border border-line bg-mist/40 pl-9 pr-8 py-2 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(true)}
            className="btn btn-outline px-4 py-2 text-xs lg:hidden shrink-0"
          >
            Filters{activeCount ? ` (${activeCount})` : ""}
          </button>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-line px-4 py-2 text-xs bg-paper text-ink shrink-0"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{Filters}</aside>

        <div>
          {results.length === 0 ? (
            <div className="py-20 text-center text-muted">
              <p className="text-base font-medium text-ink">No shoes match those criteria.</p>
              <p className="mt-1 text-sm text-muted">Try clearing a filter or searching for another shoe.</p>
              {activeCount > 0 && (
                <button
                  onClick={() => {
                    setSizes([]);
                    setBands([]);
                    setInStockOnly(false);
                    setSearchQuery("");
                  }}
                  className="btn btn-outline mt-5 inline-block text-xs"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div
        className={`fixed inset-0 z-[65] lg:hidden ${filtersOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!filtersOpen}
      >
        <div
          onClick={() => setFiltersOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity ${
            filtersOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-paper p-6 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            filtersOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="display text-lg">Filters</h2>
            <button aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="text-2xl leading-none">
              &times;
            </button>
          </div>
          {Filters}
          <button onClick={() => setFiltersOpen(false)} className="btn btn-solid mt-8 w-full">
            Show {results.length} results
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopBrowser(props: {
  products: Product[];
  heading: string;
  intro?: string;
}) {
  return (
    <Suspense fallback={<div className="container-x py-16 text-center text-muted">Loading shoes...</div>}>
      <ShopBrowserInner {...props} />
    </Suspense>
  );
}
