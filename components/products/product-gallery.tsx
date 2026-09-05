"use client"
import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-3 overflow-x-auto hide-scrollbar md:w-20 lg:w-24 shrink-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "relative aspect-square w-20 md:w-full rounded-md overflow-hidden border-2 transition-colors shrink-0",
              activeIndex === idx ? "border-sage" : "border-transparent hover:border-taupe/30"
            )}
          >
            <Image src={img} alt={`${productName} thumbnail ${idx + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative aspect-[4/5] md:aspect-square w-full rounded-xl overflow-hidden bg-cream-soft">
        <Image 
          src={images[activeIndex]} 
          alt={`${productName} view ${activeIndex + 1}`} 
          fill 
          className="object-cover transition-opacity duration-300"
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </div>
    </div>
  )
}
