"use client"
import * as React from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ConfirmationPage() {
  const orderNumber = React.useMemo(() => `CC-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`, []);

  return (
    <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
      <div className="mb-8 p-4 bg-sage/10 rounded-full">
        <CheckCircle className="w-16 h-16 text-sage" />
      </div>
      
      <h1 className="font-serif text-4xl text-espresso mb-4">Thank you for your order!</h1>
      <p className="text-xl text-espresso-soft mb-8">
        Your order <span className="font-semibold text-espresso">{orderNumber}</span> has been confirmed.
      </p>
      
      <div className="bg-cream-soft p-6 md:p-8 rounded-xl border border-taupe/20 w-full mb-10">
        <p className="text-espresso mb-4">
          We'll start handcrafting your items right away. You'll receive an email confirmation with tracking details once your order ships.
        </p>
        <p className="text-sm text-taupe">
          Have questions? Contact us at <a href="mailto:hello@cozycraft.in" className="text-sage hover:underline">hello@cozycraft.in</a>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/account">View Order Status</Link>
        </Button>
      </div>
    </div>
  )
}
