import type { MetadataRoute } from "next";
import { products, categories } from "@/lib/products";
import { policies } from "@/lib/policies";

const BASE = "https://newstepfootwear.lk";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/shop", "/about", "/contact"].map((r) => ({
    url: `${BASE}${r}`,
    lastModified: new Date(),
    priority: r === "" ? 1 : 0.8,
  }));

  return [
    ...staticRoutes,
    ...categories.map((c) => ({ url: `${BASE}/shop/${c.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${BASE}/product/${p.slug}`, priority: 0.9 })),
    ...policies.map((p) => ({ url: `${BASE}/policies/${p.slug}`, priority: 0.3 })),
  ];
}
