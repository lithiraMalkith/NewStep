"use client";

import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-config";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 12;

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

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
}

function ShopBrowserInner({
  products,
  heading,
  intro,
  categories,
  showCategoryTabs = true,
}: {
  products: Product[];
  heading: string;
  intro?: string;
  categories?: StorefrontCategory[];
  showCategoryTabs?: boolean;
}) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [sizes, setSizes] = useState<number[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Build dynamic category filter tabs
  const categoryTabs = categories && categories.length > 0
    ? [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.slug, label: c.name }))]
    : [
        { id: "all", label: "All" },
        { id: "mens", label: "Men's" },
        { id: "womens", label: "Women's" },
        { id: "kids", label: "Kids'" },
        { id: "sale", label: "Sale" },
      ];

  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    setSearchQuery(urlQuery || "");
  }, [urlQuery]);

  useEffect(() => {
    const handleShopSearch = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSearchQuery(custom.detail ?? "");
    };
    window.addEventListener("shop:search", handleShopSearch);
    return () => window.removeEventListener("shop:search", handleShopSearch);
  }, []);

  // Reset page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sizes, bands, inStockOnly, sort, categoryFilter]);

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const results = useMemo(() => {
    let out = products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const queryOk =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.colour?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.details?.some((d) => d?.toLowerCase().includes(q));

      const catOk = categoryFilter === "all" || p.category === categoryFilter;

      const sizeOk =
        sizes.length === 0 ||
        (p.variants || []).some((v) => {
          const sizeMatch = sizes.includes(v.size);
          if (!sizeMatch) return false;
          // Support colour variants
          if (v.colours && v.colours.length > 0) {
            return v.colours.some((c) => c.stockQty > 0);
          }
          return (v.stockQty ?? 0) > 0;
        });

      const bandOk =
        bands.length === 0 ||
        PRICE_BANDS.filter((b) => bands.includes(b.id)).some((b) => b.test(p.price));

      const stockOk =
        !inStockOnly || (p.variants || []).some((v) => {
          if (v.colours && v.colours.length > 0) {
            return v.colours.some((c) => c.stockQty > 0);
          }
          return (v.stockQty ?? 0) > 0;
        });

      return queryOk && catOk && sizeOk && bandOk && stockOk;
    });

    if (sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "new") out = [...out].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    if (sort === "featured") out = [...out].sort((a, b) => {
      const af = a.isFeatured ? (a.featuredOrder ?? 99) : 999;
      const bf = b.isFeatured ? (b.featuredOrder ?? 99) : 999;
      return af - bf;
    });
    return out;
  }, [products, searchQuery, sizes, bands, inStockOnly, sort, categoryFilter]);

  // Paginated slice
  const visibleResults = results.slice(0, page * PAGE_SIZE);
  const hasMore = visibleResults.length < results.length;

  // GSAP fade-in for newly loaded cards
  useGSAP(() => {
    const newCards = document.querySelectorAll(`[data-page="${page}"]`);
    if (newCards.length > 0 && page > 1) {
      gsap.fromTo(newCards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.35, ease: 'power2.out', clearProps: 'opacity,y' });
    }
  }, { scope: containerRef, dependencies: [page] });

  const activeCount = sizes.length + bands.length + (inStockOnly ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

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
          onClick={() => { setSizes([]); setBands([]); setInStockOnly(false); }}
          className="text-sm underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x py-8" ref={containerRef}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.75rem,6vw,3.25rem)]">{heading}</h1>
          {intro && <p className="mt-2 max-w-xl text-[15px] text-muted">{intro}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted">
              Showing {Math.min(visibleResults.length, results.length)} of {results.length} products
            </p>
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
          <div className="relative flex-1 sm:w-64">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
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
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button onClick={() => setFiltersOpen(true)} className="btn btn-outline px-4 py-2 text-xs lg:hidden shrink-0">
            Filters{activeCount ? ` (${activeCount})` : ""}
          </button>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-line px-4 py-2 text-xs bg-paper text-ink shrink-0"
          >
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </header>

      {/* Dynamic Category Tabs — hidden on individual category pages */}
      {showCategoryTabs && (
        <div className="mt-6 flex flex-wrap gap-2">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors font-medium ${
                categoryFilter === tab.id
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{Filters}</aside>

        <div>
          {results.length === 0 ? (
            <div className="py-20 text-center text-muted">
              <p className="text-base font-medium text-ink">No shoes match those criteria.</p>
              <p className="mt-1 text-sm text-muted">Try clearing a filter or searching for another shoe.</p>
              {activeCount > 0 && (
                <button
                  onClick={() => { setSizes([]); setBands([]); setInStockOnly(false); setSearchQuery(""); setCategoryFilter("all"); }}
                  className="btn btn-outline mt-5 inline-block text-xs"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6">
                {visibleResults.map((p, i) => {
                  // Tag items from the latest page batch for GSAP targeting
                  const currentPageStart = (page - 1) * PAGE_SIZE;
                  const isNewBatch = i >= currentPageStart;
                  return (
                    <div key={p.id} data-page={isNewBatch ? page : page - 1}>
                      <ProductCard product={p} priority={i < 3} />
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-12 flex flex-col items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-outline px-8 py-3 text-sm"
                  >
                    Show more shoes →
                  </button>
                  <p className="text-xs text-muted">
                    {results.length - visibleResults.length} more to show
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div className={`fixed inset-0 z-[65] lg:hidden ${filtersOpen ? "" : "pointer-events-none"}`} aria-hidden={!filtersOpen}>
        <div onClick={() => setFiltersOpen(false)} className={`absolute inset-0 bg-ink/40 transition-opacity ${filtersOpen ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-paper p-6 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${filtersOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="display text-lg">Filters</h2>
            <button aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="text-2xl leading-none">&times;</button>
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
  categories?: StorefrontCategory[];
  showCategoryTabs?: boolean;
}) {
  return (
    <Suspense fallback={<div className="container-x py-16 text-center text-muted">Loading shoes...</div>}>
      <ShopBrowserInner {...props} />
    </Suspense>
  );
}
