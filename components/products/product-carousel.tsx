"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { ProductCard } from "./product-card"

interface ProductCarouselProps {
  products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 px-4 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6 md:overflow-visible md:snap-none">
      {products.map((product) => (
        <div key={product.id} className="snap-start w-[240px] flex-shrink-0 md:w-auto md:flex-shrink">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
