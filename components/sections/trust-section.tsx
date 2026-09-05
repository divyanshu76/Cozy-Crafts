"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { Scissors, Package, PenTool, Truck } from "lucide-react"
import { fadeUp, staggerContainer } from "@/lib/motion"

const trustPoints = [
  {
    title: "Handmade with Care",
    description: "Shaped by hand, in small batches.",
    icon: Scissors,
  },
  {
    title: "Thoughtfully Packed",
    description: "Every order leaves ready to gift, no extra wrapping needed.",
    icon: Package,
  },
  {
    title: "Made to Personalize",
    description: "Add a name, a note, a small detail that's just theirs.",
    icon: PenTool,
  },
  {
    title: "Delivered Across India",
    description: "Safe, tracked delivery, PIN-code checked before you order.",
    icon: Truck,
  },
]

export function TrustSection() {
  return (
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <motion.div key={point.title} variants={fadeUp} className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft">
                  <Icon size={28} className="text-sage" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 font-serif text-xl font-medium text-espresso">{point.title}</h3>
                <p className="text-espresso-soft">{point.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
