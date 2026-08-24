import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { categories, products } from "@/lib/products";

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

export default function HomePage() {
  const newArrivals = products.filter((p) => p.isNew || !p.compareAtPrice).slice(0, 4);
  const onSale = products.filter((p) => p.compareAtPrice).slice(0, 4);

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
      <section className="container-x py-12">
        <Reveal stagger className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title}>
              <h2 className="text-[15px] font-semibold">{t.title}</h2>
              <p className="mt-1 text-sm text-muted">{t.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* New arrivals */}
      <section className="container-x">
        <Reveal className="flex items-end justify-between gap-4">
          <h2 className="display text-[clamp(1.75rem,5vw,3rem)]">New Arrivals</h2>
          <Link href="/shop" className="link-underline shrink-0 text-[15px]">
            Shop all
          </Link>
        </Reveal>

        <Reveal
          stagger
          className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6"
        >
          {newArrivals.map((p, i) => (
            <div key={p.id}>
              <ProductCard product={p} priority={i < 2} />
            </div>
          ))}
        </Reveal>
      </section>

      {/* Redesigned Shop by Category Section */}
      <section className="container-x mt-20">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-muted">Explore collections</p>
              <h2 className="display mt-2 text-[clamp(1.75rem,5vw,3rem)] tracking-tight">Shop by category</h2>
            </div>
          </div>
        </Reveal>

        <Reveal stagger className="mt-8 grid grid-cols-1 md:grid-cols-12 grid-rows-[auto] gap-4 md:gap-6 min-h-[600px]">
          {/* Main Men's Banner - Takes up 8 columns */}
          <Link
            href="/shop/mens"
            className="group relative block overflow-hidden bg-ink md:col-span-8 md:row-span-2 rounded-2xl min-h-[300px] md:min-h-full"
          >
            <Image
              src="/images/banner.jpg"
              alt="Shop Men"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-paper flex flex-col justify-end">
              <span className="eyebrow text-white/70 mb-2">Built for the commute</span>
              <h3 className="display text-3xl md:text-5xl mb-2">Men's Collection</h3>
              <p className="text-white/80 text-[15px] max-w-sm mb-6 hidden md:block">
                Grip, cushioning and a sole that survives Colombo pavements. Discover our flagship running and lifestyle shoes.
              </p>
              <span className="btn bg-paper text-ink group-hover:bg-mist-2 self-start transition-colors">
                Shop Men &rarr;
              </span>
            </div>
          </Link>

          {/* Women's Tile - 4 columns */}
          <Link
            href="/shop/womens"
            className="group relative block overflow-hidden bg-mist md:col-span-4 rounded-2xl min-h-[250px] md:min-h-[288px]"
          >
            <Image
              src="/images/p4.jpg"
              alt="Shop Women"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-paper flex flex-col justify-end">
              <h3 className="display text-2xl md:text-3xl mb-1">Women's</h3>
              <p className="text-white/80 text-sm mb-4">Court, casual and slides</p>
              <span className="btn btn-outline text-paper border-white/30 group-hover:border-white group-hover:bg-white group-hover:text-ink self-start transition-all px-4 py-2 text-sm">
                Shop Women
              </span>
            </div>
          </Link>

          {/* Kids' Tile - 4 columns */}
          <Link
            href="/shop/kids"
            className="group relative block overflow-hidden bg-mist md:col-span-4 rounded-2xl min-h-[250px] md:min-h-[288px]"
          >
            <Image
              src="/images/p6.jpg"
              alt="Shop Kids"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-paper flex flex-col justify-end">
              <h3 className="display text-2xl md:text-3xl mb-1">Kids'</h3>
              <p className="text-white/80 text-sm mb-4">School-ready and play-proof</p>
              <span className="btn btn-outline text-paper border-white/30 group-hover:border-white group-hover:bg-white group-hover:text-ink self-start transition-all px-4 py-2 text-sm">
                Shop Kids
              </span>
            </div>
          </Link>

          {/* Special Offers / Sale Tile - Full width row at the bottom */}
          <Link
            href="/shop/sale"
            className="group relative block overflow-hidden bg-ink md:col-span-12 rounded-2xl min-h-[200px]"
          >
            <Image
              src="/images/p5.jpg"
              alt="Special Offers"
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />
            <div className="absolute inset-0 p-6 md:p-10 text-paper flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block bg-[#E05252] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                  Special Offers
                </span>
                <h3 className="display text-3xl md:text-4xl mb-2">Final sizes, reduced prices</h3>
                <p className="text-white/80 text-[15px] max-w-md">
                  Grab your favorite styles before they are gone. Up to 40% off on selected items.
                </p>
              </div>
              <span className="btn bg-paper text-ink group-hover:bg-mist-2 shrink-0 transition-colors">
                Shop Sale
              </span>
            </div>
          </Link>
        </Reveal>
      </section>

      {/* Sale rail */}
      {onSale.length > 0 && (
        <section className="container-x mt-20">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 className="display text-[clamp(1.75rem,5vw,3rem)]">On Sale</h2>
            <Link href="/shop/sale" className="link-underline shrink-0 text-[15px]">
              All sale
            </Link>
          </Reveal>
          <Reveal stagger className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {onSale.map((p) => (
              <div key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* Social proof */}
      <section className="container-x mt-20">
        <Reveal>
          <h2 className="display text-[clamp(1.75rem,5vw,3rem)]">What customers say</h2>
        </Reveal>
        <Reveal stagger className="mt-6 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <blockquote key={r.name} className="border border-line p-6">
              <div className="text-sm">★★★★★</div>
              <p className="mt-3 text-[15px] leading-relaxed">&ldquo;{r.text}&rdquo;</p>
              <footer className="mt-4 text-sm text-muted">
                {r.name} &middot; {r.where}
              </footer>
            </blockquote>
          ))}
        </Reveal>
      </section>
    </>
  );
}
