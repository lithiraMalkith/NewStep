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
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data && data.data.totalReviews > 0) {
          setStats(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load rating stats:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!stats || stats.totalReviews === 0) return null;

  if (showText) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-muted">
        <StarRating rating={stats.averageRating} size="sm" />
        <span>
          {stats.averageRating.toFixed(1)} · {stats.totalReviews}{" "}
          {stats.totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <StarRating rating={stats.averageRating} size="sm" />
      <span className="text-xs text-muted">({stats.totalReviews})</span>
    </div>
  );
}
