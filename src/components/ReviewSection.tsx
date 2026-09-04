"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import StarRating from "./StarRating";
import toast from "react-hot-toast";
import { ShieldCheck, PackageCheck } from "lucide-react";

interface ReviewData {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

interface EligibilityData {
  canReview: boolean;
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  isAuthenticated: boolean;
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Eligibility state
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const checkEligibility = useCallback(async () => {
    if (!user) {
      setEligibility(null);
      return;
    }

    setCheckingEligibility(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/reviews/eligibility?productId=${encodeURIComponent(productId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.success && json.data) {
          setEligibility(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to check review eligibility:", err);
    } finally {
      setCheckingEligibility(false);
    }
  }, [user, productId]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const loadReviews = useCallback(async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`),
        fetch(`/api/reviews/stats?productId=${encodeURIComponent(productId)}`),
      ]);

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json().catch(() => null);
        if (reviewsData?.success) setReviews(reviewsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json().catch(() => null);
        if (statsData?.success) setStats(statsData.data);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to write a review");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, rating, title: title.trim(), comment: comment.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted! It will appear after admin approval.");
        setShowForm(false);
        setRating(0);
        setTitle("");
        setComment("");
        checkEligibility();
        loadReviews();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Check if current logged-in user already submitted a review
  const hasUserReviewed = Boolean(user && reviews.some((r) => r.customerId === user.uid));

  const filteredReviews = ratingFilter
    ? reviews.filter((r) => r.rating === ratingFilter)
    : reviews;

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 4);
  const maxCount = stats
    ? Math.max(...Object.values(stats.ratingDistribution), 1)
    : 1;

  if (loading) {
    return (
      <div className="mt-12 border-t border-line pt-10">
        <div className="h-6 w-48 bg-mist animate-pulse rounded" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-mist animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-line pt-10">
      <div className="flex flex-col gap-8 md:flex-row md:gap-16">
        {/* Rating Summary */}
        <div className="md:w-64 shrink-0">
          <h2 className="display text-[clamp(1.25rem,4vw,1.75rem)]">
            Reviews
          </h2>

          {stats && stats.totalReviews > 0 ? (
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted">
                  / 5 ({stats.totalReviews}{" "}
                  {stats.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>

              <div className="mt-2">
                <StarRating rating={stats.averageRating} size="md" />
              </div>

              {/* Rating distribution bars */}
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.ratingDistribution[star] || 0;
                  const pct = (count / maxCount) * 100;
                  const isSelected = ratingFilter === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingFilter(isSelected ? null : star)}
                      className={`w-full flex items-center gap-2 text-sm p-1 rounded hover:bg-mist/40 transition-colors text-left ${
                        isSelected ? "bg-mist font-medium" : ""
                      }`}
                      title={`Filter by ${star} star reviews`}
                    >
                      <span className="w-3 text-muted">{star}</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3.5 h-3.5 text-[#F59E0B]"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="flex-1 h-2 bg-mist rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F59E0B] rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-muted">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No reviews yet.</p>
          )}

          {/* Write a Review / Verified Buyer Notices */}
          {!user ? (
            <div className="mt-6 rounded-xl border border-[#E5DDD0] bg-[#FAF8F5] p-5 text-center">
              <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F4EE] border border-[#E5DDD0] text-ink">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <p className="text-[13px] font-semibold text-ink">Verified Buyer Reviews</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Only verified customers who purchased this footwear can leave a review.
              </p>
              <Link
                href={`/account/login?redirect=/product/${encodeURIComponent(productId)}`}
                className="mt-3.5 inline-flex items-center justify-center rounded-lg border border-[#E5DDD0] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-medium text-ink shadow-xs transition-colors hover:bg-[#F7F4EE] hover:border-ink/30"
              >
                Sign in to check purchase status
              </Link>
            </div>
          ) : checkingEligibility && !eligibility ? (
            <div className="mt-6 rounded-xl border border-[#E5DDD0] bg-[#FAF8F5] p-4 text-center text-xs text-muted">
              Checking purchase status...
            </div>
          ) : eligibility?.alreadyReviewed || hasUserReviewed ? (
            <div className="mt-6 rounded-xl border border-[#E5DDD0] bg-[#FAF8F5] p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-ink" />
                <span>Verified Review Submitted</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">You have already reviewed this product. Thank you!</p>
            </div>
          ) : !eligibility?.hasPurchased ? (
            <div className="mt-6 rounded-xl border border-[#E5DDD0] bg-[#FAF8F5] p-5 text-center">
              <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F4EE] border border-[#E5DDD0] text-muted">
                <PackageCheck className="h-4.5 w-4.5" />
              </div>
              <p className="text-[13px] font-semibold text-ink">Verified Purchases Only</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Reviews are reserved for customers who have ordered this item. If you ordered under a different email, please sign into that account.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-ink" />
                <span>Verified Purchaser · Eligible to Review</span>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn btn-solid w-full text-sm"
              >
                {showForm ? "Close Form" : "Write a Review"}
              </button>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="flex-1 min-w-0">
          {/* Review Submission Form */}
          {showForm && user && (eligibility?.canReview ?? false) && (
            <form
              onSubmit={handleSubmit}
              className="mb-8 rounded-xl border border-[#E5DDD0] bg-[#FAF8F5] p-6 shadow-xs"
            >
              <h3 className="text-[15px] font-semibold">Write your review</h3>

              <div className="mt-4">
                <label className="text-sm font-medium">
                  Your Rating <span className="text-sale">*</span>
                </label>
                <div className="mt-2">
                  <StarRating
                    rating={rating}
                    size="lg"
                    interactive
                    onChange={setRating}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum it up in a few words"
                  maxLength={100}
                  className="mt-1.5 w-full border border-line px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-ink"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">
                  Your Review <span className="text-sale">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  className="mt-1.5 w-full border border-line px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-ink resize-none"
                />
                <p className="mt-1 text-xs text-muted">
                  {comment.length}/1000 characters
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="btn btn-solid text-sm"
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {ratingFilter !== null && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-mist/60 px-3 py-2 text-xs">
              <span>Showing <strong>{ratingFilter} Star</strong> reviews ({filteredReviews.length})</span>
              <button
                onClick={() => setRatingFilter(null)}
                className="underline hover:text-sale font-medium"
              >
                Clear filter
              </button>
            </div>
          )}

          {filteredReviews.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-muted text-sm">
                {ratingFilter !== null
                  ? `No ${ratingFilter}-star reviews found.`
                  : "No reviews yet. Be the first to review this product!"}
              </p>
              {ratingFilter !== null && (
                <button
                  onClick={() => setRatingFilter(null)}
                  className="mt-2 text-xs underline text-ink font-medium"
                >
                  View all reviews
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-line">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="py-5 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <StarRating rating={review.rating} size="sm" />
                        {review.title && (
                          <h4 className="mt-1.5 text-[15px] font-semibold">
                            {review.title}
                          </h4>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F5] border border-[#E5DDD0] px-2.5 py-0.5 text-[10px] font-medium text-ink">
                            <ShieldCheck className="w-3 h-3 text-ink" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-[15px] leading-relaxed text-ink/80">
                      {review.comment}
                    </p>

                    <p className="mt-2 text-xs text-muted">
                      {review.customerName} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString("en-LK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>

              {reviews.length > 4 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-muted transition-colors"
                >
                  Show all {reviews.length} reviews
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
