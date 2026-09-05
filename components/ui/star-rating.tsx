import * as React from "react"
import { Star, StarHalf } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
  size?: number;
}

export function StarRating({ rating, maxRating = 5, className, size = 16 }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5 text-gold", className)}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} size={size} fill="currentColor" strokeWidth={1.5} />
      ))}
      {hasHalfStar && (
        <div className="relative" style={{ width: size, height: size }}>
          <StarHalf size={size} fill="currentColor" strokeWidth={1.5} className="absolute left-0 top-0" />
          <Star size={size} className="absolute left-0 top-0 text-taupe/30" strokeWidth={1.5} />
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-taupe/40" strokeWidth={1.5} />
      ))}
    </div>
  )
}
