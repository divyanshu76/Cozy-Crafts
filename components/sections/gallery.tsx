"use client"
import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { protestRevolution } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Camera } from "lucide-react"
import Link from "next/link"

const images = [
  { id: 1, src: "/products/placeholder.svg", alt: "Gallery Image 1", className: "col-span-1 row-span-1" },
  { id: 2, src: "/products/placeholder.svg", alt: "Gallery Image 2", className: "col-span-2 row-span-2" },
  { id: 3, src: "/products/placeholder.svg", alt: "Gallery Image 3", className: "col-span-1 row-span-1" },
  { id: 4, src: "/products/placeholder.svg", alt: "Gallery Image 4", className: "col-span-1 row-span-1" },
  { id: 5, src: "/products/placeholder.svg", alt: "Gallery Image 5", className: "col-span-1 row-span-1" },
]

export function Gallery() {
  return (
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center mb-12 text-center">
          <Camera size={28} className="text-sage mb-4" />
          <h2 className={cn("text-3xl md:text-4xl text-espresso mb-4", protestRevolution.className)}>Life with Cozy Craft</h2>
          <p className="text-espresso-soft max-w-xl mx-auto">
            Tag us <Link href="#" className="text-espresso font-medium hover:text-sage">@cozycraft.in</Link> to be featured on our page.
          </p>
        </div>

        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 auto-rows-[150px] md:auto-rows-[250px]"
        >
          {images.map((image) => (
            <motion.div
              key={image.id}
              variants={fadeUp}
              className={`relative overflow-hidden rounded-xl bg-cream-soft group ${image.className}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
              <div className="absolute inset-0 bg-espresso/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Camera className="text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
