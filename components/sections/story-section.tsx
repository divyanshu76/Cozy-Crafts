"use client"
import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { protestRevolution } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function StorySection() {
  return (
    <section className="py-16 md:py-24 bg-cream-soft">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden group"
          >
            <Image
              src="/assets/Not%20mass-made.%20Made%20with%20meaning.png"
              alt="Handmade Cozy Craft products — not mass-made, made with meaning"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </motion.div>

          <motion.div
            variants={staggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col"
          >
            <motion.h2 variants={fadeUp} className={cn("text-3xl md:text-4xl lg:text-[2.5rem] text-espresso mb-6", protestRevolution.className)}>
              Not mass-made.<br />Made with meaning.
            </motion.h2>
            <motion.div variants={fadeUp} className="space-y-4 text-espresso-soft text-lg">
              <p>
                Every Cozy Craft piece starts as raw thread, resin, or fabric on a small table — shaped, tied, and finished by hand, one at a time.
              </p>
              <p>
                We're not trying to be everywhere; we're trying to make things worth keeping. Small details that bring a smile to your face, crafted with patience and care.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
