"use client";

import { useEffect, useState } from "react";
import StarRating from "./StarRating";

export default function ClientProductRating({
  productId,
  showText = false,
}: {
  productId: string;
  showText?: boolean;
}) {
  const [stats, setStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/reviews/stats?productId=${encodeURIComponent(productId)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          const text = await res.text();
          return text && text.trim() ? JSON.parse(text) : null;
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (isMounted && data?.success && data?.data && data.data.totalReviews > 0) {
          setStats(data.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!stats || stats.totalReviews === 0) return null;

  if (showText) {
    return (
      <a
        href="#reviews"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors cursor-pointer"
      >
        <StarRating rating={stats.averageRating} size="sm" />
        <span>
          {stats.averageRating.toFixed(1)} · {stats.totalReviews}{" "}
          {stats.totalReviews === 1 ? "review" : "reviews"}
        </span>
      </a>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <StarRating rating={stats.averageRating} size="sm" />
      <span className="text-xs text-muted">({stats.totalReviews})</span>
    </div>
  );
}
