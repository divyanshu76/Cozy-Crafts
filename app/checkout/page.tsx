"use client";
import * as React from "react";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/hooks/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, Truck, Tag, AlertCircle, Check, Lock, CreditCard, Banknote } from "lucide-react";
import { normalizeIndianPhone, isValidIndianMobile } from "@/lib/contact-utils";

// ── Form schema ──────────────────────────────────────────────────────────────
const checkoutFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .refine((val) => isValidIndianMobile(normalizeIndianPhone(val) || ""), {
      message: "Enter a valid 10-digit Indian mobile number (e.g. 7376907289 or +91 7376907289)",
    }),
  addressLine: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["RAZORPAY", "CARD", "COD"]),
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
    codFee?: number;
    total: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      paymentMethod: "RAZORPAY",
    },
  });

  const paymentMethod = watch("paymentMethod");

  // Optimistic client-side pricing (shown before server responds)
  const clientSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const clientShipping = 0; // Shipping is always free
  const clientCodFee = paymentMethod === "COD" ? 0 : 0; // Configurable COD fee
  const clientTotal = clientSubtotal + clientShipping + clientCodFee;

  const pricing = serverPricing ?? {
    subtotal: clientSubtotal,
    discount: 0,
    shippingFee: clientShipping,
    codFee: clientCodFee,
    total: clientTotal,
  };

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
          paymentMethod: formData.paymentMethod,
          address: {
            fullName: formData.fullName.trim(),
            phone: normalizeIndianPhone(formData.phone) || formData.phone.replace(/\D/g, ""),
            email: formData.email.trim().toLowerCase(),
            addressLine: formData.addressLine.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pinCode: formData.pinCode.trim(),
          },
        }),
      });

      let createData: any = null;
      const rawText = await createRes.text();
      try {
        createData = rawText ? JSON.parse(rawText) : null;
      } catch {
        // Response was not JSON (e.g. empty or HTML error page)
      }

      if (!createRes.ok) {
        const errorMsg =
          createData?.error
            ? createData.details
              ? `${createData.error} (${createData.details})`
              : createData.error
            : `Server returned error (${createRes.status} ${createRes.statusText || "Internal Error"}). Please check server configuration.`;
        setError(errorMsg);
        setIsProcessing(false);
        return;
      }

      if (!createData) {
        setError("Invalid response received from server. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Update pricing display from server's authoritative values
      setServerPricing({
        subtotal: createData.subtotal,
        discount: createData.discount,
        shippingFee: createData.shippingFee,
        codFee: createData.codFee,
        total: createData.total,
      });

      // ── 2. Handle COD Order ──────────────────────────────────────────────
      if (createData.paymentMethod === "COD") {
        clearCart();
        router.push(
          `/checkout/confirmation?orderNumber=${encodeURIComponent(
            createData.publicOrderNumber
          )}&paymentMethod=COD`
        );
        return; // Done
      }

      // ── 3. Open Razorpay Checkout modal ──────────────────────────────────
      if (typeof window === "undefined" || !window.Razorpay) {
        setError("Payment gateway is still loading. Please wait a moment and try again.");
        setIsProcessing(false);
        return;
      }

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
          // ── 4. Verify payment server-side ──────────────────────────────
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
              )}&paymentMethod=${formData.paymentMethod}`
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
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message
          ? `Error: ${err.message}`
          : "A network error occurred. Please try again."
      );
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* Background Watermark */}
      <div className="fixed inset-0 pointer-events-none z-[-1] flex items-center justify-center overflow-hidden">
        <div className="relative w-[120vw] h-[120vh] md:w-[800px] md:h-[800px] opacity-[0.03]">
          <Image src="/assets/logo.png" alt="" fill className="object-contain" priority />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl relative z-10">
        <div className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-2">
            Checkout
          </h1>
          <p className="text-espresso-soft flex items-center justify-center md:justify-start gap-2">
            Complete your order securely <Lock className="w-3 h-3" />
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ── Form ────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <form
              id="checkout-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 md:space-y-8"
            >
              {/* Contact */}
              <section className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-4">
                  Contact Information
                </h2>
                <p className="text-sm text-espresso-soft mb-4">
                  We&apos;ll send your order confirmation and tracking updates to this email.
                </p>
                <div className="space-y-4">
                  <div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email address"
                      {...register("email")}
                      className="bg-white"
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
                      className="bg-white"
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
              <section className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-taupe/20">
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
                      className="bg-white"
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
                      className="bg-white"
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
                      className="bg-white"
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
                      className="bg-white"
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
                      className="bg-white"
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
              <section className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-sage" />
                  Coupon Code
                </h2>
                <Input
                  id="couponCode"
                  type="text"
                  placeholder="Enter coupon code (optional)"
                  {...register("couponCode")}
                  className="uppercase bg-white"
                />
                <p className="mt-2 text-xs text-espresso-soft">
                  Discount will be applied when you place the order.
                </p>
              </section>

              {/* Payment Method */}
              <section className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-taupe/20">
                <h2 className="text-xl font-serif text-espresso mb-4">
                  Payment Method
                </h2>
                <p className="text-sm text-espresso-soft mb-4">
                  Choose how you&apos;d like to pay.
                </p>
                <div className="space-y-3">
                  {/* Razorpay */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === "RAZORPAY"
                        ? "border-sage bg-sage/5"
                        : "border-taupe/20 hover:border-sage/50"
                    }`}
                  >
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="radio"
                        value="RAZORPAY"
                        {...register("paymentMethod")}
                        className="w-4 h-4 text-sage focus:ring-sage"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block font-medium text-espresso flex items-center gap-2">
                        Pay Online via Razorpay
                      </span>
                      <span className="block text-sm text-espresso-soft mt-1">
                        UPI, Netbanking, Wallets & more
                      </span>
                    </div>
                  </label>

                  {/* Card */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === "CARD"
                        ? "border-sage bg-sage/5"
                        : "border-taupe/20 hover:border-sage/50"
                    }`}
                  >
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="radio"
                        value="CARD"
                        {...register("paymentMethod")}
                        className="w-4 h-4 text-sage focus:ring-sage"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block font-medium text-espresso flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-taupe" />
                        Credit / Debit Card
                      </span>
                      <span className="block text-sm text-espresso-soft mt-1">
                        Pay securely using your card via Razorpay.
                      </span>
                    </div>
                  </label>

                  {/* COD */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === "COD"
                        ? "border-sage bg-sage/5"
                        : "border-taupe/20 hover:border-sage/50"
                    }`}
                  >
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="radio"
                        value="COD"
                        {...register("paymentMethod")}
                        className="w-4 h-4 text-sage focus:ring-sage"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block font-medium text-espresso flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-taupe" />
                        Cash on Delivery (COD)
                      </span>
                      <span className="block text-sm text-espresso-soft mt-1">
                        Pay with cash when your order is delivered.
                      </span>
                    </div>
                  </label>
                </div>
              </section>

              {/* Trust Section */}
              <section className="bg-cream p-6 rounded-2xl shadow-sm border border-taupe/20">
                <h3 className="font-serif text-espresso text-lg mb-3 flex items-center gap-2">
                  Making Someone&apos;s Day Brighter 💚
                </h3>
                <p className="text-sm text-espresso-soft mb-5 leading-relaxed">
                  Every order supports our mission of creating handmade, sustainable and meaningful products. Thank you for being part of the Cozy Craft family.
                </p>
                <ul className="text-sm text-espresso-soft space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-sage" /> 100% Handmade
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-sage" /> Eco-friendly Materials
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-sage" /> Supporting Local Artisans
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-sage" /> Packed With Love
                  </li>
                </ul>
              </section>
            </form>
          </div>

          {/* ── Order Summary ────────────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="bg-white/90 backdrop-blur-md p-6 lg:p-8 rounded-2xl shadow-sm border border-taupe/20 sticky top-24">
              <h2 className="text-xl font-serif text-espresso mb-6">
                Order Summary
              </h2>

              {/* Items list */}
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? ""}`}
                    className="flex items-start gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-cream-soft border border-taupe/20 shrink-0 overflow-hidden relative">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-medium text-espresso truncate">
                        {item.name}
                      </p>
                      {item.variantLabel && (
                        <p className="text-xs text-taupe mt-0.5">{item.variantLabel}</p>
                      )}
                      <p className="text-xs text-espresso-soft mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-espresso shrink-0 pt-1">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-taupe/20 pt-6 space-y-3 mb-6">
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
                {paymentMethod === "COD" && pricing.codFee !== undefined && pricing.codFee > 0 && (
                  <SummaryRow
                    label="COD Fee"
                    value={`₹${pricing.codFee.toLocaleString("en-IN")}`}
                  />
                )}
              </div>

              <div className="border-t border-taupe/20 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-espresso">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-serif text-espresso block">
                      ₹{pricing.total.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-taupe mt-1 block">Including all taxes</span>
                  </div>
                </div>
              </div>


              <Button
                type="submit"
                form="checkout-form"
                className="w-full h-14 text-lg rounded-xl shadow-md transition-transform active:scale-[0.98]"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5 animate-pulse" />
                    Processing…
                  </span>
                ) : (
                  paymentMethod === "COD" ? `Place COD Order — ₹${pricing.total.toLocaleString("en-IN")}` : `Pay ₹${pricing.total.toLocaleString("en-IN")} Securely`
                )}
              </Button>

              <div className="flex justify-center items-center gap-6 mt-6">
                 <div className="flex items-center gap-1.5 text-xs text-taupe">
                   <Lock className="w-3.5 h-3.5" /> Secure
                 </div>
                 <div className="flex items-center gap-1.5 text-xs text-taupe">
                   <Truck className="w-3.5 h-3.5" /> Fast Delivery
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
