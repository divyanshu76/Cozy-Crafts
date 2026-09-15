"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, Image as ImageIcon } from "lucide-react"
import { Product } from "@/types/product"
import { useCartStore } from "@/hooks/useCartStore"
import { useWishlistStore } from "@/hooks/useWishlistStore"
import { useToast } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { toast } = useToast();
  const router = useRouter();

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock === 0) return;

    addItem({
      productId: product.id,
      quantity: 1,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      slug: product.slug,
    });
    toast(`Added ${product.name} to cart`, "success");
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product.id);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col gap-3 transition-all duration-300 ease-out bg-white border border-taupe/20 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] hover:border-taupe/30 rounded-2xl p-3 sm:p-3.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-cream-soft">
        {product.images && product.images.length > 0 ? (
          <>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                isHovered && product.images[1] ? "opacity-0" : "opacity-100"
              )}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
            {product.images[1] && (
              <Image
                src={product.images[1]}
                alt={`${product.name} alternate view`}
                fill
                className={cn(
                  "object-cover transition-opacity duration-500 absolute inset-0 group-hover:scale-[1.03]",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-taupe/50">
            <ImageIcon size={32} className="mb-2" />
            <span className="text-xs font-serif">Cozy Craft</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.stock === 0 && <Badge variant="outline" className="bg-white/95 shadow-sm text-[10px] sm:text-xs">Out of stock</Badge>}
          {product.stock > 0 && product.stock <= 5 && <Badge variant="secondary" className="bg-blush/95 shadow-sm text-espresso text-[10px] sm:text-xs">Only {product.stock} left</Badge>}
          {hasDiscount && <Badge className="bg-sage shadow-sm text-white text-[10px] sm:text-xs">-{discountPercent}%</Badge>}
          {product.isNew && !hasDiscount && <Badge variant="outline" className="bg-white/95 shadow-sm text-[10px] sm:text-xs">New</Badge>}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-taupe hover:text-espresso hover:bg-white transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
          aria-label="Toggle Wishlist"
        >
          <Heart size={16} className={cn("transition-colors", isInWishlist(product.id) ? "fill-blush text-blush" : "")} />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex flex-col px-1 flex-grow">
        <h3 className="font-serif text-espresso text-[15px] sm:text-[17px] leading-snug line-clamp-2 mb-1">{product.name}</h3>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <StarRating rating={product.rating} size={12} />
            <span className="text-[11px] sm:text-xs text-espresso-soft/80">({product.reviewCount})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="font-medium text-espresso text-[15px] sm:text-[16px]">₹{product.price}</span>
          {hasDiscount && (
            <span className="text-taupe line-through text-xs sm:text-sm">₹{product.compareAtPrice}</span>
          )}
        </div>
      </div>

      {/* Quick Add and Buy Now */}
      <div className="flex gap-1.5 sm:gap-2 mt-1 px-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (product.stock === 0) return;
            addItem({ productId: product.id, quantity: 1, name: product.name, price: product.price, image: product.images?.[0], slug: product.slug });
            toast(`Added ${product.name} to cart`, "success");
          }}
          disabled={product.stock === 0}
          className="flex-1 rounded-full bg-cream border border-taupe/20 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-espresso shadow-sm transition-all duration-300 hover:bg-cream-soft hover:shadow-md hover:scale-[1.02] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso"
        >
          {product.stock === 0 ? "Out of Stock" : "Quick Add"}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (product.stock === 0) return;
            addItem({ productId: product.id, quantity: 1, name: product.name, price: product.price, image: product.images?.[0], slug: product.slug });
            router.push("/checkout");
          }}
          disabled={product.stock === 0}
          className="flex-1 rounded-full bg-espresso border border-transparent py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:bg-espresso-deep hover:shadow-md hover:scale-[1.02] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso"
        >
          Buy Now
        </button>
      </div>
    </Link>
  )
}
