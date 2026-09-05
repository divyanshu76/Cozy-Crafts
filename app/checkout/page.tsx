"use client";
import * as React from "react";
import Link from "next/link";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/hooks/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, Truck, Tag, AlertCircle } from "lucide-react";

// ── Form schema ──────────────────────────────────────────────────────────────
const checkoutFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  addressLine: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  couponCode: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// ── Razorpay window type ─────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open(): void;
}

// ── Order summary line ───────────────────────────────────────────────────────
function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={accent ? "text-sage font-medium" : "text-espresso-soft"}>
        {label}
      </span>
      <span className={accent ? "text-sage font-medium" : "text-espresso"}>
        {value}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [serverPricing, setServerPricing] = React.useState<{
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
  } | null>(null);

  // Optimistic client-side pricing (shown before server responds)
  const clientSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const clientShipping = clientSubtotal >= 499 ? 0 : 49;
  const clientTotal = clientSubtotal + clientShipping;

  const pricing = serverPricing ?? {
    subtotal: clientSubtotal,
    discount: 0,
    shippingFee: clientShipping,
    total: clientTotal,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
  });

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-taupe" strokeWidth={1} />
        <h1 className="font-serif text-3xl text-espresso mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-espresso-soft mb-8">
          Add something cozy before checking out.
        </p>
        <Button asChild>
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (formData: CheckoutFormValues) => {
    setError(null);
    setIsProcessing(true);

    try {
      // ── 1. Create order server-side ──────────────────────────────────────
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          couponCode: formData.couponCode || undefined,
          address: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            addressLine: formData.addressLine,
            city: formData.city,
            state: formData.state,
            pinCode: formData.pinCode,
          },
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.error ?? "Something went wrong. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Update pricing display from server's authoritative values
      setServerPricing({
        subtotal: createData.subtotal,
        discount: createData.discount,
        shippingFee: createData.shippingFee,
        total: createData.total,
      });

      // ── 2. Open Razorpay Checkout modal ──────────────────────────────────
      const rzp = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount, // already in paise
        currency: createData.currency,
        name: "Cozy Craft",
        description: `Order ${createData.publicOrderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#7C9A7E" }, // --color-sage
        handler: async (response) => {
          // ── 3. Verify payment server-side ──────────────────────────────
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            clearCart();
            router.push(
              `/checkout/confirmation?orderNumber=${encodeURIComponent(
                createData.publicOrderNumber
              )}`
            );
          } else {
            setError(
              "Payment was received but verification failed. Please contact support with your order number: " +
                createData.publicOrderNumber
            );
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError("Payment was cancelled. Your order has not been placed.");
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl">
        <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-2">
          Checkout
        </h1>
        <p className="text-espresso-soft mb-8 text-sm">
          {items.length} {items.length === 1 ? "item" : "items"} in your cart
        </p>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Form ────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-8">
            <form
              id="checkout-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Contact */}
              <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email address"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Mobile number (10 digits)"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping */}
              <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-4">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Full name"
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      id="addressLine"
                      type="text"
                      placeholder="Address (house/flat, street, area)"
                      {...register("addressLine")}
                    />
                    {errors.addressLine && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.addressLine.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="state"
                      type="text"
                      placeholder="State"
                      {...register("state")}
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="pinCode"
                      type="text"
                      placeholder="PIN code"
                      maxLength={6}
                      {...register("pinCode")}
                    />
                    {errors.pinCode && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.pinCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Coupon */}
              <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-sage" />
                  Coupon Code
                </h2>
                <Input
                  id="couponCode"
                  type="text"
                  placeholder="Enter coupon code (optional)"
                  {...register("couponCode")}
                  className="uppercase"
                />
                <p className="mt-2 text-xs text-espresso-soft">
                  Discount will be applied when you place the order.
                </p>
              </section>

              {/* Payment method note */}
              <section className="bg-cream-soft p-6 rounded-xl border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-3">
                  Payment
                </h2>
                <div className="flex items-center gap-3 p-4 border border-sage/40 rounded-lg bg-sage/5">
                  <div className="w-3 h-3 rounded-full bg-sage" />
                  <span className="font-medium text-espresso">
                    Pay Online via Razorpay
                  </span>
                  <span className="ml-auto text-xs text-espresso-soft">
                    UPI · Cards · Netbanking · Wallets
                  </span>
                </div>
              </section>
            </form>
          </div>

          {/* ── Order Summary ────────────────────────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-cream p-6 rounded-xl border border-taupe/20 sticky top-24">
              <h2 className="text-xl font-serif text-espresso mb-4">
                Order Summary
              </h2>

              {/* Items list */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? ""}`}
                    className="flex items-start gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-cream-soft border border-taupe/20 shrink-0 overflow-hidden">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-espresso truncate">
                        {item.name}
                      </p>
                      {item.variantLabel && (
                        <p className="text-xs text-taupe">{item.variantLabel}</p>
                      )}
                      <p className="text-xs text-espresso-soft">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-espresso shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-taupe/20 pt-4 space-y-2 mb-4">
                <SummaryRow
                  label="Subtotal"
                  value={`₹${pricing.subtotal.toLocaleString("en-IN")}`}
                />
                {pricing.discount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`−₹${pricing.discount.toLocaleString("en-IN")}`}
                    accent
                  />
                )}
                <SummaryRow
                  label={
                    pricing.shippingFee === 0
                      ? "Shipping (FREE)"
                      : "Shipping"
                  }
                  value={
                    pricing.shippingFee === 0
                      ? "FREE"
                      : `₹${pricing.shippingFee}`
                  }
                  accent={pricing.shippingFee === 0}
                />
              </div>

              <div className="border-t border-taupe/20 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-espresso">Total</span>
                  <span className="text-lg font-bold text-espresso">
                    ₹{pricing.total.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-taupe mt-1">Including all taxes</p>
              </div>

              {pricing.shippingFee > 0 && (
                <div className="mb-4 flex items-center gap-2 text-xs text-espresso-soft bg-cream-soft rounded-lg p-3">
                  <Truck className="h-4 w-4 text-sage shrink-0" />
                  <span>
                    Add ₹{(499 - pricing.subtotal + pricing.discount).toLocaleString("en-IN")} more for free shipping
                  </span>
                </div>
              )}

              <Button
                type="submit"
                form="checkout-form"
                className="w-full h-14 text-lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5 animate-pulse" />
                    Processing…
                  </span>
                ) : (
                  `Pay ₹${pricing.total.toLocaleString("en-IN")}`
                )}
              </Button>

              <p className="text-xs text-center text-taupe mt-4">
                🔒 Secure checkout via Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
