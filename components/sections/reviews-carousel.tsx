"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { StarRating } from "@/components/ui/star-rating"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

const reviews = [
  {
    id: 1,
    name: "Aarti",
    rating: 5,
    text: "So cute! It's much softer than I expected and the colors are lovely. Looks great on my backpack.",
    product: "Pastel Daisy Keychain",
    verified: true
  },
  {
    id: 2,
    name: "Sneha",
    rating: 5,
    text: "Beautifully packed! It felt like receiving a gift from a friend. The charms are exquisite.",
    product: "Initial Heart Charm",
    verified: true
  },
  {
    id: 3,
    name: "Priya",
    rating: 4,
    text: "Bought this as a tiny gift for my friend's desk. She loved it! The personalization note was a sweet touch.",
    product: "Mini Tulip Bouquet",
    verified: true
  },
  {
    id: 4,
    name: "Meera",
    rating: 5,
    text: "The quality is amazing for the price. I've bought three of these hair clips already.",
    product: "Cloud Hair Clip",
    verified: true
  }
]

export function ReviewsCarousel() {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  return (
    <section className="py-16 md:py-24 bg-cream-soft overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-espresso mb-4">Loved by you</h2>
          <p className="text-espresso-soft max-w-lg">Don't just take our word for it. Here's what our community thinks about their Cozy Craft pieces.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button onClick={() => scroll("left")} className="p-2 rounded-full border border-taupe text-espresso hover:bg-cream transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll("right")} className="p-2 rounded-full border border-taupe text-espresso hover:bg-cream transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 md:gap-6 px-4 md:px-6 pb-8"
        ref={scrollRef}
      >
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            variants={fadeUp}
            className="snap-center shrink-0 w-[280px] md:w-[350px] bg-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col"
          >
            <StarRating rating={review.rating} className="mb-4" size={18} />
            <p className="text-espresso italic mb-6 flex-1 text-base leading-relaxed">
              "{review.text}"
            </p>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-espresso">{review.name}</span>
                {review.verified && <CheckCircle2 size={14} className="text-sage" />}
              </div>
              <p className="text-sm text-taupe">{review.product}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
