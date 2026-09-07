"use client"
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const paymentMethod = searchParams.get("paymentMethod");

  return (
    <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
      <div className="mb-8 p-4 bg-sage/10 rounded-full">
        <CheckCircle className="w-16 h-16 text-sage" />
      </div>
      
      <h1 className="font-serif text-4xl text-espresso mb-4">
        Thank You for Your Order!
      </h1>
      <p className="text-xl text-espresso-soft mb-8">
        Your order has been placed successfully.
      </p>

      {/* Dynamic Payment Messaging */}
      {paymentMethod === "COD" ? (
        <p className="text-espresso font-medium mb-8 bg-sage/10 px-6 py-3 rounded-xl inline-block">
          Your Cash on Delivery order has been confirmed. You&apos;ll pay when your order is delivered.
        </p>
      ) : (
        <p className="text-espresso font-medium mb-8 bg-sage/10 px-6 py-3 rounded-xl inline-block">
          Your payment has been received successfully.
        </p>
      )}

      {orderNumber && (
        <p className="text-espresso-soft mb-8">
          Order Number: <strong className="text-espresso">{orderNumber}</strong>
        </p>
      )}
      
      <div className="bg-cream-soft p-6 md:p-8 rounded-xl border border-taupe/20 w-full mb-10 text-left">
        <p className="text-espresso mb-4 leading-relaxed">
          We&apos;ve sent your order details and tracking information to your email. We&apos;ll start handcrafting your items right away. 
        </p>
        <p className="text-sm text-taupe">
          Have questions? Contact us at{" "}
          <a href="mailto:hello@cozycraft.in" className="text-sage hover:underline">
            hello@cozycraft.in
          </a>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        {orderNumber && (
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}>
              <Package className="h-4 w-4 mr-2" />
              Track Order
            </Link>
          </Button>
        )}
      </div>

      <p className="text-taupe text-xs mt-12 italic">
        Made with care, packed with love. 💚
      </p>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <React.Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-espresso-soft">Loading order confirmation...</div>}>
      <ConfirmationContent />
    </React.Suspense>
  );
}
