import Link from "next/link";
import { CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Statuses that mean the order is genuinely confirmed/successful
const SUCCESS_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]);

// Statuses that mean the order is confirmed for COD
const COD_SUCCESS_STATUSES = new Set([
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]);

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; order?: string; paymentMethod?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.orderNumber || params.order;
  const paymentMethod = params.paymentMethod;

  // ── No order number → redirect to shop ──────────────────────────────────
  if (!orderNumber) {
    return (
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
        <div className="mb-8 p-4 bg-red-50 rounded-full">
          <XCircle className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="font-serif text-4xl text-espresso mb-4">
          Invalid Order Link
        </h1>
        <p className="text-xl text-espresso-soft mb-8">
          This confirmation link is invalid or has expired.
        </p>
        <Button asChild size="lg">
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  // ── Fetch actual order status from DB ────────────────────────────────────
  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_method, payment_status, total")
    .eq("public_order_number", orderNumber)
    .maybeSingle();

  // ── Order not found ──────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
        <div className="mb-8 p-4 bg-amber-50 rounded-full">
          <Clock className="w-16 h-16 text-amber-400" />
        </div>
        <h1 className="font-serif text-4xl text-espresso mb-4">
          Order Not Found
        </h1>
        <p className="text-xl text-espresso-soft mb-8">
          We couldn&apos;t find an order with number{" "}
          <strong>{orderNumber}</strong>. If you just placed an order, it may
          take a moment to appear.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/shop">Return to Shop</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}>
              <Package className="h-4 w-4 mr-2" />
              Track Order
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCOD = order.payment_method === "COD";
  const isSuccess = isCOD
    ? COD_SUCCESS_STATUSES.has(order.status)
    : SUCCESS_STATUSES.has(order.status);
  const isCancelled = order.status === "CANCELLED";
  const isPaymentFailed = order.status === "PAYMENT_FAILED";
  const isPendingPayment = order.status === "PENDING_PAYMENT";

  // ── CANCELLED state ──────────────────────────────────────────────────────
  if (isCancelled) {
    return (
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
        <div className="mb-8 p-4 bg-red-50 rounded-full">
          <XCircle className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="font-serif text-4xl text-espresso mb-4">
          Order Cancelled
        </h1>
        <p className="text-xl text-espresso-soft mb-8">
          Order <strong>{orderNumber}</strong> has been cancelled.
        </p>
        <div className="bg-cream-soft p-6 rounded-xl border border-taupe/20 w-full mb-10 text-left">
          {order.payment_method !== "COD" && order.payment_status === "CAPTURED" ? (
            <p className="text-espresso leading-relaxed">
              Your payment was received. Our team will review your cancellation and
              process any eligible refund to your original payment method.
            </p>
          ) : (
            <p className="text-espresso leading-relaxed">
              No payment was charged for this order.
            </p>
          )}
          <p className="text-sm text-taupe mt-3">
            Questions?{" "}
            <a href="mailto:hello@cozycrafts.shop" className="text-sage hover:underline">
              hello@cozycrafts.shop
            </a>
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  // ── PAYMENT FAILED state ─────────────────────────────────────────────────
  if (isPaymentFailed) {
    return (
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
        <div className="mb-8 p-4 bg-red-50 rounded-full">
          <XCircle className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="font-serif text-4xl text-espresso mb-4">
          Payment Failed
        </h1>
        <p className="text-xl text-espresso-soft mb-8">
          We couldn&apos;t process your payment for order{" "}
          <strong>{orderNumber}</strong>. Your order has not been placed.
        </p>
        <div className="bg-cream-soft p-6 rounded-xl border border-taupe/20 w-full mb-10 text-left">
          <p className="text-espresso leading-relaxed">
            No payment has been charged. You can try placing your order again.
          </p>
          <p className="text-sm text-taupe mt-3">
            Questions?{" "}
            <a href="mailto:hello@cozycrafts.shop" className="text-sage hover:underline">
              hello@cozycrafts.shop
            </a>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/cart">Return to Cart</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── PENDING PAYMENT state (payment cancelled/abandoned) ──────────────────
  if (isPendingPayment) {
    return (
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
        <div className="mb-8 p-4 bg-amber-50 rounded-full">
          <XCircle className="w-16 h-16 text-amber-400" />
        </div>
        <h1 className="font-serif text-4xl text-espresso mb-4">
          Payment Cancelled
        </h1>
        <p className="text-xl text-espresso-soft mb-8">
          Your order was not placed.
        </p>
        <div className="bg-cream-soft p-6 rounded-xl border border-taupe/20 w-full mb-10 text-left">
          <p className="text-espresso leading-relaxed">
            The payment process was cancelled or abandoned before completion. No
            payment has been charged, and no order has been confirmed.
          </p>
          <p className="text-sm text-taupe mt-3">
            Your cart items are still saved. You can try again whenever you&apos;re ready.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/cart">Return to Cart</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── SUCCESS state ────────────────────────────────────────────────────────
  if (isSuccess) {
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

        {isCOD ? (
          <p className="text-espresso font-medium mb-8 bg-sage/10 px-6 py-3 rounded-xl inline-block">
            Your Cash on Delivery order has been confirmed. You&apos;ll pay when
            your order is delivered.
          </p>
        ) : (
          <p className="text-espresso font-medium mb-8 bg-sage/10 px-6 py-3 rounded-xl inline-block">
            Your payment has been received successfully.
          </p>
        )}

        <p className="text-espresso-soft mb-8">
          Order Number:{" "}
          <strong className="text-espresso">{orderNumber}</strong>
        </p>

        <div className="bg-cream-soft p-6 md:p-8 rounded-xl border border-taupe/20 w-full mb-10 text-left">
          <p className="text-espresso mb-4 leading-relaxed">
            We&apos;ve sent your order details and tracking information to your
            email. We&apos;ll start handcrafting your items right away.
          </p>
          <p className="text-sm text-taupe">
            Have questions? Contact us at{" "}
            <a
              href="mailto:hello@cozycrafts.shop"
              className="text-sage hover:underline"
            >
              hello@cozycrafts.shop
            </a>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link
              href={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}
            >
              <Package className="h-4 w-4 mr-2" />
              Track Order
            </Link>
          </Button>
        </div>

        <p className="text-taupe text-xs mt-12 italic">
          Made with care, packed with love. 💚
        </p>
      </div>
    );
  }

  // ── Unknown/processing state fallback ────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-2xl">
      <div className="mb-8 p-4 bg-amber-50 rounded-full">
        <Clock className="w-16 h-16 text-amber-400" />
      </div>
      <h1 className="font-serif text-4xl text-espresso mb-4">
        Processing Your Order
      </h1>
      <p className="text-xl text-espresso-soft mb-8">
        We&apos;re confirming your payment. This usually takes just a moment.
      </p>
      <div className="bg-cream-soft p-6 rounded-xl border border-taupe/20 w-full mb-10 text-left">
        <p className="text-espresso leading-relaxed">
          Order <strong>{orderNumber}</strong> is being processed. You&apos;ll
          receive an email confirmation shortly. If you don&apos;t hear from us
          within a few minutes, please contact us.
        </p>
        <p className="text-sm text-taupe mt-3">
          Questions?{" "}
          <a href="mailto:hello@cozycrafts.shop" className="text-sage hover:underline">
            hello@cozycrafts.shop
          </a>
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/shop">Return to Shop</Link>
      </Button>
    </div>
  );
}
