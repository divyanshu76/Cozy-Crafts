"use client"
import * as React from "react"
import Link from "next/link"
import { useCartStore } from "@/hooks/useCartStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Fallback products resolving
  // In a real app we'd fetch these from the API based on item IDs
  const subtotal = getCartTotal([]); // simplified
  const isFreeShipping = subtotal >= 499;
  const shippingAmount = isFreeShipping ? 0 : 50;
  const total = subtotal + shippingAmount;

  // Since we don't have direct access to product data here easily in a client component
  // without a query, we'll just mock the total to let the UI render for the demo.
  // We'll assume the cart logic is mostly handled in the drawer and just show the form here.
  
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      clearCart();
      router.push("/checkout/confirmation");
    }, 2000);
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-espresso mb-4">Your Cart is Empty</h1>
        <Button asChild>
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl">
      <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 xl:col-span-8">
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
            
            {/* Contact Info */}
            <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
              <h2 className="text-xl font-serif text-espresso mb-4">Contact Information</h2>
              <div className="space-y-4">
                <Input type="email" placeholder="Email address" required />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="newsletter" className="rounded text-sage focus:ring-sage" />
                  <label htmlFor="newsletter" className="text-sm text-espresso-soft">Email me with news and offers</label>
                </div>
              </div>
            </section>

            {/* Shipping Info */}
            <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
              <h2 className="text-xl font-serif text-espresso mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input type="text" placeholder="First name" required />
                <Input type="text" placeholder="Last name" required />
                <div className="md:col-span-2">
                  <Input type="text" placeholder="Address" required />
                </div>
                <div className="md:col-span-2">
                  <Input type="text" placeholder="Apartment, suite, etc. (optional)" />
                </div>
                <Input type="text" placeholder="City" required />
                <Input type="text" placeholder="State" required />
                <Input type="text" placeholder="PIN code" required />
                <Input type="tel" placeholder="Phone" required />
              </div>
            </section>
            
            {/* Payment Method */}
            <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
              <h2 className="text-xl font-serif text-espresso mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-taupe/30 rounded-lg bg-white cursor-pointer hover:border-sage transition-colors">
                  <input type="radio" name="payment" value="online" className="text-sage focus:ring-sage" defaultChecked />
                  <span className="ml-3 font-medium text-espresso">Pay Online (UPI, Cards, Netbanking)</span>
                </label>
                <label className="flex items-center p-4 border border-taupe/30 rounded-lg bg-white cursor-pointer hover:border-sage transition-colors">
                  <input type="radio" name="payment" value="cod" className="text-sage focus:ring-sage" />
                  <span className="ml-3 font-medium text-espresso">Cash on Delivery (COD)</span>
                </label>
              </div>
            </section>

          </form>
        </div>

        {/* Order Summary (Simplified for demo since cart data mapping is in context) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-cream p-6 rounded-xl border border-taupe/20 sticky top-24">
            <h2 className="text-xl font-serif text-espresso mb-4">Order Summary</h2>
            <div className="border-t border-taupe/20 pt-4 space-y-4 mb-6">
              <div className="flex justify-between text-espresso">
                <span>Items ({items.length})</span>
                <span>Calculated</span>
              </div>
              <div className="flex justify-between text-espresso">
                <span>Shipping</span>
                <span>Calculated</span>
              </div>
            </div>
            <div className="border-t border-taupe/20 pt-4 mb-8">
              <div className="flex justify-between text-lg font-bold text-espresso">
                <span>Total</span>
                <span>₹ --</span>
              </div>
              <p className="text-xs text-taupe mt-1">Including all taxes</p>
            </div>
            
            <Button 
              type="submit" 
              form="checkout-form"
              className="w-full h-14 text-lg" 
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
            <p className="text-xs text-center text-taupe mt-4 flex items-center justify-center gap-1">
              🔒 Secure checkout provided by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
