"use client"
import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react"

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0); // 1 for right, -1 for left

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-cream-soft border border-taupe/20 flex flex-col items-center justify-center text-taupe">
        <ImageIcon size={48} className="mb-4 opacity-50" />
        <span className="font-serif text-lg text-espresso-soft">Cozy Craft</span>
      </div>
    )
  }

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    })
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 w-full">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto hide-scrollbar md:w-20 lg:w-24 shrink-0 pb-2 md:pb-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > activeIndex ? 1 : -1);
                setActiveIndex(idx);
              }}
              className={cn(
                "relative aspect-square w-20 md:w-full rounded-xl overflow-hidden transition-all duration-300 shrink-0",
                activeIndex === idx 
                  ? "ring-2 ring-espresso ring-offset-2 opacity-100" 
                  : "opacity-60 hover:opacity-100 bg-cream-soft"
              )}
              aria-label={`View image ${idx + 1} of ${images.length}`}
            >
              <Image 
                src={img} 
                alt={`${productName} thumbnail ${idx + 1}`} 
                fill 
                className="object-cover" 
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-cream-soft group">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0"
          >
            <Image 
              src={images[activeIndex]} 
              alt={`${productName} view ${activeIndex + 1}`} 
              fill 
              className="object-cover"
              priority={activeIndex === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Mobile controls inside image */}
        {images.length > 1 && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={handlePrev}
              className="pointer-events-auto h-10 w-10 rounded-full bg-white/80 backdrop-blur text-espresso shadow-sm flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="pointer-events-auto h-10 w-10 rounded-full bg-white/80 backdrop-blur text-espresso shadow-sm flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        {/* Counter Badge for Mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-espresso shadow-sm md:hidden z-10">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}
