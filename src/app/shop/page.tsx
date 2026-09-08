import type { Metadata } from "next";
import ShopBrowser from "@/components/ShopBrowser";
import { adminDb } from "@/lib/firebase-admin";
import { products as staticProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import type { StorefrontCategory } from "@/components/ShopBrowser";

export const metadata: Metadata = {
  title: "All Shoes — Buy Footwear Online in Sri Lanka",
  description:
    "Browse the full New Step catalogue: men's, women's and kids' footwear with live size availability, island-wide delivery and cash on delivery.",
};

export const revalidate = 120;

async function getShopData(): Promise<{ products: Product[]; categories: StorefrontCategory[] }> {
  try {
    const [productSnap, catSnap] = await Promise.all([
      adminDb.collection('products').where('visibility', '==', 'published').limit(200).get(),
      adminDb.collection('categories').orderBy('order', 'asc').limit(20).get(),
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

    const categories: StorefrontCategory[] = catSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name as string,
      slug: doc.data().slug as string,
    }));

    // Merge DB + static without duplicate slugs
    const existingSlugs = new Set(dbProducts.map((p) => p.slug));
    const merged = [...dbProducts];
    for (const p of staticProducts) {
      if (!existingSlugs.has(p.slug)) merged.push(p);
    }

    return { products: merged, categories };
  } catch {
    return { products: staticProducts, categories: [] };
  }
}

export default async function ShopPage() {
  const { products, categories } = await getShopData();
  return (
    <ShopBrowser
      products={products}
      heading="All Shoes"
      intro="Every pair we stock, with real size-level availability. Filter by size so you only see what actually fits."
      categories={categories}
    />
  );
}
