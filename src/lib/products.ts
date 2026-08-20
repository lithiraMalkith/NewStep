import type { Product } from "./types";

const sizes = (spec: Record<number, number>) =>
  Object.entries(spec).map(([size, stockQty]) => ({
    size: Number(size),
    sku: `NS-${size}`,
    stockQty,
  }));

const RUN = { 39: 4, 40: 6, 41: 5, 42: 0, 43: 3, 44: 2, 45: 0 };
const RUN_B = { 38: 3, 39: 5, 40: 2, 41: 0, 42: 7, 43: 4, 44: 1 };
const RUN_W = { 36: 5, 37: 6, 38: 4, 39: 2, 40: 0, 41: 3 };
const RUN_K = { 28: 6, 29: 4, 30: 5, 31: 0, 32: 3, 33: 2 };

export const products: Product[] = [
  {
    id: "p-001",
    slug: "velocity-runner-white",
    name: "New Step Velocity Runner",
    brand: "New Step",
    category: "mens",
    categoryLabel: "Men's Running",
    subtitle: "Men's Running Shoe",
    colour: "White / Black",
    colourway: ["#ffffff", "#0a0a0a"],
    price: 12900,
    images: ["/images/p1.jpg", "/images/banner.jpg"],
    description:
      "A lightweight daily trainer built for Sri Lankan roads and long city days. Breathable engineered mesh keeps the foot cool in humid conditions, while the compression-moulded midsole returns energy step after step.",
    details: [
      "Engineered mesh upper for breathability",
      "Compression-moulded EVA midsole",
      "Durable rubber outsole with flex grooves",
      "Padded collar and tongue",
    ],
    variants: sizes(RUN),
    isNew: true,
    rating: 4.7,
    reviewCount: 128,
  },
  {
    id: "p-002",
    slug: "shadow-chunky-black",
    name: "New Step Shadow Chunky",
    brand: "New Step",
    category: "mens",
    categoryLabel: "Men's Lifestyle",
    subtitle: "Men's Lifestyle Shoe",
    colour: "Triple Black",
    colourway: ["#0a0a0a"],
    price: 14500,
    compareAtPrice: 17900,
    images: ["/images/p2.jpg", "/images/banner.jpg"],
    description:
      "Statement volume, zero noise. The Shadow Chunky pairs a stacked sculpted sole with an all-black upper that goes with everything in the wardrobe — and hides the dust of a Colombo commute.",
    details: [
      "Layered leather and mesh upper",
      "Stacked 4cm sculpted midsole",
      "Reinforced heel pull tab",
      "Anti-slip rubber outsole",
    ],
    variants: sizes(RUN_B),
    rating: 4.5,
    reviewCount: 76,
  },
  {
    id: "p-003",
    slug: "heritage-oxford-tan",
    name: "New Step Heritage Oxford",
    brand: "New Step",
    category: "mens",
    categoryLabel: "Men's Formal",
    subtitle: "Men's Formal Shoe",
    colour: "Cognac Tan",
    colourway: ["#8a4a25"],
    price: 16900,
    images: ["/images/p3.jpg"],
    description:
      "Full-grain leather, cap-toe construction and a stacked heel. Office-ready in the morning, wedding-ready by evening — finished by hand and built to be resoled rather than replaced.",
    details: [
      "Full-grain leather upper",
      "Cap-toe Oxford construction",
      "Leather-lined footbed",
      "Stacked heel with rubber top piece",
    ],
    variants: sizes(RUN),
    rating: 4.8,
    reviewCount: 54,
  },
  {
    id: "p-004",
    slug: "court-clean-womens",
    name: "New Step Court Clean",
    brand: "New Step",
    category: "womens",
    categoryLabel: "Women's Lifestyle",
    subtitle: "Women's Sneaker",
    colour: "White / Tan",
    colourway: ["#ffffff", "#c98c5c"],
    price: 11900,
    images: ["/images/p4.jpg"],
    description:
      "A clean court silhouette with a slightly raised sole for everyday comfort. Soft leather uppers break in fast and stay looking sharp with a quick wipe.",
    details: [
      "Soft leather upper with tan heel counter",
      "Cushioned ortholite-style footbed",
      "Raised cupsole for subtle lift",
      "Tonal stitching detail",
    ],
    variants: sizes(RUN_W),
    isNew: true,
    rating: 4.6,
    reviewCount: 93,
  },
  {
    id: "p-005",
    slug: "everyday-slide-black",
    name: "New Step Everyday Slide",
    brand: "New Step",
    category: "womens",
    categoryLabel: "Slides & Sandals",
    subtitle: "Unisex Slide",
    colour: "Black",
    colourway: ["#0a0a0a"],
    price: 3900,
    compareAtPrice: 5500,
    images: ["/images/p5.jpg"],
    description:
      "One-piece moulded EVA that shrugs off monsoon rain. Feather-light, quick-drying and contoured for all-day wear around the house or down to the shop.",
    details: [
      "One-piece moulded EVA",
      "Contoured footbed",
      "Water-friendly, quick drying",
      "Under 200g per slide",
    ],
    variants: sizes(RUN_B),
    rating: 4.3,
    reviewCount: 211,
  },
  {
    id: "p-006",
    slug: "junior-step-blue",
    name: "New Step Junior Step",
    brand: "New Step",
    category: "kids",
    categoryLabel: "Kids' Shoes",
    subtitle: "Kids' Sneaker",
    colour: "White / Blue",
    colourway: ["#ffffff", "#1a63c4"],
    price: 6900,
    images: ["/images/p6.jpg"],
    description:
      "Easy hook-and-loop strap so little ones can do it themselves, with a flexible sole that follows growing feet. School-day tough, weekend-friendly.",
    details: [
      "Hook-and-loop strap for easy on/off",
      "Flexible non-marking outsole",
      "Padded ankle collar",
      "Wipe-clean synthetic upper",
    ],
    variants: sizes(RUN_K),
    rating: 4.9,
    reviewCount: 41,
  },
  {
    id: "p-007",
    slug: "velocity-runner-mono",
    name: "New Step Velocity Runner Mono",
    brand: "New Step",
    category: "sale",
    categoryLabel: "Sale",
    subtitle: "Men's Running Shoe",
    colour: "Black / White",
    colourway: ["#0a0a0a", "#ffffff"],
    price: 9900,
    compareAtPrice: 12900,
    images: ["/images/p2.jpg"],
    description:
      "Last season's colourway of our best-selling daily trainer, at a reduced price while stock lasts. Same midsole, same fit, sharper deal.",
    details: [
      "Engineered mesh upper",
      "Compression-moulded EVA midsole",
      "Final sizes — no restock",
    ],
    variants: sizes({ 40: 2, 41: 1, 42: 3, 43: 0, 44: 1 }),
    rating: 4.4,
    reviewCount: 62,
  },
  {
    id: "p-008",
    slug: "court-clean-noir",
    name: "New Step Court Clean Noir",
    brand: "New Step",
    category: "womens",
    categoryLabel: "Women's Lifestyle",
    subtitle: "Women's Sneaker",
    colour: "Black",
    colourway: ["#0a0a0a"],
    price: 11900,
    images: ["/images/p2.jpg"],
    description:
      "The Court Clean in an all-black finish. A quiet sneaker that works with office wear and weekend denim alike.",
    details: [
      "Soft leather upper",
      "Cushioned footbed",
      "Raised cupsole",
    ],
    variants: sizes(RUN_W),
    rating: 4.5,
    reviewCount: 37,
  },
];

export const categories = [
  { slug: "mens", name: "Men's", image: "/images/p1.jpg", blurb: "Runners, lifestyle and formal" },
  { slug: "womens", name: "Women's", image: "/images/p4.jpg", blurb: "Court, casual and slides" },
  { slug: "kids", name: "Kids'", image: "/images/p6.jpg", blurb: "School-ready and play-proof" },
  { slug: "sale", name: "Sale", image: "/images/p5.jpg", blurb: "Final sizes, reduced prices" },
] as const;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const byCategory = (slug: string) =>
  slug === "all" ? products : products.filter((p) => p.category === slug);

export const totalStock = (p: Product) =>
  p.variants.reduce((sum, v) => sum + v.stockQty, 0);

export const relatedTo = (p: Product) =>
  products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
