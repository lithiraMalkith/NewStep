import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Us — New Step Footwear Store",
  description:
    "Who we are: a Sri Lankan footwear retailer selling online with cash on delivery, real stock and a real shop you can visit.",
};

const STATS = [
  { value: "8+", label: "Years selling footwear" },
  { value: "25", label: "Districts delivered to" },
  { value: "12k+", label: "Pairs shipped" },
  { value: "4.7★", label: "Average rating" },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <Image
          src="/images/banner.jpg"
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="container-x relative py-24">
          <p className="eyebrow text-white/70">About us</p>
          <h1 className="display mt-3 max-w-3xl text-[clamp(2.25rem,8vw,5rem)]">
            A shop first. A website second.
          </h1>
        </div>
      </section>

      <section className="container-x grid gap-12 py-16 lg:grid-cols-2">
        <Reveal>
          <h2 className="display text-3xl">Our story</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted">
            <p>
              New Step Footwear Store began as a single outlet serving walk-in
              customers who wanted honest footwear at a fair price. Word spread
              through Facebook posts and TikTok clips, and soon most of our orders
              were arriving as messages at midnight.
            </p>
            <p>
              We loved the demand, but replying to &ldquo;size 42 තියෙනවද?&rdquo;
              a hundred times a day was not sustainable — and it meant customers
              waited. This website exists to answer that question instantly, for
              everyone, at any hour.
            </p>
            <p>
              Every size you see on a product page reflects real stock on our
              shelves. If it shows, we have it. If it&apos;s greyed out, we&apos;d
              rather tell you now than after you&apos;ve placed the order.
            </p>
          </div>
        </Reveal>

        <Reveal className="relative aspect-[4/5] overflow-hidden bg-mist">
          <Image
            src="/images/p3.jpg"
            alt="Leather Oxford shoe from the New Step range"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </Reveal>
      </section>

      <section className="border-y border-line bg-mist">
        <Reveal stagger className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="display text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="container-x py-16">
        <Reveal>
          <h2 className="display text-3xl">What we promise</h2>
        </Reveal>
        <Reveal stagger className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Honest stock",
              d: "Variant-level inventory means the size selector is the truth, not a guess.",
            },
            {
              t: "Honest pricing",
              d: "Delivery is shown by district before you commit. No surprises at the door.",
            },
            {
              t: "Honest service",
              d: "A real phone number, a real shop, and a 7-day exchange if the fit is wrong.",
            },
          ].map((c) => (
            <div key={c.t} className="border border-line p-6">
              <h3 className="text-[15px] font-semibold">{c.t}</h3>
              <p className="mt-2 text-[15px] text-muted">{c.d}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-12">
          <Link href="/shop" className="btn btn-solid">
            Browse the catalogue
          </Link>
        </Reveal>
      </section>
    </>
  );
}
