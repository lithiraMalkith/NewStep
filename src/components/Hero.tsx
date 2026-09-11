"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: "slide-1",
    image: "/images/hero.jpg",
    eyebrow: "New Season · 2026",
    headline: ["Every", "Step", "Counts"],
    body: "Real stock. Real sizes. Order in under a minute and pay cash when it reaches your door — anywhere in Sri Lanka.",
    cta1: { label: "Shop all shoes", href: "/shop" },
    cta2: { label: "View sale", href: "/shop/sale" },
    position: "object-[center_top] md:object-[70%_15%]"
  },
  {
    id: "slide-2",
    image: "/images/banner.jpg",
    eyebrow: "Urban Collection",
    headline: ["Built", "For The", "Streets"],
    body: "Grip, cushioning, and style that survives the city pavements. Discover our new men's arrivals.",
    cta1: { label: "Shop Men's", href: "/shop/mens" },
    cta2: { label: "Explore New", href: "/shop" },
    position: "object-[center_top] md:object-[center_20%]"
  },
  {
    id: "slide-3",
    image: "/images/p4.jpg",
    eyebrow: "Limited Time",
    headline: ["End Of", "Season", "Sale"],
    body: "Final sizes, reduced prices. Grab your favorite styles before they are gone forever.",
    cta1: { label: "Shop Sale", href: "/shop/sale" },
    cta2: { label: "All Women's", href: "/shop/womens" },
    position: "object-[center_top] md:object-[center_25%]"
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const root = useRef<HTMLElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const slideCount = SLIDES.length;

  const animateSlide = (index: number, prevIndex?: number) => {
    if (!root.current) return;
    
    if (ctxRef.current) ctxRef.current.revert();
    
    ctxRef.current = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      
      // If we have a previous slide, fade it out
      if (prevIndex !== undefined) {
        gsap.to(`.slide-bg-${prevIndex}`, { opacity: 0, duration: 1, zIndex: 0 });
        gsap.to(`.slide-content-${prevIndex}`, { opacity: 0, duration: 0.5, y: -20 });
      }

      // Fade in new background
      tl.fromTo(
        `.slide-bg-${index}`,
        { scale: 1.05, opacity: 0, zIndex: 1 },
        { scale: 1, opacity: 1, duration: 1.4 }
      )
      // Reveal new content
      .fromTo(
        `.slide-content-${index} .hero-line`,
        { yPercent: 110 },
        { yPercent: 0, duration: 1, stagger: 0.1 },
        "-=1.2"
      )
      .fromTo(
        `.slide-content-${index} .hero-fade`,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
        "-=0.8"
      );
    }, root);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const next = (prev + 1) % slideCount;
      animateSlide(next, prev);
      return next;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const next = prev === 0 ? slideCount - 1 : prev - 1;
      animateSlide(next, prev);
      return next;
    });
  };

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    animateSlide(index, currentSlide);
    setCurrentSlide(index);
  };

  // Initial animation
  useEffect(() => {
    animateSlide(0);
    return () => {
      if (ctxRef.current) ctxRef.current.revert();
    };
  }, []);

  // Auto-advance
  useEffect(() => {
    if (isHovering) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovering, currentSlide]); // re-bind interval on slide change

  return (
    <section 
      ref={root} 
      className="relative isolate overflow-hidden bg-ink text-paper min-h-[80svh] md:min-h-[85svh]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => {
        setTimeout(() => setIsHovering(false), 3000);
      }}
    >
      {/* Backgrounds */}
      {SLIDES.map((slide, i) => (
        <div 
          key={`bg-${slide.id}`} 
          className={cn(
            `slide-bg-${i} absolute inset-0`,
            i === 0 ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={slide.image}
            alt={slide.headline.join(" ")}
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn("object-cover", slide.position)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
        </div>
      ))}

      {/* Content */}
      <div className="container-x relative z-20 flex min-h-[80svh] flex-col justify-end pb-14 pt-24 md:min-h-[85svh] md:pb-20">
        
        {SLIDES.map((slide, i) => (
          <div 
            key={`content-${slide.id}`}
            className={cn(
              `slide-content-${i} absolute bottom-14 left-0 right-0 md:bottom-20 px-4 md:px-8 xl:px-0`,
              i === currentSlide ? "pointer-events-auto" : "pointer-events-none opacity-0"
            )}
          >
            <div className="max-w-3xl">
              <p className="hero-fade eyebrow text-white/70">
                {slide.eyebrow}
              </p>

              <h1 className="display mt-4 text-[clamp(3rem,13vw,9rem)]">
                {slide.headline.map((line) => (
                  <span key={line} className="block overflow-hidden">
                    <span className="hero-line block">
                      {line}
                    </span>
                  </span>
                ))}
              </h1>

              <p className="hero-fade mt-6 max-w-md text-[15px] leading-relaxed text-white/75">
                {slide.body}
              </p>

              <div className="hero-fade mt-8 flex flex-wrap gap-3">
                <Link
                  href={slide.cta1.href}
                  className="btn bg-paper text-ink hover:bg-mist-2"
                >
                  {slide.cta1.label}
                </Link>
                {slide.cta2 && (
                  <Link
                    href={slide.cta2.href}
                    className="btn border border-white/40 text-paper hover:bg-white/10"
                  >
                    {slide.cta2.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-between px-6 md:px-12">
        {/* Dots */}
        <div className="flex items-center gap-3">
          {SLIDES.map((_, i) => (
            <button
              key={`dot-${i}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group relative flex h-6 w-6 items-center justify-center"
            >
              <span 
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  i === currentSlide 
                    ? "w-6 bg-white" 
                    : "w-1.5 bg-white/40 group-hover:bg-white/70"
                )} 
              />
            </button>
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/30 text-white backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/30 text-white backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
