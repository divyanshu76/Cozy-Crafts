"use client"
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
      <div className="mb-8 p-4 bg-sage/10 rounded-full">
        <CheckCircle className="w-16 h-16 text-sage" />
      </div>
      
      <h1 className="font-serif text-4xl text-espresso mb-4">
        Thank you for your order!
      </h1>
      <p className="text-xl text-espresso-soft mb-8">
        {orderNumber ? (
          <>
            Your order{" "}
            <span className="font-semibold text-espresso">{orderNumber}</span>{" "}
            has been confirmed.
          </>
        ) : (
          "Your order has been confirmed."
        )}
      </p>
      
      <div className="bg-cream-soft p-6 md:p-8 rounded-xl border border-taupe/20 w-full mb-10">
        <p className="text-espresso mb-4">
          We&apos;ll start handcrafting your items right away. You&apos;ll receive an
          email confirmation once your order ships.
        </p>
        <p className="text-sm text-taupe">
          Have questions? Contact us at{" "}
          <a href="mailto:hello@cozycraft.in" className="text-sage hover:underline">
            hello@cozycraft.in
          </a>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        {orderNumber && (
          <Button asChild variant="outline" size="lg">
            <Link href={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}>
              <Package className="h-4 w-4 mr-2" />
              Track My Order
            </Link>
          </Button>
        )}
      </div>
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
