"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { protestRevolution } from "@/lib/fonts"
import { cn } from "@/lib/utils"

// Categories rely on database `image_url`. 
// If the database field is not yet migrated or populated, we use local intentional assets as a fallback.
const CATEGORY_IMAGES: Record<string, string> = {
  "gift-bundles": "/assets/categories-gift-bundle.png",
  "keychains": "/assets/Categories-keychains.png",
  "flower-bouquets": "/assets/Categories-bouquets.png",
  "charms": "/assets/Categories-charms.png",
  "personalized-gifts": "/assets/Categories-%20Personalized%20Gifts.png",
  "hair-accessories": "/assets/Lifestyle Section1.png", // Explicitly setting intended asset for Hair Accessories
}

export function CategoryTiles({ categories }: { categories: any[] }) {
  // If no categories passed, show empty or fallback
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-xs uppercase tracking-widest text-[var(--color-sage-deep)] font-semibold mb-2">
            Shop by Category
          </p>
          <h2 className={cn("text-3xl md:text-4xl text-espresso", protestRevolution.className)}>
            Find Something Made With Love
          </h2>
        </div>
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
        >
          {categories.slice(0, 5).map((category, index) => {
            const isLarge = index === 0; // Make the first one large
            
            // Prioritize the database image_url if it exists and is valid.
            // Fallback to local asset mapping if DB is unmigrated or empty.
            // Final fallback is a safe CSS-only placeholder.
            const image = (category.image_url && category.image_url.trim() !== "") 
              ? category.image_url 
              : CATEGORY_IMAGES[category.slug] || null;

            return (
              <motion.div
                key={category.slug}
                variants={fadeUp}
                className={`relative group overflow-hidden rounded-xl bg-sage/10 ${isLarge ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "col-span-1 aspect-square"}`}
              >
                <Link href={`/shop/${category.slug}`} className="absolute inset-0 block h-full w-full">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${category.name} - Cozy Craft`}
                      fill
                      className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.04]"
                      sizes={isLarge ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-transform duration-400 ease-out group-hover:scale-[1.04]">
                      <div className="w-16 h-16 md:w-24 md:h-24 opacity-20 mb-4 bg-sage rounded-full mix-blend-multiply" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/20 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full">
                    <h3 className={`font-serif text-white ${isLarge ? "text-2xl md:text-3xl" : "text-lg md:text-xl"} font-medium inline-block relative`}>
                      {category.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 ease-out group-hover:w-full" />
                    </h3>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
