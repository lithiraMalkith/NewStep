"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  viewAllLink?: string;
}

export default function ProductCarousel({ products, title, viewAllLink }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Use a small threshold (like 2px) to account for fractional pixel scroll values
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      // Scroll by one full visible width, minus a small peek amount
      const scrollAmount = direction === "left" ? -(clientWidth - 100) : clientWidth - 100;
      
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!products.length) return null;

  return (
    <div className="relative group/carousel">
      {/* Title & Navigation */}
      {(title || viewAllLink) && (
        <div className="flex items-end justify-between gap-4 mb-6 px-4 md:px-0">
          {title && <h2 className="display text-[clamp(1.5rem,4vw,2.25rem)]">{title}</h2>}
          <div className="flex items-center gap-4">
            {viewAllLink && (
              <a href={viewAllLink} className="link-underline shrink-0 text-sm font-medium">
                View all
              </a>
            )}
            
            {/* Desktop Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper transition-colors hover:bg-mist disabled:opacity-30 disabled:hover:bg-paper"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper transition-colors hover:bg-mist disabled:opacity-30 disabled:hover:bg-paper"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swipeable Container */}
      <div 
        className="relative -mx-4 md:mx-0 overflow-hidden"
      >
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 md:px-0 pb-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product, i) => (
            <div 
              key={product.id} 
              className="w-[280px] md:w-[320px] shrink-0 snap-start"
            >
              <ProductCard product={product} priority={i < 4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
