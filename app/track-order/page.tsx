"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Search,
  CheckCircle,
  Truck,
  MapPin,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

const trackSchema = z.object({
  orderNumber: z.string().min(5, "Enter your order number"),
  contact: z.string().min(5, "Enter your email or phone number").optional(),
});

type TrackFormValues = z.infer<typeof trackSchema>;

// ── Stepper config ────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Confirmed", icon: <CheckCircle className="h-4 w-4" /> },
  { label: "Packed", icon: <Package className="h-4 w-4" /> },
  { label: "Shipped", icon: <Truck className="h-4 w-4" /> },
  { label: "Out for Delivery", icon: <Truck className="h-4 w-4" /> },
  { label: "Delivered", icon: <CheckCircle className="h-4 w-4" /> },
];

function getActiveStepIndex(orderStatus: string, shippingStatus: string): number {
  if (shippingStatus === "DELIVERED") return 4;
  if (shippingStatus === "OUT_FOR_DELIVERY") return 3;
  if (shippingStatus === "IN_TRANSIT" || shippingStatus === "PICKED_UP") return 2;
  if (shippingStatus === "PICKUP_SCHEDULED") return 1;
  if (orderStatus === "CONFIRMED" || orderStatus === "PROCESSING" || orderStatus === "PAID") return 0;
  return -1;
}

// ── Order result type ────────────────────────────────────────────────────────
interface OrderResult {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shippingStatus: string;
  awbNumber?: string;
  courierName?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  total: number;
  items: {
    name: string;
    image?: string;
    quantity: number;
    price: number;
  }[];
  timeline: {
    type: string;
    status: string;
    timestamp: string;
  }[];
}

// ── Content ──────────────────────────────────────────────────────────────────
function TrackOrderContent() {
  const searchParams = useSearchParams();
  const prefillOrderNumber =
    searchParams.get("order") || searchParams.get("orderNumber") || "";
  const token = searchParams.get("token") ?? undefined;

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<OrderResult | null>(null);

  // If we have a token, we don't strictly require contact info
  const trackSchemaDynamic = z.object({
    orderNumber: z.string().min(3, "Enter your order number"),
    contact: token
      ? z.string().optional()
      : z.string().min(3, "Enter your email or phone number"),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchemaDynamic),
    defaultValues: { orderNumber: prefillOrderNumber, contact: "" },
  });

  const onSubmit = async (data: TrackFormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(json);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (prefillOrderNumber && token && !result && !isLoading && !error) {
      handleSubmit(onSubmit)();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillOrderNumber, token]);

  return (
    <div className="min-h-screen bg-cream selection:bg-sage/20 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-3">Track Your Order</h1>
          <p className="text-espresso-soft text-lg font-sans">
            Enter your order number {token ? "to see its status." : "and contact info to see its status."}
          </p>
        </div>

        {/* ── Lookup Form ── */}
        {!token && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-taupe/20">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-espresso ml-1">Order Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-espresso-soft">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input
                      {...register("orderNumber")}
                      placeholder="e.g. CC-20260905-0001"
                      className="pl-10 bg-cream-soft border-taupe/30 focus-visible:ring-sage focus-visible:border-sage placeholder:text-espresso-soft/50 h-11"
                    />
                  </div>
                  {errors.orderNumber && (
                    <p className="text-red-500 text-xs ml-1 font-medium">{errors.orderNumber.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-espresso ml-1">Email or Phone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-espresso-soft">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <Input
                      {...register("contact")}
                      placeholder="Used during checkout"
                      className="pl-10 bg-cream-soft border-taupe/30 focus-visible:ring-sage focus-visible:border-sage placeholder:text-espresso-soft/50 h-11"
                    />
                  </div>
                  {errors.contact && (
                    <p className="text-red-500 text-xs ml-1 font-medium">{errors.contact.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-espresso hover:bg-espresso/90 text-cream text-base rounded-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Tracking...
                  </>
                ) : (
                  "Track Order"
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        )}
        
        {token && error && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-taupe/20">
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/track-order'} className="bg-white">
                  Try Manual Tracking
                </Button>
              </div>
            </div>
          </div>
        )}

        {token && isLoading && !result && !error && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-taupe/20 flex flex-col items-center justify-center text-espresso-soft">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-sage" />
            <p>Finding your order details...</p>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-taupe/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header info */}
            <div className="p-6 md:p-8 border-b border-taupe/10 bg-cream-soft/50">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-espresso-soft mb-1">Order Placed</p>
                  <p className="font-medium text-espresso">
                    {new Date(result.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-medium text-espresso-soft mb-1">Total</p>
                  <p className="font-semibold text-espresso text-xl">
                    ₹{result.total.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-10">
              
              {/* Stepper */}
              {result.orderStatus === "CANCELLED" || result.orderStatus === "REFUNDED" ? (
                 <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-800">
                   <AlertCircle className="h-5 w-5 shrink-0" />
                   <div>
                     <p className="font-medium">Order Cancelled</p>
                     <p className="text-sm mt-1 text-red-700">This order has been cancelled and will not be shipped.</p>
                   </div>
                 </div>
              ) : result.orderStatus === "PENDING_PAYMENT" || result.orderStatus === "PAYMENT_FAILED" ? (
                 <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800">
                   <AlertCircle className="h-5 w-5 shrink-0" />
                   <div>
                     <p className="font-medium">Awaiting Payment</p>
                     <p className="text-sm mt-1 text-amber-700">We are waiting for payment confirmation before processing this order.</p>
                   </div>
                 </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-taupe/20 -translate-y-1/2 hidden md:block"></div>
                  <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    {STEPS.map((step, i) => {
                      const activeIndex = getActiveStepIndex(result.orderStatus, result.shippingStatus);
                      const isActive = i === activeIndex;
                      const isPast = i <= activeIndex;
                      
                      return (
                        <div key={i} className="flex md:flex-col items-center gap-4 md:gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                            isActive ? 'bg-sage border-sage text-white shadow-md' :
                            isPast ? 'bg-sage/20 border-sage/50 text-sage' :
                            'bg-white border-taupe/30 text-taupe/50'
                          }`}>
                            {step.icon}
                          </div>
                          <span className={`font-medium text-sm ${isActive ? 'text-espresso font-bold' : isPast ? 'text-espresso-soft' : 'text-taupe'}`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Shipping Details */}
              {(result.awbNumber || result.courierName) && (
                <div className="p-5 rounded-xl bg-cream-soft border border-taupe/20">
                  <h3 className="font-medium text-espresso mb-4 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sage" /> Shipping Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {result.courierName && (
                      <div>
                        <p className="text-espresso-soft mb-1">Courier</p>
                        <p className="font-medium text-espresso">{result.courierName}</p>
                      </div>
                    )}
                    {result.awbNumber && (
                      <div>
                        <p className="text-espresso-soft mb-1">Tracking Number</p>
                        <p className="font-medium text-espresso font-mono">{result.awbNumber}</p>
                      </div>
                    )}
                    {result.estimatedDeliveryDate && (
                      <div>
                        <p className="text-espresso-soft mb-1">Estimated Delivery</p>
                        <p className="font-medium text-espresso">{result.estimatedDeliveryDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div>
                <h3 className="font-serif text-xl text-espresso mb-4">Items in your order</h3>
                <div className="divide-y divide-taupe/10 border border-taupe/20 rounded-xl overflow-hidden">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white">
                      <div className="w-16 h-16 bg-cream-soft rounded-lg overflow-hidden shrink-0 border border-taupe/10">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-taupe/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-espresso truncate">{item.name}</p>
                        <p className="text-sm text-espresso-soft">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-espresso shrink-0">
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                 <div>
                   <h3 className="font-medium text-espresso mb-4 text-sm uppercase tracking-wider text-espresso-soft">Updates History</h3>
                   <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-taupe/20 before:to-transparent">
                     {result.timeline.map((event, idx) => (
                       <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                         {/* marker */}
                         <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-sage/20 text-sage shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <div className="w-1.5 h-1.5 bg-sage rounded-full"></div>
                         </div>
                         <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-white border border-taupe/20 shadow-sm flex flex-col">
                           <span className="font-medium text-espresso text-sm">{event.status.replace(/_/g, ' ')}</span>
                           <span className="text-xs text-espresso-soft">{new Date(event.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center text-espresso-soft">Loading order tracking...</div>}>
      <TrackOrderContent />
    </React.Suspense>
  );
}
