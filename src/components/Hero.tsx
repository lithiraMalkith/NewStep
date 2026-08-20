"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set("[data-hero]", { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(
        "[data-hero-media]",
        { scale: 1.12, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.4 },
      )
        .fromTo(
          "[data-hero='line']",
          { yPercent: 110 },
          { yPercent: 0, duration: 1.1, stagger: 0.09 },
          "-=1.05",
        )
        .fromTo(
          "[data-hero='fade']",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 },
          "-=0.7",
        );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative isolate overflow-hidden bg-ink text-paper">
      <div data-hero-media className="absolute inset-0 opacity-0">
        <Image
          src="/images/hero.jpg"
          alt="Man walking in white New Step sneakers against a concrete wall"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
      </div>

      <div className="container-x relative flex min-h-[86svh] flex-col justify-end pb-14 pt-24 md:min-h-[88svh] md:pb-20">
        <p data-hero="fade" className="eyebrow opacity-0 text-white/70">
          New Season &middot; 2026
        </p>

        <h1 className="display mt-4 text-[clamp(3rem,13vw,9rem)]">
          {["Every", "Step", "Counts"].map((line) => (
            <span key={line} className="block overflow-hidden">
              <span data-hero="line" className="block">
                {line}
              </span>
            </span>
          ))}
        </h1>

        <p
          data-hero="fade"
          className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75 opacity-0"
        >
          Real stock. Real sizes. Order in under a minute and pay cash when it
          reaches your door — anywhere in Sri Lanka.
        </p>

        <div data-hero="fade" className="mt-8 flex flex-wrap gap-3 opacity-0">
          <Link
            href="/shop"
            className="btn bg-paper text-ink hover:bg-mist-2"
          >
            Shop all shoes
          </Link>
          <Link
            href="/shop/sale"
            className="btn border border-white/40 text-paper hover:bg-white/10"
          >
            View sale
          </Link>
        </div>
      </div>
    </section>
  );
}
