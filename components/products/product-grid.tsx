import * as React from "react"
import { Product } from "@/types/product"
import { ProductCard } from "./product-card"

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <h3 className="font-serif text-2xl text-espresso mb-2">No products found</h3>
        <p className="text-espresso-soft">Try checking back later or exploring another category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
