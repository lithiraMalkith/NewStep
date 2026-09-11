import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopBrowser from "@/components/ShopBrowser";
import { byCategory, categories } from "@/lib/products";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/lib/types";
import type { StorefrontCategory } from "@/components/ShopBrowser";

// Static copy for the original hardcoded categories — used as fallback
const STATIC_COPY: Record<string, { heading: string; intro: string; title: string; description: string }> = {
  mens: {
    heading: "Men's Shoes",
    intro: "Runners, lifestyle sneakers and formal leather — EU 39 to 46.",
    title: "Men's Shoes Online Sri Lanka",
    description: "Men's running, lifestyle and formal footwear with cash on delivery island-wide.",
  },
  womens: {
    heading: "Women's Shoes",
    intro: "Court sneakers, everyday casuals and slides — EU 36 to 41.",
    title: "Women's Shoes Online Sri Lanka",
    description: "Women's sneakers, casuals and slides with live size stock and cash on delivery.",
  },
  kids: {
    heading: "Kids' Shoes",
    intro: "School-ready and play-proof, sized EU 28 to 33.",
    title: "Kids' Shoes Online Sri Lanka",
    description: "Kids' school and play footwear delivered island-wide, pay cash on delivery.",
  },
  sale: {
    heading: "Sale",
    intro: "Final sizes and last-season colourways at reduced prices.",
    title: "Shoe Sale Sri Lanka",
    description: "Discounted footwear while stock lasts. Final sizes, no restock, cash on delivery.",
  },
};

interface CategoryData {
  heading: string;
  intro: string;
  title: string;
  description: string;
  products: Product[];
  categories: StorefrontCategory[];
}

/**
 * Fetch category metadata + products. Checks Firestore first, then falls back
 * to the static COPY dictionary. Returns null if the category doesn't exist
 * in either source.
 */
async function getCategoryData(slug: string): Promise<CategoryData | null> {
  // 1. Check if it's a known static category first
  const staticCopy = STATIC_COPY[slug];

  try {
    // 2. Look up the category in Firestore
    const catSnap = await adminDb
      .collection('categories')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    // 3. Fetch all categories for the sidebar/tabs
    const allCatsSnap = await adminDb
      .collection('categories')
      .orderBy('order', 'asc')
      .limit(20)
      .get();

    const allCategories: StorefrontCategory[] = allCatsSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name as string,
      slug: doc.data().slug as string,
    }));

    // 4. Fetch products from Firestore
    const productSnap = await adminDb
      .collection('products')
      .where('visibility', '==', 'published')
      .limit(200)
      .get();

    const dbProducts: Product[] = productSnap.docs
      .map((doc) => {
        const data = doc.data();
        const { createdAt, updatedAt, ...rest } = data;
        return {
          id: doc.id,
          ...rest,
          categories: data.categories || (data.category ? [data.category] : []),
          categoryLabels: data.categoryLabels || (data.categoryLabel ? [data.categoryLabel] : []),
          variants: data.variants || [],
          createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : typeof createdAt === 'string' ? createdAt : undefined,
          updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : typeof updatedAt === 'string' ? updatedAt : undefined,
        } as unknown as Product;
      })
      .filter((p) => {
        if (p.category === slug) return true;
        if (Array.isArray((p as any).categories) && (p as any).categories.includes(slug)) return true;
        return false;
      });

    // Merge with static products for this category (avoid duplicate slugs)
    const staticProducts = byCategory(slug);
    const existingSlugs = new Set(dbProducts.map((p) => p.slug));
    const merged = [...dbProducts];
    for (const p of staticProducts) {
      if (!existingSlugs.has(p.slug)) merged.push(p);
    }

    if (!catSnap.empty) {
      // Category exists in Firestore (admin-created or seeded)
      const catDoc = catSnap.docs[0];
      const catData = catDoc.data();

      // Build page copy — use Firestore fields if available, fall back to static copy
      const heading = catData.heading || staticCopy?.heading || `${catData.name} Shoes`;
      const intro = catData.intro || staticCopy?.intro || catData.blurb || `Browse our ${catData.name} collection.`;
      const title = catData.metaTitle || staticCopy?.title || `${catData.name} Shoes Online Sri Lanka — New Step`;
      const description = catData.metaDescription || staticCopy?.description || `Shop ${catData.name} footwear with cash on delivery island-wide.`;

      return { heading, intro, title, description, products: merged, categories: allCategories };
    }

    // 5. Not in Firestore — fall back to static copy with merged products
    if (staticCopy) {
      return {
        heading: staticCopy.heading,
        intro: staticCopy.intro,
        title: staticCopy.title,
        description: staticCopy.description,
        products: merged,
        categories: allCategories.length > 0 ? allCategories : [],
      };
    }

    // 6. Doesn't exist anywhere
    return null;
  } catch (error) {
    console.error(`Failed to fetch category "${slug}" from Firestore:`, error);
    // On Firestore error, fall back to static copy if available
    if (staticCopy) {
      return {
        heading: staticCopy.heading,
        intro: staticCopy.intro,
        title: staticCopy.title,
        description: staticCopy.description,
        products: byCategory(slug),
        categories: [],
      };
    }
    return null;
  }
}

// Revalidate every 2 minutes so new admin categories appear quickly
export const revalidate = 120;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const data = await getCategoryData(category);
  if (!data) return {};
  return { title: data.title, description: data.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = await getCategoryData(category);
  if (!data) notFound();

  return (
    <ShopBrowser
      products={data.products}
      heading={data.heading}
      intro={data.intro}
      categories={data.categories}
      showCategoryTabs={false}
    />
  );
}
