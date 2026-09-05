"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { ProductCard } from "@/components/products/product-card"
import { products } from "@/data/products" // Mock data source

export function WishlistGrid({ itemIds }: { itemIds: string[] }) {
  const wishlistProducts = itemIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => p !== undefined);

  if (wishlistProducts.length === 0) {
    return (
      <div className="py-20 text-center">
        <h3 className="font-serif text-2xl text-espresso mb-2">Your wishlist is empty</h3>
        <p className="text-espresso-soft">Save items you love here by clicking the heart icon.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
      {wishlistProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
