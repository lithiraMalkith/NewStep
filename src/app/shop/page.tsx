import { Suspense } from "react";
import type { Metadata } from "next";
import ShopBrowser from "@/components/ShopBrowser";
import { adminDb } from "@/lib/firebase-admin";
import { products as staticProducts } from "@/lib/products";
import { getCached, setCached } from "@/lib/server-cache";
import type { Product } from "@/lib/types";
import type { StorefrontCategory } from "@/components/ShopBrowser";

export const metadata: Metadata = {
  title: "All Shoes — Buy Footwear Online in Sri Lanka",
  description:
    "Browse the full New Step catalogue: men's, women's and kids' footwear with live size availability, island-wide delivery and cash on delivery.",
};

export const revalidate = 120;

const CACHE_KEY = 'shop_all_data';

async function getShopData(): Promise<{ products: Product[]; categories: StorefrontCategory[] }> {
  const cached = getCached<{ products: Product[]; categories: StorefrontCategory[] }>(CACHE_KEY);
  if (cached) return cached;

  try {
    const [productSnap, catSnap] = await Promise.all([
      adminDb.collection('products').where('visibility', '==', 'published').limit(200).get(),
      adminDb.collection('categories').orderBy('order', 'asc').limit(100).get(),
    ]);

    const dbProducts = productSnap.docs.map((doc) => {
      const data = doc.data();
      const { createdAt, updatedAt, ...rest } = data;
      return { 
        id: doc.id, 
        ...rest,
        variants: data.variants || [],
        createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : typeof createdAt === 'string' ? createdAt : undefined,
        updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : typeof updatedAt === 'string' ? updatedAt : undefined,
      } as unknown as Product;
    });

    // Only include active root categories for the main category filter tabs
    const seenCatSlugs = new Set<string>();
    const categories: StorefrontCategory[] = [];
    for (const doc of catSnap.docs) {
      const data = doc.data();
      const isRoot = data.depth === 0 || !data.parentId;
      const isActive = data.isActive !== false;
      if (isRoot && isActive && data.slug && !seenCatSlugs.has(data.slug)) {
        seenCatSlugs.add(data.slug);
        categories.push({
          id: doc.id,
          name: data.name as string,
          slug: data.slug as string,
        });
      }
    }

    // Merge DB + static without duplicate slugs
    const existingSlugs = new Set(dbProducts.map((p) => p.slug));
    const merged = [...dbProducts];
    for (const p of staticProducts) {
      if (!existingSlugs.has(p.slug)) merged.push(p);
    }

    const result = { products: merged, categories };
    setCached(CACHE_KEY, result, 120);
    return result;
  } catch {
    const fallback = { products: staticProducts, categories: [] };
    setCached(CACHE_KEY, fallback, 60);
    return fallback;
  }
}

export default async function ShopPage() {
  const { products, categories } = await getShopData();
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand" />}>
      <ShopBrowser
        products={products}
        heading="All Shoes"
        intro="Every pair we stock, with real size-level availability. Filter by size so you only see what actually fits."
        categories={categories}
      />
    </Suspense>
  );
}
