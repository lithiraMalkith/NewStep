import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ProductCarousel from "@/components/ProductCarousel";
import PromoBanner from "@/components/PromoBanner";
import Reveal from "@/components/Reveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/lib/types";
import { products as staticProducts } from "@/lib/products";

interface StorefrontCategory { id: string; name: string; slug: string; image?: string; blurb?: string }

// Fallback category tiles when Firestore is empty
const STATIC_CATEGORIES: StorefrontCategory[] = [
  { id: 'mens', name: "Men's Collection", slug: 'mens', image: '/images/banner.jpg', blurb: 'Grip, cushioning and a sole that survives Colombo pavements.' },
  { id: 'womens', name: "Women's", slug: 'womens', image: '/images/p4.jpg', blurb: 'Court, casual and slides' },
  { id: 'kids', name: "Kids'", slug: 'kids', image: '/images/p6.jpg', blurb: 'School-ready and play-proof' },
]

const TRUST = [
  { title: "Cash on Delivery", body: "Pay only when the box is in your hands." },
  { title: "Island-wide Delivery", body: "2–4 working days to every district." },
  { title: "Live Size Stock", body: "If a size shows, we actually have it." },
  { title: "7-Day Exchange", body: "Wrong size? Swap it, no drama." },
];

const REVIEWS = [
  {
    name: "Dilshan P.",
    text: "Ordered size 43 at 11pm, courier handed it over two days later. Sizes shown on the site were accurate.",
    where: "Gampaha",
  },
  {
    name: "Nethmi S.",
    text: "Finally I can see the price with delivery before ordering. No more waiting for a Messenger reply.",
    where: "Colombo 06",
  },
  {
    name: "Ahamed R.",
    text: "Quality is genuinely good for the price. Exchanged for a bigger size without any argument.",
    where: "Kandy",
  },
];

async function getHomeData(): Promise<{ products: Product[]; categories: StorefrontCategory[] }> {
  try {
    const [productSnap, catSnap] = await Promise.all([
      adminDb.collection('products').where('visibility', '==', 'published').limit(50).get(),
      adminDb.collection('categories').orderBy('order', 'asc').limit(20).get(),
    ])

    const dbProducts = productSnap.docs.map(doc => {
      const data = doc.data()
      const { createdAt, updatedAt, ...rest } = data;
      return { 
        id: doc.id, 
        ...rest,
        createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : typeof createdAt === 'string' ? createdAt : undefined,
        updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : typeof updatedAt === 'string' ? updatedAt : undefined,
      } as unknown as Product
    })

    const categories: StorefrontCategory[] = catSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug,
      image: doc.data().image,
      blurb: doc.data().blurb,
    }))

    const products = dbProducts.length === 0 ? staticProducts : (() => {
      const existingSlugs = new Set(dbProducts.map((p) => p.slug));
      const merged = [...dbProducts];
      for (const p of staticProducts) { if (!existingSlugs.has(p.slug)) merged.push(p); }
      return merged;
    })()

    return { products, categories: categories.length > 0 ? categories : STATIC_CATEGORIES }
  } catch (error) {
    console.error("Failed to fetch home data, using static fallback:", error)
    return { products: staticProducts, categories: STATIC_CATEGORIES }
  }
}

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const { products, categories } = await getHomeData();
  
  // Group products for different sections
  const newArrivals = products.filter((p) => p.isNew).slice(0, 8);
  const bestSellers = products.filter((p) => p.isBestseller || p.rating! >= 4.5).slice(0, 8);
  const onSale = products.filter((p) => p.compareAtPrice).slice(0, 8);
  
  // Set end of month for countdown
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return (
    <>
      <Hero />

      <Marquee
        items={[
          "Free delivery over Rs. 15,000",
          "Cash on delivery island-wide",
          "EU 36 – 46",
          "7-day size exchange",
          "New drops every week",
        ]}
      />

      {/* Trust strip */}
      <section className="container-x py-16 md:py-24">
        <Reveal stagger className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex flex-col items-start border-l-2 border-ink/10 pl-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{t.title}</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* New arrivals Carousel */}
      {newArrivals.length > 0 && (
        <section className="container-x mt-8 mb-24">
          <Reveal>
            <ProductCarousel 
              products={newArrivals} 
              title="New Arrivals" 
              viewAllLink="/shop"
            />
          </Reveal>
        </section>
      )}

      {/* Stats Counter Section */}
      <section className="bg-ink text-paper py-20 mt-12 mb-24">
        <div className="container-x">
          <Reveal stagger className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold mb-2">
                <AnimatedCounter value={50} suffix="k+" />
              </div>
              <span className="text-white/70 text-sm tracking-widest uppercase">Happy Customers</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold mb-2">
                <AnimatedCounter value={98} suffix="%" />
              </div>
              <span className="text-white/70 text-sm tracking-widest uppercase">Positive Reviews</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold mb-2">
                <AnimatedCounter value={24} suffix="h" />
              </div>
              <span className="text-white/70 text-sm tracking-widest uppercase">Fast Dispatch</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-6xl font-bold mb-2">
                <AnimatedCounter value={100} suffix="%" />
              </div>
              <span className="text-white/70 text-sm tracking-widest uppercase">Quality Guarantee</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bestsellers Carousel */}
      {bestSellers.length > 0 && (
        <section className="container-x mb-24">
          <Reveal>
            <ProductCarousel 
              products={bestSellers} 
              title="Best Sellers" 
              viewAllLink="/shop"
            />
          </Reveal>
        </section>
      )}

      {/* Redesigned Shop by Category Section */}
      <section className="container-x mt-20 mb-24">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-muted">Explore collections</p>
              <h2 className="display mt-2 text-[clamp(1.75rem,5vw,3rem)] tracking-tight">Shop by category</h2>
            </div>
          </div>
        </Reveal>

        <Reveal stagger className="mt-8 grid grid-cols-1 md:grid-cols-12 grid-rows-[auto] gap-4 md:gap-6 min-h-[600px]">
          {categories.length >= 1 && (
            <Link
              href={`/shop/${categories[0]!.slug}`}
              className="group relative block overflow-hidden bg-ink md:col-span-8 md:row-span-2 rounded-2xl min-h-[300px] md:min-h-full"
            >
              <Image
                src={categories[0]!.image || '/images/banner.jpg'}
                alt={`Shop ${categories[0]!.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
              <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 text-paper flex flex-col justify-end">
                <span className="eyebrow text-white/70 mb-2">Explore</span>
                <h3 className="display text-3xl md:text-5xl mb-2">{categories[0]!.name}</h3>
                {categories[0]!.blurb && (
                  <p className="text-white/80 text-[15px] max-w-sm mb-8 hidden md:block">{categories[0]!.blurb}</p>
                )}
                <span className="btn bg-paper text-ink group-hover:bg-mist-2 self-start transition-colors">
                  Shop {categories[0]!.name} &rarr;
                </span>
              </div>
            </Link>
          )}

          {categories.slice(1, 3).map((cat) => (
            <Link
              key={cat.id}
              href={`/shop/${cat.slug}`}
              className="group relative block overflow-hidden bg-mist md:col-span-4 rounded-2xl min-h-[250px] md:min-h-[288px]"
            >
              <Image
                src={cat.image || '/images/p4.jpg'}
                alt={`Shop ${cat.name}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-paper flex flex-col justify-end">
                <h3 className="display text-2xl md:text-3xl mb-1">{cat.name}</h3>
                {cat.blurb && <p className="text-white/80 text-sm mb-6">{cat.blurb}</p>}
                <span className="btn btn-outline text-paper border-white/30 group-hover:border-white group-hover:bg-white group-hover:text-ink self-start transition-all px-5 py-2.5 text-sm">
                  Shop {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Promotional Banner */}
      <section className="mb-24 px-4 md:px-0">
        <Reveal className="max-w-[1400px] mx-auto">
          <PromoBanner 
            image="/images/p5.jpg"
            badge="Flash Sale"
            title="End of Season Clearance"
            description="Up to 50% off selected lines. Final sizes remaining, grab your favorite styles before they are gone forever."
            ctaText="Shop Sale Items"
            ctaLink="/shop/sale"
            align="right"
            countdownTo={endOfMonth.toISOString()}
          />
        </Reveal>
      </section>

      {/* Social proof */}
      <section className="container-x mt-20 mb-24">
        <Reveal>
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
            <p className="eyebrow text-muted mb-2">Verified Reviews</p>
            <h2 className="display text-[clamp(1.75rem,5vw,3rem)]">Loved by Sri Lanka</h2>
            <p className="text-muted mt-4 text-[15px]">Don't just take our word for it. Here is what our customers have to say about the New Step experience.</p>
          </div>
        </Reveal>
        <Reveal stagger className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <blockquote key={r.name} className="relative bg-mist-2 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="text-sm text-[#F59E0B] tracking-widest mb-4">★★★★★</div>
              <p className="text-[15px] leading-relaxed text-ink/80">&ldquo;{r.text}&rdquo;</p>
              <footer className="mt-6 flex items-center justify-between border-t border-line/50 pt-4">
                <span className="font-semibold text-[15px]">{r.name}</span>
                <span className="text-xs text-muted font-medium bg-line/20 px-2.5 py-1 rounded-full">{r.where}</span>
              </footer>
            </blockquote>
          ))}
        </Reveal>
      </section>
    </>
  );
}
