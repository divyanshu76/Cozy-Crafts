import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { mapCourierStatusToShippingStatus } from "@/lib/shiprocket/status-map";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ⚠️ Verify the exact validation mechanism against your Shiprocket panel's
  // webhook settings before trusting this in production.
  const providedToken = req.headers.get("x-api-key") ?? body.webhook_token;
  if (providedToken !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  // Idempotency: build a stable event id from what Shiprocket sends.
  const eventId = `${body.awb}-${body.current_status}-${body.scan_date ?? body.updated_at ?? Date.now()}`;
  const { error: insertError } = await supabase
    .from("webhook_events")
    .insert({ source: "shiprocket", event_id: eventId, payload: body });
    
  if (insertError) {
    // Unique constraint violation = we've already processed this exact event.
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, shipping_status")
    .eq("awb_number", body.awb)
    .maybeSingle();
    
  if (!order) {
    console.warn("Shiprocket webhook for unknown AWB", body.awb);
    return NextResponse.json({ received: true });
  }

  const newStatus = mapCourierStatusToShippingStatus(body.current_status);
  
  if (newStatus !== order.shipping_status) {
    await supabase.from("orders").update({
      shipping_status: newStatus,
      courier_name: body.courier_name ?? undefined,
      estimated_delivery_date: body.edd ?? undefined,
      updated_at: new Date().toISOString()
    }).eq("id", order.id);

    await supabase.rpc("log_status_change", {
      p_order_id: order.id, 
      p_status_type: "shipping_status",
      p_old_value: order.shipping_status, 
      p_new_value: newStatus, 
      p_source: "shiprocket_webhook",
    });

    if (newStatus === "OUT_FOR_DELIVERY") {
      await sendOrderEmail(order.id, "ORDER_OUT_FOR_DELIVERY");
    } else if (newStatus === "DELIVERED") {
      await sendOrderEmail(order.id, "ORDER_DELIVERED");
    }

    // Terminal state mapping to business order status
    if (newStatus === "DELIVERED") {
      await supabase.from("orders").update({ 
        status: "CONFIRMED",
        updated_at: new Date().toISOString()
      }).eq("id", order.id);
      
      await supabase.rpc("log_status_change", {
        p_order_id: order.id, 
        p_status_type: "order_status",
        p_old_value: "PROCESSING", 
        p_new_value: "CONFIRMED", 
        p_source: "shiprocket_webhook",
      });
    }
  }

  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("source", "shiprocket")
    .eq("event_id", eventId);
    
  return NextResponse.json({ received: true });
}
