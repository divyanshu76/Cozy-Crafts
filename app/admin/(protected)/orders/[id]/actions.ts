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
  } catch (err) {
    console.error("Shipment creation failed", err);
    return { 
      success: false, 
      error: "Could not create shipment. Try again, or check Shiprocket panel status." 
    };
  }
}
