"use client"
import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { protestRevolution } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function AboutSection() {
  return (
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Text — left on desktop */}
          <motion.div
            variants={staggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col order-2 md:order-1"
          >
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-widest text-[var(--color-sage-deep)] font-medium mb-4">
              The Handmade Process
            </motion.p>
            <motion.h2 variants={fadeUp} className={cn("text-3xl md:text-4xl lg:text-[2.5rem] text-espresso mb-6", protestRevolution.className)}>
              Made by hand,<br />one piece at a time.
            </motion.h2>
            <motion.div variants={fadeUp} className="space-y-4 text-espresso-soft text-lg">
              <p>
                Behind every Cozy Craft piece is a small table, a pair of hands, and a lot of patience. We don't rush it — because the point isn't speed. It's care.
              </p>
              <p>
                From shaping wire flowers to tying resin charms, every step is done intentionally so you get something that genuinely feels special to hold.
              </p>
            </motion.div>
          </motion.div>

          {/* Image — right on desktop, first on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden group order-1 md:order-2"
          >
            <Image
              src="/assets/About-Section.png"
              alt="Hands crafting a handmade Cozy Craft piece — the making process"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
