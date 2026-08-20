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

      {/* Category tiles */}
      <section className="container-x mt-20">
        <Reveal>
          <h2 className="display text-[clamp(1.75rem,5vw,3rem)]">Shop by category</h2>
        </Reveal>
        <Reveal stagger className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden bg-mist"
            >
              <Image
                src={c.image}
                alt={`${c.name} footwear`}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
                <h3 className="display text-2xl">{c.name}</h3>
                <p className="mt-1 text-sm text-white/75">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Editorial banner */}
      <section className="relative mt-20 isolate overflow-hidden bg-ink text-paper">
        <Image
          src="/images/banner.jpg"
          alt="Night street walk in black sneakers"
          width={1600}
          height={900}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="container-x relative flex min-h-[60svh] flex-col justify-center py-16">
          <Reveal>
            <p className="eyebrow text-white/70">Built for the commute</p>
            <h2 className="display mt-3 max-w-2xl text-[clamp(2rem,7vw,4.5rem)]">
              From the bus stand to the last mile
            </h2>
            <p className="mt-4 max-w-md text-[15px] text-white/75">
              Grip, cushioning and a sole that survives Colombo pavements.
            </p>
            <Link href="/shop/mens" className="btn bg-paper text-ink hover:bg-mist-2 mt-8 self-start">
              Shop men&apos;s
            </Link>
          </Reveal>
        </div>
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
