"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { useCartStore } from "@/hooks/useCartStore"
import { useWishlistStore } from "@/hooks/useWishlistStore"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { Accordion } from "@/components/ui/accordion"
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react"

interface AddToCartProps {
  product: Product;
}

export function AddToCart({ product }: AddToCartProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedVariant, setSelectedVariant] = React.useState<string | undefined>(
    product.variants?.[0]?.id
  );
  
  const addItem = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { toast } = useToast();

  const handleAdd = () => {
    if (product.stock === 0) return;
    
    const variant = product.variants?.find(v => v.id === selectedVariant);

    addItem({ 
      productId: product.id, 
      quantity,
      variantId: selectedVariant,
      variantLabel: variant?.label,
      // Denormalized snapshot for cart drawer & checkout UI display
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

  const currentPrice = selectedVariant 
    ? (product.variants?.find(v => v.id === selectedVariant)?.priceOverride || product.price) 
    : product.price;

  return (
    <div className="flex flex-col gap-6">
      {/* Price */}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-serif text-espresso font-medium">₹{currentPrice}</span>
        {product.compareAtPrice && product.compareAtPrice > currentPrice && (
          <span className="text-taupe line-through mb-1">₹{product.compareAtPrice}</span>
        )}
      </div>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-espresso">Select Option</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  selectedVariant === variant.id 
                    ? "border-sage bg-sage/5 text-sage font-medium" 
                    : "border-taupe/30 text-espresso hover:border-sage/50"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <div className="flex items-center border border-taupe/30 rounded-md h-12">
          <button 
            type="button"
            className="w-12 h-full flex items-center justify-center text-espresso hover:bg-cream-soft transition-colors disabled:opacity-50"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center text-espresso font-medium">{quantity}</span>
          <button 
            type="button"
            className="w-12 h-full flex items-center justify-center text-espresso hover:bg-cream-soft transition-colors disabled:opacity-50"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            disabled={quantity >= product.stock}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <Button 
          className="flex-1 h-12" 
          onClick={handleAdd}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 w-12 px-0 flex-shrink-0"
          onClick={handleWishlist}
        >
          <Heart size={20} className={isInWishlist(product.id) ? "fill-blush text-blush" : ""} />
        </Button>
      </div>
      
      {product.stock > 0 && product.stock <= 5 && (
        <p className="text-sm text-blush font-medium">Only {product.stock} left in stock - order soon.</p>
      )}
    </div>
  )
}
