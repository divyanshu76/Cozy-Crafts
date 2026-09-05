"use client"
import * as React from "react"
import { useWishlistStore } from "@/hooks/useWishlistStore"
import { WishlistGrid } from "@/components/products/wishlist-grid"

export default function WishlistPage() {
  const [isMounted, setIsMounted] = React.useState(false);
  const items = useWishlistStore((state) => state.items);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 min-h-[60vh]">
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-4">Your Wishlist</h1>
        <p className="text-espresso-soft">Items you've saved for later.</p>
      </div>
      
      {isMounted ? (
        <WishlistGrid itemIds={items} />
      ) : (
        <div className="py-20 text-center opacity-50">Loading your wishlist...</div>
      )}
    </div>
  )
}
