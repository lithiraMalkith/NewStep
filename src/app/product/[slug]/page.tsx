import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { getProduct, products, relatedTo, totalStock } from "@/lib/products";
import type { Product } from "@/lib/types";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

async function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  const staticP = getProduct(slug);
  if (staticP) return staticP;

  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0]!;
      const data = doc.data();
      const { createdAt, updatedAt, ...rest } = data;
      return {
        id: doc.id,
        ...rest,
        createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : typeof createdAt === 'string' ? createdAt : undefined,
        updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : typeof updatedAt === 'string' ? updatedAt : undefined,
      } as unknown as Product;
    }
  } catch (error) {
    console.error('Error fetching product by slug from Firestore:', error);
  }
  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — ${product.colour}`,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: [product.images[0]!],
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const related = relatedTo(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: product.price,
      availability:
        totalStock(product) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  if (product.rating && product.reviewCount) {
    (jsonLd as any).aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="container-x mt-16">
          <Reveal>
            <h2 className="display text-[clamp(1.5rem,4vw,2.25rem)]">You may also like</h2>
          </Reveal>
          <Reveal stagger className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {related.map((p) => (
              <div key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
