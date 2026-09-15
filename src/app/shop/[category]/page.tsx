import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopBrowser from "@/components/ShopBrowser";
import { byCategory, categories, products as staticProducts } from "@/lib/products";
import { adminDb } from "@/lib/firebase-admin";
import { buildCategoryTree, DEFAULT_CATEGORY_TREE, getSubCategoriesForRootSlug } from "@/lib/category-tree";
import { getCached, setCached } from "@/lib/server-cache";
import type { Product } from "@/lib/types";
import type { StorefrontCategory } from "@/components/ShopBrowser";
import type { CategoryNode, CategoryTreeNode } from "@/types";

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
  subCategories: CategoryTreeNode[];
}

/**
 * Fetch category metadata + products + sub-categories.
 * Cached in-memory and deduplicated per-request via React cache().
 */
const getCategoryData = cache(async (slug: string): Promise<CategoryData | null> => {
  const cacheKey = `shop_cat_${slug}`;
  const cached = getCached<CategoryData>(cacheKey);
  if (cached) return cached;

  // 1. Check if it's a known static category first
  const staticCopy = STATIC_COPY[slug];

  try {
    // 2. Look up the category in Firestore
    const catSnap = await adminDb
      .collection('categories')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    // 3. Fetch all categories to build hierarchical tree
    const allCatsSnap = await adminDb
      .collection('categories')
      .orderBy('order', 'asc')
      .limit(200)
      .get();

    const allCategoryNodes: CategoryNode[] = allCatsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name as string,
        slug: d.slug as string,
        description: (d.description as string) || '',
        image: (d.image as string) || '',
        blurb: (d.blurb as string) || '',
        parentId: (d.parentId as string | null) ?? null,
        depth: (d.depth as number) ?? 0,
        order: (d.order as number) ?? 0,
        isActive: d.isActive !== false,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
      };
    });

    const activeNodes = allCategoryNodes.filter((n) => n.isActive);
    const tree = buildCategoryTree(activeNodes);

    // Get sub-categories for this category slug
    let subCategories = getSubCategoriesForRootSlug(tree, slug);
    if (subCategories.length === 0) {
      subCategories = getSubCategoriesForRootSlug(DEFAULT_CATEGORY_TREE, slug);
    }

    const allCategories: StorefrontCategory[] = (
      activeNodes.filter((n) => n.depth === 0 || n.parentId === null)
    ).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
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

      const heading = catData.heading || staticCopy?.heading || `${catData.name} Shoes`;
      const intro = catData.intro || staticCopy?.intro || catData.blurb || `Browse our ${catData.name} collection.`;
      const title = catData.metaTitle || staticCopy?.title || `${catData.name} Shoes Online Sri Lanka — New Step`;
      const description = catData.metaDescription || staticCopy?.description || `Shop ${catData.name} footwear with cash on delivery island-wide.`;

      const result: CategoryData = {
        heading,
        intro,
        title,
        description,
        products: merged,
        categories: allCategories.length > 0 ? allCategories : [],
        subCategories,
      };
      setCached(cacheKey, result, 120);
      return result;
    }

    // 5. Not in Firestore — fall back to static copy with merged products
    if (staticCopy) {
      const result: CategoryData = {
        heading: staticCopy.heading,
        intro: staticCopy.intro,
        title: staticCopy.title,
        description: staticCopy.description,
        products: merged,
        categories: allCategories.length > 0 ? allCategories : [],
        subCategories,
      };
      setCached(cacheKey, result, 120);
      return result;
    }

    // 6. Doesn't exist anywhere
    return null;
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string } | undefined;
    const isQuotaExceeded =
      err?.code === 8 ||
      err?.message?.includes('RESOURCE_EXHAUSTED') ||
      err?.message?.includes('Quota exceeded');

    if (isQuotaExceeded) {
      console.warn(`[Storefront] Firestore quota exceeded while fetching category "${slug}". Serving from fallback catalog.`);
    } else {
      console.error(`Failed to fetch category "${slug}" from Firestore:`, err?.message || error);
    }

    // Resilient fallback for ANY category so the storefront never crashes
    const fallbackNode = DEFAULT_CATEGORY_TREE.find((n) => n.slug === slug || n.id === slug);
    const fallbackName = fallbackNode?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const fallbackHeading = staticCopy?.heading || `${fallbackName} Shoes`;
    const fallbackIntro = staticCopy?.intro || fallbackNode?.blurb || `Explore our ${fallbackName} collection.`;
    const fallbackTitle = staticCopy?.title || `${fallbackName} Shoes Online Sri Lanka — New Step`;
    const fallbackDesc = staticCopy?.description || `Shop ${fallbackName} footwear online with cash on delivery island-wide.`;

    const fallbackProducts = byCategory(slug);
    const finalProducts = fallbackProducts.length > 0 ? fallbackProducts : staticProducts.slice(0, 16);

    const fallbackData: CategoryData = {
      heading: fallbackHeading,
      intro: fallbackIntro,
      title: fallbackTitle,
      description: fallbackDesc,
      products: finalProducts,
      categories: DEFAULT_CATEGORY_TREE.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      subCategories: getSubCategoriesForRootSlug(DEFAULT_CATEGORY_TREE, slug),
    };

    setCached(cacheKey, fallbackData, 60);
    return fallbackData;
  }
})

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
    <Suspense fallback={<div className="min-h-screen bg-sand" />}>
      <ShopBrowser
        products={data.products}
        heading={data.heading}
        intro={data.intro}
        categories={data.categories}
        subCategories={data.subCategories}
        showCategoryTabs={false}
      />
    </Suspense>
  );
}

