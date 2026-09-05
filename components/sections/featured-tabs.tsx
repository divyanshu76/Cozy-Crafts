"use client";

import * as React from "react";
import { useState } from "react";
import { ProductCard } from "@/components/products/product-card";
import { products } from "@/data/products";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface FeaturedTabsProps {
  featuredProducts?: Product[];
  newArrivals?: Product[];
}

export function FeaturedTabs({
  featuredProducts,
  newArrivals,
}: FeaturedTabsProps) {
  const [tab, setTab] = useState<"featured" | "new">("featured");

  const featuredList =
    featuredProducts && featuredProducts.length > 0
      ? featuredProducts
      : products.filter((p) => p.isFeatured);

  const newList =
    newArrivals && newArrivals.length > 0
      ? newArrivals
      : products.filter((p) => p.isNew);

  const visible = (tab === "featured" ? featuredList : newList).slice(0, 8);

  return (
    <section className="py-16 md:py-24 bg-cream overflow-hidden border-t border-taupe/20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto flex w-fit gap-1 rounded-full bg-[var(--color-cream-soft)] p-1">
          <button
            onClick={() => setTab("featured")}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === "featured"
                ? "bg-white text-[var(--color-espresso)] shadow-sm"
                : "text-[var(--color-espresso-soft)] hover:text-[var(--color-espresso)]"
            )}
          >
            Featured
          </button>
          <button
            onClick={() => setTab("new")}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === "new"
                ? "bg-white text-[var(--color-espresso)] shadow-sm"
                : "text-[var(--color-espresso-soft)] hover:text-[var(--color-espresso)]"
            )}
          >
            New Arrivals
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {visible.length > 0 ? (
            visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-sm text-[var(--color-espresso-soft)]">
              More {tab === "featured" ? "featured picks" : "new arrivals"} coming soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export const FeaturedNewArrivalsTabs = FeaturedTabs;
