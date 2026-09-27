"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createShiprocketOrder,
  type OrderWithItems,
} from "@/lib/shiprocket/client";


export async function createShipmentAction(orderId: string) {
  // ── Preflight: verify Shiprocket credentials are configured ──────────────
  const missingVars: string[] = [];
  if (!process.env.SHIPROCKET_EMAIL) missingVars.push("SHIPROCKET_EMAIL");
  if (!process.env.SHIPROCKET_PASSWORD) missingVars.push("SHIPROCKET_PASSWORD");
  if (missingVars.length > 0) {
    return {
      success: false,
      error: `Shiprocket credentials not configured. Add ${missingVars.join(" and ")} to your Vercel environment variables, then redeploy. Also ensure a pickup location named "Primary" exists in Shiprocket Settings → Pickups.`,
    };
  }

  const supabase = getSupabaseServerClient();

  try {
    // ── Step 1: Fetch order with items ────────────────────────────────────
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*, product:product_id(sku, weight, length, breadth, height))")
      .eq("id", orderId)
      .single();

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Fast early exit if already shipped (before acquiring lock)
    if (order.shiprocket_order_id) {
      return { success: false, error: "Shipment already created for this order." };
    }

    // ── Step 2: Validate order eligibility ────────────────────────────────
    if (order.payment_method === "COD") {
      if (order.status !== "CONFIRMED" && order.status !== "PROCESSING") {
        return { success: false, error: "COD orders must be CONFIRMED or PROCESSING to be shipped." };
      }
    } else {
      if (order.status !== "CONFIRMED" && order.status !== "PROCESSING") {
        return { success: false, error: "Prepaid orders must be CONFIRMED or PROCESSING to be shipped." };
      }
    }

    // ── Step 2.5: Validate required shipment fields ───────────────────────
    if (!order.public_order_number) return { success: false, error: "Missing shipment data: order_id" };
    if (!order.created_at) return { success: false, error: "Missing shipment data: order_date" };
    if (order.subtotal == null) return { success: false, error: "Missing shipment data: subtotal" };

    const addr = order.shipping_address_snapshot;
    if (!addr) return { success: false, error: "Missing shipment data: billing/shipping address" };
    if (!addr.fullName) return { success: false, error: "Missing shipment data: customer name" };
    if (!addr.addressLine) return { success: false, error: "Missing shipment data: billing/shipping address" };
    if (!addr.city) return { success: false, error: "Missing shipment data: city" };
    if (!addr.state) return { success: false, error: "Missing shipment data: state" };
    if (!addr.pinCode) return { success: false, error: "Missing shipment data: pincode" };
    if (!addr.phone) return { success: false, error: "Missing shipment data: phone" };
    // Shiprocket technically requires email for adhoc order creation usually, but maybe it's optional for some. Better to enforce if missing.
    if (!addr.email) return { success: false, error: "Missing shipment data: email" };

    if (!order.order_items || order.order_items.length === 0) return { success: false, error: "Missing shipment data: order items" };
    for (const item of order.order_items) {
      if (!item.product_name_snapshot) return { success: false, error: "Missing shipment data: item name" };
      if (!item.quantity) return { success: false, error: "Missing shipment data: units" };
      if (item.unit_price_snapshot == null) return { success: false, error: "Missing shipment data: selling_price" };
      if (!item.product?.sku && !item.product_id) return { success: false, error: "Missing shipment data: SKU" };
    }

    // ── Step 3: Acquire DB-level atomic lock ──────────────────────────────
    //
    // This conditional UPDATE is atomic at the Postgres level. It only
    // succeeds if BOTH conditions are true at the instant of execution:
    //   - shiprocket_order_id IS NULL  (not already shipped)
    //   - shipment_lock IS NULL        (no other request is in progress)
    //
    // Exactly one concurrent request can win; all others get count = 0.
    //
    // Requires migration 0010 to be applied (adds the shipment_lock column).
    const { count: lockCount } = await supabase
      .from("orders")
      .update({ shipment_lock: "ACQUIRING" }, { count: "exact" })
      .eq("id", orderId)
      .is("shiprocket_order_id", null)
      .is("shipment_lock", null);

    if ((lockCount ?? 0) === 0) {
      // Another concurrent request already acquired the lock (or the order
      // was just shipped by a race winner). Abort safely.
      return {
        success: false,
        error: "Shipment creation is already in progress for this order. Please refresh the page.",
      };
    }

    // ── Step 4: Call Shiprocket API ───────────────────────────────────────
    // Lock is held. Any error here must clear the lock so the admin can retry.
    let srOrder: Awaited<ReturnType<typeof createShiprocketOrder>>;
    try {
      srOrder = await createShiprocketOrder(order as unknown as OrderWithItems);
      
      // Safeguard against APIs that return HTTP 200 OK with error payloads.
      if (!srOrder || !srOrder.order_id || !srOrder.shipment_id) {
        const srErrorDetail = (srOrder as any)?.message || JSON.stringify(srOrder);
        throw new Error(`Invalid or incomplete response: ${srErrorDetail}`);
      }
    } catch (apiErr: any) {
      // Shiprocket API failed → release lock so admin can retry
      await supabase
        .from("orders")
        .update({ shipment_lock: null })
        .eq("id", orderId);

      console.error("Shiprocket createOrder failed", apiErr);
      const detail = apiErr?.message ?? "Unknown error";
      return { success: false, error: `Shiprocket API error: ${detail}` };
    }

    // ── Step 5: Write results + clear lock atomically ─────────────────────
    await supabase.from("orders").update({
      shiprocket_order_id:    srOrder.order_id.toString(),
      shiprocket_shipment_id: srOrder.shipment_id.toString(),
      shipment_lock:          null, // release lock
    }).eq("id", orderId);

    // Note: Do NOT change master order.status here as per Phase 3 requirements.
    // Shipping status remains unchanged until webhook receives updates or AWB is manually generated.

    return { success: true, message: `Shipment Created! Order ID: ${srOrder.order_id}, Shipment ID: ${srOrder.shipment_id}` };

  } catch (err: any) {
    // Unexpected error: attempt to release the lock so the admin can retry.
    // This is best-effort — if it fails we log it.
    try {
      await supabase
        .from("orders")
        .update({ shipment_lock: null })
        .eq("id", orderId);
    } catch (cleanupErr) {
      console.error("Failed to release shipment_lock after unexpected error", cleanupErr);
    }

    console.error("Shipment creation failed", err);
    const detail = err?.message ?? "Unknown error";
    return {
      success: false,
      error: `Shiprocket error: ${detail}`,
    };
  }
}

