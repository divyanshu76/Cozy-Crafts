"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { ProductCard } from "@/components/products/product-card"

interface RelatedProductsProps {
  products: Product[];
  title?: string;
}

export function RelatedProducts({ products, title = "You May Also Love" }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="py-12 mt-8 border-t border-taupe/20">
      <h2 className="font-serif text-2xl md:text-3xl text-espresso mb-8 text-center">{title}</h2>
      
      <div className="flex overflow-x-auto hide-scrollbar md:grid md:grid-cols-4 gap-4 md:gap-6 pb-4">
        {products.map((product) => (
          <div key={product.id} className="min-w-[240px] md:min-w-0 w-3/4 md:w-auto shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
