"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createShiprocketOrder,
  assignAwb,
  schedulePickup,
  type OrderWithItems,
} from "@/lib/shiprocket/client";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";

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
      if (order.status !== "PAID" && order.status !== "PROCESSING") {
        return { success: false, error: "Prepaid orders must be PAID or PROCESSING to be shipped." };
      }
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
    } catch (apiErr: any) {
      // Shiprocket API failed → release lock so admin can retry
      await supabase
        .from("orders")
        .update({ shipment_lock: null })
        .eq("id", orderId);

      console.error("Shiprocket createOrder failed", apiErr);
      const detail = apiErr?.message ?? "Unknown error";
      return { success: false, error: `Shiprocket error: ${detail}` };
    }

    // ── Step 5: Assign AWB + schedule pickup ──────────────────────────────
    let awbResult: Awaited<ReturnType<typeof assignAwb>>;
    try {
      awbResult = await assignAwb(srOrder.shipment_id);
      await schedulePickup(srOrder.shipment_id);
    } catch (postApiErr: any) {
      // AWB/pickup failed but the SR order exists. Write what we have and
      // clear the lock — admin can follow up in the Shiprocket panel.
      await supabase.from("orders").update({
        shiprocket_order_id: srOrder.order_id.toString(),
        shiprocket_shipment_id: srOrder.shipment_id.toString(),
        shipment_lock: null,
        shipping_status: "PICKUP_SCHEDULED",
        status: "PROCESSING",
      }).eq("id", orderId);

      console.error("Shiprocket AWB/pickup failed", postApiErr);
      const detail = postApiErr?.message ?? "Unknown error";
      return {
        success: false,
        error: `Order created in Shiprocket but AWB/pickup failed: ${detail}. Check Shiprocket panel.`,
      };
    }

    // ── Step 6: Write results + clear lock atomically ─────────────────────
    await supabase.from("orders").update({
      shiprocket_order_id:    srOrder.order_id.toString(),
      shiprocket_shipment_id: srOrder.shipment_id.toString(),
      awb_number:             awbResult.awb_code,
      courier_name:           awbResult.courier_name,
      shipping_status:        "PICKUP_SCHEDULED",
      status:                 "PROCESSING",
      shipment_lock:          null, // release lock
    }).eq("id", orderId);

    await supabase.rpc("log_status_change", {
      p_order_id:   orderId,
      p_status_type: "shipping_status",
      p_old_value:  "NOT_SHIPPED",
      p_new_value:  "PICKUP_SCHEDULED",
      p_source:     "admin_manual",
    });

    await supabase.rpc("log_status_change", {
      p_order_id:   orderId,
      p_status_type: "order_status",
      p_old_value:  order.status,
      p_new_value:  "PROCESSING",
      p_source:     "admin_manual",
    });

    await sendOrderEmail(orderId, "ORDER_PACKED");
    return { success: true };

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

