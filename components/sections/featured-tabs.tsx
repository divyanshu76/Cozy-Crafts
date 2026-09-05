"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { ProductCarousel } from "@/components/products/product-carousel"
import { cn } from "@/lib/utils"

interface FeaturedTabsProps {
  featuredProducts: Product[];
  newArrivals: Product[];
}

export function FeaturedTabs({ featuredProducts, newArrivals }: FeaturedTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"featured" | "new">("featured")

  return (
    <section className="py-16 md:py-24 bg-cream overflow-hidden border-t border-taupe/20">
      <div className="container mx-auto">
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center rounded-full bg-cream-soft p-1">
            <button
              onClick={() => setActiveTab("featured")}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                activeTab === "featured" ? "bg-white text-espresso shadow-sm" : "text-espresso-soft hover:text-espresso"
              )}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveTab("new")}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                activeTab === "new" ? "bg-white text-espresso shadow-sm" : "text-espresso-soft hover:text-espresso"
              )}
            >
              New Arrivals
            </button>
          </div>
        </div>
        
        <div>
          {activeTab === "featured" ? (
            <ProductCarousel products={featuredProducts} />
          ) : (
            <ProductCarousel products={newArrivals} />
          )}
        </div>
      </div>
    </section>
  )
}
