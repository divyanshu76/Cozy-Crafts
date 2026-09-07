"use client";

import { useTransition, useState } from "react";
import { createShipmentAction } from "./actions";
import { Loader2, Truck, AlertCircle, CheckCircle2 } from "lucide-react";

interface CreateShipmentButtonProps {
  orderId: string;
  orderStatus: string;
}

export function CreateShipmentButton({ orderId, orderStatus }: CreateShipmentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const canShip = orderStatus === "PAID" || orderStatus === "CONFIRMED";

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const res = await createShipmentAction(orderId);
      setResult(res);
    });
  };

  return (
    <div className="pt-3 border-t border-taupe/10 space-y-3">
      <p className="text-xs text-espresso-soft">No shipment created yet.</p>

      {result && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
            result.success
              ? "bg-sage/10 border border-sage/30 text-sage"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">
            {result.success
              ? "Shipment created. AWB assigned and pickup scheduled."
              : result.error}
          </p>
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={isPending || !canShip}
        className="w-full flex items-center justify-center gap-2 text-sm bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating shipment…
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />
            Create Shipment
          </>
        )}
      </button>

      {!canShip && (
        <p className="text-xs text-espresso-soft text-center">
          Order must be PAID or CONFIRMED to create a shipment.
        </p>
      )}
    </div>
  );
}
