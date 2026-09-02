"use client";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const SIZES = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export default function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const sizeClass = SIZES[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.floor(rating);
        const isHalf =
          !isFilled && starValue === Math.ceil(rating) && rating % 1 >= 0.3;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            className={`relative ${sizeClass} ${
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform"
                : "cursor-default"
            }`}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            {/* Empty star */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="absolute inset-0 w-full h-full text-line"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Filled star */}
            {(isFilled || isHalf) && (
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`absolute inset-0 w-full h-full text-[#F59E0B] ${
                  isHalf ? "clip-path-half" : ""
                }`}
                style={isHalf ? { clipPath: "inset(0 50% 0 0)" } : undefined}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        );
      })}

      {showValue && (
        <span className="ml-1 text-sm text-muted font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
