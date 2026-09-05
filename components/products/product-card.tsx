"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"
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
      className="group relative flex flex-col gap-3 transition-all duration-300 hover:shadow-md rounded-xl p-2 sm:p-3 -mx-2 sm:-mx-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-cream-soft">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={cn(
            "object-cover transition-all duration-300 ease-out group-hover:scale-[1.04]",
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
              "object-cover transition-opacity duration-300 absolute inset-0",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.stock === 0 && <Badge variant="outline" className="bg-white/90">Out of stock</Badge>}
          {product.stock > 0 && product.stock <= 5 && <Badge variant="secondary" className="bg-blush/90">Only {product.stock} left</Badge>}
          {hasDiscount && <Badge className="bg-sage/90 text-white">-{discountPercent}%</Badge>}
          {product.isNew && !hasDiscount && <Badge variant="outline" className="bg-white/90">New</Badge>}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 backdrop-blur-sm text-espresso hover:bg-white transition-colors"
          aria-label="Toggle Wishlist"
        >
          <Heart size={18} className={cn("transition-colors", isInWishlist(product.id) ? "fill-blush text-blush" : "")} />
        </button>

        {/* Quick Add and Buy Now */}
        <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (product.stock === 0) return;
              addItem({ productId: product.id, quantity: 1, name: product.name, price: product.price, image: product.images?.[0], slug: product.slug });
              toast(`Added ${product.name} to cart`, "success");
            }}
            disabled={product.stock === 0}
            className="flex-1 rounded-full bg-[var(--color-cream)] py-2 text-xs font-medium text-[var(--color-espresso)] shadow-sm transition-colors hover:bg-[var(--color-cream-soft)] disabled:opacity-50"
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
            className="flex-1 rounded-full bg-[var(--color-espresso)] py-2 text-xs font-medium text-[var(--color-cream)] shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col px-1">
        <h3 className="font-semibold text-espresso text-[15px] sm:text-base truncate">{product.name}</h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-bold text-espresso">₹{product.price}</span>
          {hasDiscount && (
            <span className="text-taupe line-through text-sm">₹{product.compareAtPrice}</span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <StarRating rating={product.rating} size={12} />
            <span className="text-xs text-espresso-soft">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  )
}
