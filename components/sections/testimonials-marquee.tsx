"use client";

import { BadgeCheck, Star } from "lucide-react";
import { Marquee } from "@/components/ui/marquee-01-utils/marquee";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { protestRevolution } from "@/lib/fonts";

type Review = {
  name: string;
  location: string;
  rating: number;
  verified: boolean;
  body: string;
};

const reviews: Review[] = [
  { name: "Ananya Sharma", location: "Lucknow", rating: 5, verified: true, body: "The keychain I ordered as a birthday gift looked even better in person. You could tell it was made by hand — the tiny imperfections made it feel special." },
  { name: "Rohit Verma", location: "Varanasi", rating: 5, verified: true, body: "Ordered a mini bouquet for my sister's Rakhi gift. The packaging alone made it feel premium, and it arrived well within the estimated time." },
  { name: "Priya Nair", location: "Bengaluru", rating: 4, verified: true, body: "Loved the hair clips — soft colors, sturdy clasps, and they added a small handwritten note, which was a nice touch." },
  { name: "Karan Mehta", location: "Jaipur", rating: 5, verified: true, body: "Got a personalized charm with my mom's initial on it. The perfect small gift, and it didn't feel overpriced for something this thoughtful." },
  { name: "Simran Kaur", location: "Amritsar", rating: 5, verified: true, body: "This was my second order. Quality has been consistent both times, and COD made it an easy decision to try them the first time." },
  { name: "Aditya Rao", location: "Hyderabad", rating: 4, verified: true, body: "The flower bouquet was even cuter than the photos. Wish there were a couple more color options, but overall very happy with it." },
];

const firstRow = reviews.slice(0, Math.ceil(reviews.length / 2));
const secondRow = reviews.slice(Math.ceil(reviews.length / 2));

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blush)] text-xs font-semibold text-[var(--color-espresso)]">
      {initials}
    </div>
  );
}

function ReviewCard({ name, location, rating, verified, body }: Review) {
  return (
    <div className="h-full w-72 shrink-0 rounded-xl border border-[var(--color-taupe)]/30 bg-[var(--color-cream)] p-4 shadow-none">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <InitialsAvatar name={name} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-[var(--color-espresso)]">{name}</p>
              {verified && (
                <BadgeCheck
                  className="h-3.5 w-3.5 text-[var(--color-sage-deep)]"
                  aria-label="Verified Purchase"
                />
              )}
            </div>
            <p className="text-xs text-[var(--color-espresso-soft)]">{location}</p>
          </div>
        </div>

        <div className="flex gap-0.5 text-[var(--color-gold)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5" fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} />
          ))}
        </div>

        <p className="line-clamp-3 text-sm text-[var(--color-espresso-soft)]">{body}</p>
      </div>
    </div>
  );
}

export function TestimonialsMarquee() {
  return (
    <section className="py-16 md:py-24 bg-cream-soft overflow-hidden">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <div className="container mx-auto px-4 md:px-6 mb-10 text-center">
          <h2 className={cn("text-3xl md:text-4xl text-espresso mb-4", protestRevolution.className)}>Loved by you</h2>
          <p className="text-espresso-soft max-w-xl mx-auto">Don't just take our word for it. Here's what our community thinks about their Cozy Craft pieces.</p>
        </div>
        <div className="relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden py-4">
          <Marquee pauseOnHover className="[--duration:28s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.name} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:28s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.name} {...review} />
        ))}
      </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[var(--color-cream-soft)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[var(--color-cream-soft)]" />
        </div>
      </motion.div>
    </section>
  );
}
