"use client"
import * as React from "react"
import { Drawer } from "@/components/ui/drawer"
import { useCartStore } from "@/hooks/useCartStore"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { products } from "@/data/products" // In a real app, this would be fetched or stored in state differently

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getCartTotal } = useCartStore();
  
  // Need the full product data for cart display
  const cartItemsWithData = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product !== undefined);

  const subtotal = getCartTotal(products);
  const isFreeShipping = subtotal >= 499;
  const shippingAmount = isFreeShipping ? 0 : 50;
  const progressPercent = Math.min((subtotal / 499) * 100, 100);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Your Cart" side="right" className="w-[90vw] sm:w-[450px]">
      <div className="flex flex-col h-full bg-cream-soft">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 p-6 bg-cream">
            <p className="text-espresso-soft text-lg">Your cart is empty.</p>
            <Button asChild onClick={onClose} className="mt-4">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            <div className="p-4 bg-sage/10 border-b border-sage/20">
              <p className="text-sm text-espresso text-center mb-2 font-medium">
                {isFreeShipping 
                  ? "You've unlocked free shipping! 🎉" 
                  : `Add ₹${(499 - subtotal).toFixed(2)} more for free shipping`}
              </p>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-sage h-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream">
              {cartItemsWithData.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm">
                  <Link href={`/product/${item.product?.slug}`} onClick={onClose} className="shrink-0 relative w-20 h-24 rounded-md overflow-hidden bg-cream-soft">
                    <Image src={item.product?.images[0] || ""} alt={item.product?.name || ""} fill className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/product/${item.product?.slug}`} onClick={onClose} className="font-medium text-espresso hover:text-sage text-sm line-clamp-1">
                          {item.product?.name}
                        </Link>
                        {item.variantId && (
                          <p className="text-xs text-taupe mt-0.5">
                            {item.product?.variants?.find(v => v.id === item.variantId)?.label}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-taupe hover:text-blush transition-colors p-1 -mt-1 -mr-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-taupe/30 rounded-md h-8 bg-cream-soft">
                        <button 
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.variantId)}
                          className="w-8 h-full flex items-center justify-center text-espresso hover:bg-cream transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="w-8 h-full flex items-center justify-center text-espresso hover:bg-cream transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-medium text-espresso text-sm">
                        ₹{item.product?.price && item.product.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="border-t border-taupe/20 p-6 bg-white shrink-0">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-espresso-soft">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-espresso-soft">
                  <span>Shipping</span>
                  <span>{isFreeShipping ? "Free" : `₹${shippingAmount.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-espresso pt-2 border-t border-taupe/10 mt-2">
                  <span>Total</span>
                  <span>₹{(subtotal + shippingAmount).toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-taupe text-center mb-4">Taxes included. Discounts calculated at checkout.</p>
              <Button asChild className="w-full h-12 text-base" onClick={onClose}>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  )
}
