"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { Button } from "@/components/ui/button"
import { Eagle_Lake, Protest_Riot } from "next/font/google"

const eagleLake = Eagle_Lake({ weight: "400", subsets: ["latin"] });
const protestRiot = Protest_Riot({ weight: "400", subsets: ["latin"] });

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream pt-12 pb-16 md:pt-20 md:pb-24 lg:pt-28 lg:pb-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <motion.div 
            className="md:col-span-6 lg:col-span-5 flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1"
            variants={staggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-widest text-[var(--color-sage-deep)] font-medium mb-4">
              Handmade · Small Batch · Made in India
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-5xl leading-tight text-[var(--color-espresso)] sm:text-6xl lg:text-[4rem] mb-6">
              <span className={eagleLake.className}>Little Things,</span>
              <br />
              <span className={protestRiot.className}>Made With Love.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-espresso-soft text-lg mb-8 max-w-md">
              Handcrafted gifts, tiny treasures and thoughtful details — made to bring a little more joy to everyday moments.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-6">
              <Button asChild size="lg">
                <Link href="/shop">Shop Handmade</Link>
              </Button>
              <Link href="/collections/gift-bundles" className="group flex items-center gap-2 text-espresso font-medium hover:text-sage transition-colors">
                Explore Gifts
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Image Composition */}
          <div className="md:col-span-6 lg:col-span-7 flex justify-center order-1 md:order-2 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="relative aspect-[4/5] w-full max-w-xl"
            >
              {/* Base large image */}
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-cream-soft">
                <Image
                  src="/products/placeholder.svg"
                  alt="Handmade Cozy Craft flower bouquet and keychain, styled on a cream background"
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              {/* Smaller overlapping image — anchored to the SAME relative parent, positioned inside its bounds */}
              <div className="absolute -bottom-8 -left-8 h-40 w-40 overflow-hidden rounded-xl border-4 border-cream bg-cream-soft shadow-lg sm:h-48 sm:w-48">
                <Image
                  src="/products/placeholder.svg"
                  alt="Close-up of a handmade Cozy Craft charm"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
