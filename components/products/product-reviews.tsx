"use client"
import * as React from "react"
import { StarRating } from "@/components/ui/star-rating"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { Loader2, Star } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  
  // Form State
  const [customerName, setCustomerName] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [reviewBody, setReviewBody] = React.useState("");
  const [hoveredRating, setHoveredRating] = React.useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !reviewBody.trim() || rating < 1) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName,
          rating,
          reviewBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      toast("Review submitted successfully! It will appear after approval.", "success");
      setCustomerName("");
      setReviewBody("");
      setRating(5);
      setIsFormOpen(false);
    } catch (err: any) {
      toast(err.message || "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const renderForm = () => (
    <div className="mt-8 bg-cream-soft rounded-2xl p-6 border border-taupe/20">
      <h3 className="font-serif text-xl text-espresso mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Your Name</label>
          <Input 
            required 
            placeholder="Jane Doe" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1 focus:outline-none"
              >
                <Star
                  size={24}
                  className={cn(
                    "transition-colors",
                    star <= (hoveredRating || rating) ? "fill-gold text-gold" : "text-taupe/30"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">Your Review</label>
          <textarea 
            required
            rows={4}
            placeholder="Tell us what you loved about this product..."
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            className="flex w-full rounded-md border border-taupe bg-white px-3 py-2 text-sm placeholder:text-taupe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={submitting} className="bg-espresso text-cream hover:bg-espresso/90">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Review
          </Button>
        </div>
      </form>
    </div>
  );

  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-12 border-t border-taupe/20 mt-16">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-espresso mb-3">Rating & Reviews</h2>
          <p className="text-espresso-soft mb-6">No reviews yet — be the first to share your experience.</p>
          {!isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)} className="bg-espresso text-cream hover:bg-espresso/90 rounded-full px-8">
              Write a Review
            </Button>
          )}
        </div>
        {isFormOpen && renderForm()}
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
          
          {!isFormOpen && (
            <Button 
              onClick={() => setIsFormOpen(true)} 
              variant="outline"
              className="mt-6 w-full max-w-[200px] border-espresso text-espresso hover:bg-espresso hover:text-cream transition-colors rounded-full"
            >
              Write a Review
            </Button>
          )}
        </div>

        {/* Reviews List */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">
          {isFormOpen && renderForm()}

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
