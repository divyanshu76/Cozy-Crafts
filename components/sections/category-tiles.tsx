"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"

const categories = [
  { name: "Gift Bundles", slug: "gift-bundles", image: "/assets/categories-gift-bundle.png", isLarge: true },
  { name: "Keychains", slug: "keychains", image: "/assets/Categories-keychains.png" },
  { name: "Bouquets", slug: "flower-bouquets", image: "/assets/Categories-bouquets.png" },
  { name: "Charms", slug: "charms", image: "/assets/Categories-charms.png" },
  { name: "Personalized", slug: "personalized-gifts", image: "/assets/Categories-%20Personalized%20Gifts.png" },
]

export function CategoryTiles() {
  return (
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
        >
          {categories.map((category, index) => {
            const isLarge = category.isLarge;
            return (
              <motion.div
                key={category.slug}
                variants={fadeUp}
                className={`relative group overflow-hidden rounded-xl ${isLarge ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "col-span-1 aspect-square"}`}
              >
                <Link href={`/collections/${category.slug}`} className="absolute inset-0 block">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-400 ease-out group-hover:scale-[1.04]"
                    sizes={isLarge ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                  />
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
