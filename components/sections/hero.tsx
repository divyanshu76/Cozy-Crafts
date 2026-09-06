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
            {/*
              On mobile: we give the container extra bottom padding so the
              overlapping small image doesn't get clipped.
              On md+: the small image can safely sit at -bottom-8 / -left-8.
            */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="relative aspect-[4/5] w-full max-w-xl pb-16 md:pb-0"
            >
              {/* Base large image */}
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-cream-soft group">
                <Image
                  src="/assets/hero1.png"
                  alt="Handmade Cozy Craft bouquet and charms styled on a cream background"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 90vw"
                />
              </div>

              {/* Smaller overlapping image — secondary accent, NOT a mobile replacement */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="absolute bottom-0 -left-4 h-32 w-32 overflow-hidden rounded-xl border-4 border-cream bg-cream-soft shadow-xl sm:h-40 sm:w-40 md:-bottom-8 md:-left-8 md:h-48 md:w-48 group"
              >
                <Image
                  src="/assets/hero-small.png"
                  alt="Close-up of a handmade Cozy Craft keychain or charm"
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  sizes="(min-width: 768px) 192px, 128px"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
