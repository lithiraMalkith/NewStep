"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);

      if (clientWidth > 0) {
        const pages = Math.max(1, Math.round(scrollWidth / clientWidth));
        setTotalPages(pages);
        const currentPage = Math.min(pages - 1, Math.max(0, Math.round(scrollLeft / clientWidth)));
        setActivePageIndex(currentPage);
      }
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [products, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -clientWidth : clientWidth,
        behavior: "smooth",
      });
    }
  };

  const scrollToPage = (pageIndex: number) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: pageIndex * clientWidth,
        behavior: "smooth",
      });
    }
  };

  if (!products.length) return null;

  return (
    <div className="relative group/carousel">
      {/* Title & Navigation */}
      {(title || viewAllLink) && (
        <div className="flex items-end justify-between gap-4 mb-4 sm:mb-6">
          {title && <h2 className="display text-[clamp(1.5rem,4vw,2.25rem)] tracking-tight">{title}</h2>}
          <div className="flex items-center gap-3 sm:gap-4">
            {viewAllLink && (
              <a href={viewAllLink} className="link-underline shrink-0 text-xs sm:text-sm font-medium">
                View all
              </a>
            )}
            
            {/* Navigation Arrows (accessible on mobile & desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Previous products"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-line bg-paper text-ink transition-all hover:bg-mist disabled:opacity-25 disabled:cursor-not-allowed shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Next products"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-line bg-paper text-ink transition-all hover:bg-mist disabled:opacity-25 disabled:cursor-not-allowed shadow-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swipeable Container: 2 products visible on mobile, 3 on tablet, 4 on desktop */}
      <div className="relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 md:gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product, i) => (
            <div 
              key={product.id} 
              className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-60px)/4)] shrink-0 snap-start"
            >
              <ProductCard product={product} priority={i < 4} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots on mobile / tablet */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToPage(idx)}
              aria-label={`Go to slide page ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activePageIndex === idx
                  ? "w-6 bg-ink"
                  : "w-1.5 bg-line hover:bg-muted"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

