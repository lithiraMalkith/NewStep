"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { useCart } from "./CartProvider";
import { categories, products } from "@/lib/products";
import { LKR } from "@/lib/format";

import { useAuth } from "@/contexts/auth-context";

const NAV = [
  { href: "/shop/mens", label: "Men" },
  { href: "/shop/womens", label: "Women" },
  { href: "/shop/kids", label: "Kids" },
  { href: "/shop/sale", label: "Sale" },
  { href: "/shop", label: "All Shoes" },
];

const POPULAR_SEARCHES = [
  "Running",
  "Oxford",
  "Chunky",
  "Slide",
  "Court",
  "Black",
  "Leather",
];

export default function Header() {
  const { count, openDrawer } = useCart();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, searchOpen]);

  // Click outside to close account dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    if (accountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountOpen]);

  // Focus input when search modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  // Global keyboard shortcut '/' or 'cmd+k'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        if (accountOpen) setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, accountOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.colour.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.details.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSignOut = async () => {
    setAccountOpen(false);
    await signOut();
    router.push('/');
  };

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-ink text-paper">
        <div className="container-x flex h-9 items-center justify-center gap-3 text-[11px] tracking-wide">
          <span className="hidden sm:inline">Island-wide delivery</span>
          <span className="hidden sm:inline opacity-40">|</span>
          <span>Cash on Delivery</span>
          <span className="opacity-40">|</span>
          <span>Free delivery over Rs. 15,000</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
        <div className="container-x flex h-[64px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="-ml-2 p-2 lg:hidden text-ink hover:opacity-75"
              onClick={() => setOpen(true)}
            >
              <span className="block h-[2px] w-6 bg-ink" />
              <span className="mt-[6px] block h-[2px] w-6 bg-ink" />
              <span className="mt-[6px] block h-[2px] w-4 bg-ink" />
            </button>

            <Link href="/" className="display text-[20px] leading-none sm:text-[23px] tracking-tight">
              New<span className="text-muted">Step</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`link-underline text-[15px] transition-colors ${pathname === n.href ? "font-semibold text-ink" : "text-muted hover:text-ink"
                  }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Search Trigger, Cart, and User Profile Avatar (right-most) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Desktop Quick Search Bar Input Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-full border border-line bg-mist/60 px-3.5 py-1.5 text-sm text-muted hover:border-ink/40 hover:bg-mist transition-all w-44 lg:w-56 text-left mr-1"
              aria-label="Open search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <span className="truncate flex-1 text-xs">Search shoes...</span>
              <kbd className="hidden lg:inline-block rounded bg-paper px-1.5 py-0.5 text-[10px] font-mono border border-line text-muted">
                /
              </kbd>
            </button>

            {/* Mobile / Tablet search icon button */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search shoes"
              className="flex md:hidden rounded-full p-2 hover:bg-mist text-ink transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* 1. Shopping Cart Button (before profile avatar) */}
            <button
              onClick={openDrawer}
              aria-label={`Cart, ${count} items`}
              className="relative rounded-full p-2 hover:bg-mist text-ink transition-colors flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16l-1.2 12.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 7Z" />
                <path d="M9 7V5.6A3 3 0 0 1 12 3a3 3 0 0 1 3 2.6V7" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper animate-in zoom-in-50">
                  {count}
                </span>
              )}
            </button>

            {/* 2. Customer Profile Avatar Dropdown (Right-Most, matching cart icon size) */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                aria-label="User Account Menu"
                aria-expanded={accountOpen}
                className={`relative flex items-center justify-center rounded-full p-2 text-ink transition-colors hover:bg-mist ${accountOpen ? "bg-mist ring-1 ring-ink/20" : ""
                  }`}
              >
                {user?.photoURL ? (
                  <div className="relative h-7 w-7 overflow-hidden rounded-full border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User profile"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : user?.displayName ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mist border border-line text-[10px] font-bold text-ink uppercase">
                    {user.displayName.charAt(0)}
                  </span>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-line bg-paper p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                  {/* User info Header */}
                  <div className="border-b border-line px-3 py-2.5 mb-1">
                    {user ? (
                      <>
                        <p className="truncate text-xs font-bold text-ink">
                          {user.displayName || "My Account"}
                        </p>
                        <p className="truncate text-[11px] text-muted mt-0.5">
                          {user.email}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-ink">My Account</p>
                        <p className="text-[11px] text-muted mt-0.5">
                          Sign in to manage orders &amp; addresses
                        </p>
                      </>
                    )}
                  </div>

                  {/* Dropdown Navigation Items */}
                  <div className="space-y-0.5 text-xs">
                    <Link
                      href="/account/orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-ink hover:bg-mist transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <path d="M3 6h18" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span>Recent Orders</span>
                    </Link>

                    <Link
                      href="/account/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-ink hover:bg-mist transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/account/addresses"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-ink hover:bg-mist transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Address Book</span>
                    </Link>
                  </div>

                  {/* Sign Out / Sign In Action at bottom of dropdown list (Black/White/Ash palette) */}
                  <div className="border-t border-line mt-1.5 pt-1.5">
                    {user ? (
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-ink hover:bg-mist transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <Link
                        href="/account/login"
                        onClick={() => setAccountOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2 text-xs font-semibold text-paper hover:bg-ink/85 transition-colors"
                      >
                        Sign in / Register
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Search Modal / Overlay */}
      <div
        className={`fixed inset-0 z-[80] ${searchOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!searchOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setSearchOpen(false)}
          className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${searchOpen ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Search Dialog */}
        <div
          className={`relative mx-auto mt-4 sm:mt-12 w-full max-w-2xl px-4 transition-all duration-300 ease-out ${searchOpen ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95"
            }`}
        >
          <div className="overflow-hidden rounded-2xl bg-paper shadow-2xl border border-line">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-line px-4 sm:px-6">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-muted"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shoes by name, style, colour..."
                className="w-full bg-transparent py-4 pl-3 pr-8 text-base text-ink placeholder:text-muted outline-none sm:text-lg"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-full p-1 text-muted hover:text-ink hover:bg-mist"
                  aria-label="Clear search"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="ml-2 rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:text-ink hover:bg-mist"
              >
                ESC
              </button>
            </form>

            {/* Popular Searches when no query */}
            {!query.trim() && (
              <div className="p-5 sm:p-6">
                <p className="eyebrow text-xs text-muted mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="rounded-full border border-line bg-mist/50 px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink hover:bg-mist"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <p className="eyebrow text-xs text-muted mb-3">Browse Categories</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop/${c.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="rounded-lg border border-line p-3 hover:border-ink hover:bg-mist transition-all group"
                      >
                        <p className="font-medium text-sm text-ink group-hover:underline">{c.name}</p>
                        <p className="text-[11px] text-muted truncate">{c.blurb}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Search Results */}
            {query.trim() && (
              <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5">
                {searchResults.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-ink">No shoes found for &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted">Try searching with a different term or view all footwear in the shop.</p>
                    <Link
                      href="/shop"
                      onClick={() => setSearchOpen(false)}
                      className="btn btn-outline mt-4 inline-block px-4 py-2 text-xs"
                    >
                      Browse all shoes
                    </Link>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between pb-3 text-xs text-muted border-b border-line">
                      <span>Found {searchResults.length} {searchResults.length === 1 ? "match" : "matches"}</span>
                      <button
                        onClick={handleSearchSubmit}
                        className="font-medium text-ink hover:underline flex items-center gap-1"
                      >
                        View all in shop &rarr;
                      </button>
                    </div>

                    <div className="divide-y divide-line mt-1">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-4 py-3 hover:bg-mist/70 px-2 rounded-lg transition-colors group"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-mist">
                            <Image
                              src={product.images[0] || "/images/p1.jpg"}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink group-hover:text-muted transition-colors">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted">
                              {product.categoryLabel || product.category} &middot; {product.colour}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs font-semibold text-ink">{LKR(product.price)}</span>
                              {product.compareAtPrice && (
                                <span className="text-[11px] text-muted line-through">
                                  {LKR(product.compareAtPrice)}
                                </span>
                              )}
                              {product.isNew && (
                                <span className="rounded bg-ink px-1.5 py-0.2 text-[10px] font-medium text-paper">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>

                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted group-hover:translate-x-1 transition-transform"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <div
        className={`fixed inset-0 z-[70] lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"
            }`}
        />
        <nav
          className={`absolute left-0 top-0 flex h-full w-[86%] max-w-[340px] flex-col bg-paper p-6 shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="display text-xl font-bold">New<span className="text-muted">Step</span></span>
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="p-2 text-2xl leading-none text-ink hover:opacity-70"
            >
              &times;
            </button>
          </div>

          {/* Search bar inside mobile drawer */}
          <div className="mt-5">
            <button
              onClick={() => {
                setOpen(false);
                setSearchOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-full border border-line bg-mist/60 px-4 py-2.5 text-left text-sm text-muted"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <span>Search shoes...</span>
            </button>
          </div>

          <ul className="mt-6 space-y-1 overflow-y-auto flex-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop/${c.slug}`}
                  className="display block py-2.5 text-2xl font-medium text-ink hover:text-muted transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}

            <li className="pt-2">
              <Link
                href="/shop"
                className="display block py-2.5 text-2xl font-medium text-ink hover:text-muted transition-colors"
              >
                All Shoes
              </Link>
            </li>
          </ul>

          <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm text-muted">
            {/* Account Quick Links for Mobile */}
            <div className="pb-2">
              <p className="eyebrow text-[11px] text-muted mb-2">My Account</p>
              <div className="space-y-1.5 font-medium text-ink">
                <Link href="/account/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 py-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>Recent Orders</span>
                </Link>
                <Link href="/account/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 py-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  <span>Profile Details</span>
                </Link>
                <Link href="/account/addresses" onClick={() => setOpen(false)} className="flex items-center gap-2 py-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Address Book</span>
                </Link>
                {user ? (
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await signOut();
                      router.push('/');
                    }}
                    className="flex items-center gap-2 py-1 text-muted hover:text-ink transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link href="/account/login" onClick={() => setOpen(false)} className="flex items-center gap-2 py-1 underline font-semibold">
                    <span>Sign In / Register</span>
                  </Link>
                )}
              </div>
            </div>

            {/* <div className="border-t border-line/60 pt-2.5">
              <Link href="/about" onClick={() => setOpen(false)} className="block py-1 hover:text-ink">About Us</Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="block py-1 hover:text-ink">Contact &amp; Support</Link>
              <Link href="/policies/delivery" onClick={() => setOpen(false)} className="block py-1 hover:text-ink">Delivery Info</Link>
              <Link href="/policies/returns" onClick={() => setOpen(false)} className="block py-1 hover:text-ink">Returns &amp; Exchange</Link>
            </div> */}
          </div>
        </nav>
      </div>
    </>
  );
}

