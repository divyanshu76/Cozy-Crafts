"use client"
import * as React from "react"
import { StarRating } from "@/components/ui/star-rating"

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}


interface Review {
  id: string;
  customer_name: string;
  rating: number;
  body: string | null;
  image_url: string | null;
  verified: boolean;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
}

export function ProductReviews({ productId, reviews }: ProductReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-12 text-center border-t border-taupe/20 mt-16">
        <h2 className="font-serif text-2xl text-espresso mb-3">Rating & Reviews</h2>
        <p className="text-espresso-soft">No reviews yet — be the first to share your experience.</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;

  return (
    <div className="py-12 border-t border-taupe/20 mt-16">
      <h2 className="font-serif text-2xl text-espresso mb-8">Rating & Reviews</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Rating Summary */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
          <div className="text-5xl font-serif text-espresso mb-2">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} size={20} />
          <p className="text-espresso-soft mt-2">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
        </div>

        {/* Reviews List */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-taupe/10 pb-8 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-espresso flex items-center gap-2">
                    {review.customer_name}
                    {review.verified && (
                      <span className="text-[10px] uppercase tracking-wider bg-sage/10 text-sage px-2 py-0.5 rounded-full font-semibold">
                        Verified
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-taupe mt-1">
                    {timeAgo(review.created_at)}
                  </p>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              
              {review.body && (
                <p className="text-espresso-soft text-sm leading-relaxed">{review.body}</p>
              )}
              
              {review.image_url && (
                <div className="mt-4 relative w-24 h-24 rounded-md overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={review.image_url} alt="Review" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
