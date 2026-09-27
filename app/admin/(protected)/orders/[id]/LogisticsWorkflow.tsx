"use client";

import { useState, useTransition } from "react";
import { Loader2, Truck, FileText, CheckCircle2, AlertCircle, PackageCheck, Printer } from "lucide-react";
import {
  fetchCouriersAction,
  assignAwbAction,
  requestPickupAction,
  generateLabelAction,
  generateManifestAction,
} from "./logistics-actions";
import { CreateShipmentButton } from "./CreateShipmentButton";

type Courier = {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string | number;
  etd: string;
  rating: number;
  cod: number;
  is_surface: boolean;
};

export function LogisticsWorkflow({ order }: { order: any }) {
  const [isPending, startTransition] = useTransition();
  const [couriers, setCouriers] = useState<Courier[] | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasShiprocketOrder = !!order.shiprocket_order_id && !!order.shiprocket_shipment_id;
  const hasAwb = !!order.awb_number;
  const isPickupRequested = order.shipping_status === "PICKUP_SCHEDULED" || order.shipping_status === "PICKED_UP" || order.shipping_status === "IN_TRANSIT" || order.shipping_status === "SHIPPED";
  const hasLabel = !!order.shiprocket_label_url;
  const hasManifest = !!order.shiprocket_manifest_url;

  const handleFetchCouriers = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetchCouriersAction(order.id, order.shiprocket_order_id);
      if (res.success && res.data) {
        setCouriers(res.data);
      } else {
        setError(res.error || "Failed to fetch couriers.");
      }
    });
  };

  const handleAssignAwb = () => {
    if (!selectedCourierId) return;
    setError(null);
    setMessage(null);
    
    if (!confirm("Assign AWB to this shipment with the selected courier?")) return;

    startTransition(async () => {
      const res = await assignAwbAction(order.id, order.shiprocket_shipment_id, selectedCourierId);
      if (res.success) {
        setMessage("AWB assigned successfully.");
        setCouriers(null); // hide courier list
      } else {
        setError(res.error || "Failed to assign AWB.");
      }
    });
  };

  const handleRequestPickup = () => {
    setError(null);
    setMessage(null);
    
    if (!confirm("Request pickup for this shipment?")) return;

    startTransition(async () => {
      const res = await requestPickupAction(order.id, order.shiprocket_shipment_id);
      if (res.success) {
        setMessage("Pickup requested successfully.");
      } else {
        setError(res.error || "Failed to request pickup.");
      }
    });
  };

  const handleGenerateLabel = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await generateLabelAction(order.id, order.shiprocket_shipment_id);
      if (res.success) {
        setMessage("Label generated.");
      } else {
        setError(res.error || "Failed to generate label.");
      }
    });
  };

  const handleGenerateManifest = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await generateManifestAction(order.id, order.shiprocket_shipment_id);
      if (res.success) {
        setMessage("Manifest generated.");
      } else {
        setError(res.error || "Failed to generate manifest.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
      <h2 className="font-semibold text-espresso mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-sage" /> Shipping & Fulfillment
      </h2>

      <div className="space-y-4 text-sm">
        {/* Current Shipping Status */}
        <div className="flex justify-between items-center pb-2 border-b border-taupe/10">
          <span className="text-espresso-soft">Shipping Status</span>
          <span className="font-medium px-2 py-1 bg-cream-soft rounded border border-taupe/10">
            {order.shipping_status}
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-sage/10 border border-sage/30 text-sage">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{message}</p>
          </div>
        )}

        {/* Step 1: Shiprocket Order */}
        {!hasShiprocketOrder ? (
          <CreateShipmentButton orderId={order.id} orderStatus={order.status} />
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-espresso-soft">SR Order ID</span>
              <span className="font-mono text-espresso">{order.shiprocket_order_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-espresso-soft">Shipment ID</span>
              <span className="font-mono text-espresso">{order.shiprocket_shipment_id}</span>
            </div>

            {/* Step 2 & 3: Courier Selection & AWB */}
            {!hasAwb ? (
              <div className="pt-4 border-t border-taupe/10 space-y-3">
                <h3 className="font-medium text-espresso flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-sage" /> Assign Courier & AWB
                </h3>
                
                {!couriers ? (
                  <button
                    onClick={handleFetchCouriers}
                    disabled={isPending}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg bg-cream text-espresso text-sm hover:bg-cream-soft transition-colors border border-taupe/20"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Courier Availability"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-[300px] overflow-y-auto border border-taupe/20 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-cream-soft sticky top-0">
                          <tr>
                            <th className="p-2 font-medium">Courier</th>
                            <th className="p-2 font-medium">Rate</th>
                            <th className="p-2 font-medium">ETA</th>
                            <th className="p-2 font-medium">Mode</th>
                            <th className="p-2 font-medium text-center">Select</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-taupe/10">
                          {couriers.map((c) => (
                            <tr key={c.courier_company_id} className="hover:bg-cream/50 transition-colors">
                              <td className="p-2 font-medium">{c.courier_name}</td>
                              <td className="p-2">₹{c.rate}</td>
                              <td className="p-2">{c.estimated_delivery_days} days</td>
                              <td className="p-2">{c.is_surface ? "Surface" : "Air"}</td>
                              <td className="p-2 text-center">
                                <input 
                                  type="radio" 
                                  name="courier" 
                                  value={c.courier_company_id}
                                  checked={selectedCourierId === c.courier_company_id}
                                  onChange={() => setSelectedCourierId(c.courier_company_id)}
                                  className="accent-sage"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <button
                      onClick={handleAssignAwb}
                      disabled={isPending || !selectedCourierId}
                      className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-lg bg-sage text-white text-sm hover:bg-sage/90 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign AWB"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-4 border-t border-taupe/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-espresso-soft">AWB Number</span>
                  <span className="font-mono text-espresso font-medium">{order.awb_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-espresso-soft">Courier</span>
                  <span className="text-espresso">{order.courier_name}</span>
                </div>

                {/* Step 4: Pickup Request */}
                <div className="pt-4 border-t border-taupe/10 space-y-3">
                  <h3 className="font-medium text-espresso">Pickup</h3>
                  
                  {!isPickupRequested ? (
                    <button
                      onClick={handleRequestPickup}
                      disabled={isPending}
                      className="w-full py-2 px-4 rounded-lg bg-sage text-white text-sm hover:bg-sage/90 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                      Request Pickup
                    </button>
                  ) : (
                    <div className="text-sm bg-cream-soft p-3 rounded-lg border border-taupe/10 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-espresso-soft">Status</span>
                        <span className="font-medium">Requested</span>
                      </div>
                      {order.shiprocket_pickup_scheduled_date && (
                        <div className="flex justify-between">
                          <span className="text-espresso-soft">Scheduled Date</span>
                          <span>{new Date(order.shiprocket_pickup_scheduled_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 5: Documents */}
                <div className="pt-4 border-t border-taupe/10 space-y-3">
                  <h3 className="font-medium text-espresso">Documents</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {!hasLabel ? (
                      <button
                        onClick={handleGenerateLabel}
                        disabled={isPending}
                        className="py-2 px-3 rounded-lg bg-cream text-espresso text-xs hover:bg-cream-soft border border-taupe/20 transition-colors text-center"
                      >
                        Generate Label
                      </button>
                    ) : (
                      <a
                        href={order.shiprocket_label_url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-lg bg-sage/10 text-sage border border-sage/30 text-xs hover:bg-sage/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Open Label
                      </a>
                    )}

                    {!isPickupRequested ? (
                      <button disabled className="py-2 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs border border-gray-200 cursor-not-allowed text-center">
                        Manifest (Requires Pickup)
                      </button>
                    ) : !hasManifest ? (
                      <button
                        onClick={handleGenerateManifest}
                        disabled={isPending}
                        className="py-2 px-3 rounded-lg bg-cream text-espresso text-xs hover:bg-cream-soft border border-taupe/20 transition-colors text-center"
                      >
                        Generate Manifest
                      </button>
                    ) : (
                      <a
                        href={order.shiprocket_manifest_url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-lg bg-sage/10 text-sage border border-sage/30 text-xs hover:bg-sage/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Print Manifest
                      </a>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
