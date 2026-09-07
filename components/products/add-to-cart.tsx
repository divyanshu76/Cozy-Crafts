"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { useCartStore } from "@/hooks/useCartStore"
import { useWishlistStore } from "@/hooks/useWishlistStore"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddToCartProps {
  product: Product;
}

export function AddToCart({ product }: AddToCartProps) {
  const [selectedVariant, setSelectedVariant] = React.useState<string | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [quantity, setQuantity] = React.useState(1);
  
  const addItem = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { toast } = useToast();

  const variant = product.variants?.find(v => v.id === selectedVariant);
  const maxStock = variant ? variant.stock : product.stock;

  // Clamp quantity if max stock changes (e.g. switching variants)
  React.useEffect(() => {
    if (quantity > maxStock) {
      setQuantity(Math.max(1, maxStock));
    }
  }, [maxStock, quantity]);

  const handleAdd = () => {
    if (maxStock === 0) return;

    addItem({ 
      productId: product.id, 
      quantity,
      variantId: selectedVariant,
      variantLabel: variant?.label,
      name: product.name,
      price: variant?.priceOverride ?? product.price,
      image: product.images?.[0],
      slug: product.slug,
    });
    
    const itemName = variant ? `${product.name} (${variant.label})` : product.name;
    toast(`Added ${quantity} ${itemName} to cart`, "success");
  };

  const handleWishlist = () => {
    toggleItem(product.id);
  };

  const currentPrice = variant?.priceOverride ?? product.price;
  const originalPrice = product.compareAtPrice;
  const hasDiscount = originalPrice && originalPrice > currentPrice;

  return (
    <div className="flex flex-col gap-8">
      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-serif text-espresso font-medium">₹{currentPrice}</span>
        {hasDiscount && (
          <span className="text-lg text-taupe line-through mb-1">₹{originalPrice}</span>
        )}
      </div>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium tracking-wide text-espresso uppercase">Color / Style</label>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const isSelected = selectedVariant === v.id;
              const isVariantOutOfStock = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  disabled={isVariantOutOfStock}
                  className={cn(
                    "px-5 py-2.5 text-sm rounded-full transition-all duration-200 border",
                    isSelected 
                      ? "border-espresso bg-espresso text-cream shadow-sm" 
                      : "border-taupe/20 text-espresso hover:border-espresso/40 bg-white",
                    isVariantOutOfStock && "opacity-40 cursor-not-allowed hover:border-taupe/20 line-through"
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium tracking-wide text-espresso uppercase">Quantity</label>
        {/* Quantity & Actions Row */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          {/* Quantity Selector */}
          <div className="flex items-center border border-taupe/30 rounded-full h-14 bg-white px-2">
            <button 
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-espresso hover:bg-cream-soft transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || maxStock === 0}
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>
            <span className="w-12 text-center text-espresso font-medium">{maxStock === 0 ? 0 : quantity}</span>
            <button 
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-espresso hover:bg-cream-soft transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
              disabled={quantity >= maxStock || maxStock === 0}
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <Button 
            className="flex-1 h-14 rounded-full text-base font-medium shadow-sm hover:shadow transition-all bg-espresso hover:bg-espresso/90 text-white" 
            onClick={handleAdd}
            disabled={maxStock === 0}
          >
            {maxStock === 0 ? "Out of Stock" : (
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} />
                Add to Cart
              </span>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="h-14 w-14 rounded-full px-0 flex-shrink-0 border-taupe/30 hover:border-blush/50 hover:bg-blush/5 transition-colors"
            onClick={handleWishlist}
            aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={22} className={cn("transition-colors", isInWishlist(product.id) ? "fill-blush text-blush" : "text-espresso")} />
          </Button>
        </div>
        
        {maxStock > 0 && maxStock <= 5 && (
          <p className="text-sm text-blush font-medium flex items-center gap-1.5 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blush opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blush"></span>
            </span>
            Only {maxStock} left in stock — order soon.
          </p>
        )}
      </div>
    </div>
  )
}
