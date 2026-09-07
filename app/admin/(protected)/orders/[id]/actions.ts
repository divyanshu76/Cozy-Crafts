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
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) {
      return { success: false, error: "Order not found" };
    }
    if (order.status !== "PAID" && order.status !== "CONFIRMED") {
      return { success: false, error: "Only paid/confirmed orders can be shipped" };
    }

    const srOrder = await createShiprocketOrder(order as unknown as OrderWithItems);
    const awbResult = await assignAwb(srOrder.shipment_id);
    await schedulePickup(srOrder.shipment_id);

    await supabase.from("orders").update({
      shiprocket_order_id: srOrder.order_id.toString(),
      shiprocket_shipment_id: srOrder.shipment_id.toString(),
      awb_number: awbResult.awb_code,
      courier_name: awbResult.courier_name,
      shipping_status: "PICKUP_SCHEDULED",
      status: "PROCESSING",
    }).eq("id", orderId);

    await supabase.rpc("log_status_change", {
      p_order_id: orderId,
      p_status_type: "shipping_status",
      p_old_value: "NOT_SHIPPED",
      p_new_value: "PICKUP_SCHEDULED",
      p_source: "admin_manual",
    });
    
    await supabase.rpc("log_status_change", {
      p_order_id: orderId,
      p_status_type: "order_status",
      p_old_value: order.status,
      p_new_value: "PROCESSING",
      p_source: "admin_manual",
    });

    await sendOrderEmail(orderId, "ORDER_PACKED");
    return { success: true };
  } catch (err: any) {
    console.error("Shipment creation failed", err);
    // Surface the actual Shiprocket error message (e.g. auth failure, invalid pickup location)
    const detail = err?.message ?? "Unknown error";
    return { 
      success: false, 
      error: `Shiprocket error: ${detail}`,
    };
  }
}
