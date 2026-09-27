import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.error("[webhooks/shiprocket] Missing SHIPROCKET_WEBHOOK_SECRET on server");
      return NextResponse.json(
        { error: "Webhook secret not configured on server." },
        { status: 500 }
      );
    }

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const currentStatus = payload.current_status;
    const awb = payload.awb;
    const shiprocketOrderId = payload.order_id?.toString();

    if (!currentStatus || (!awb && !shiprocketOrderId)) {
      return NextResponse.json({ received: true, ignored: "Missing required fields" });
    }

    const supabase = getSupabaseServerClient();

    const eventId = `shiprocket-${awb || shiprocketOrderId}-${currentStatus}-${Date.now()}`;
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({ source: "shiprocket", event_id: eventId, payload });

    if (insertError) {
      // Event already processed
    }

    let query = supabase.from("orders").select("id, shipping_status");
    if (awb) {
      query = query.eq("awb_number", awb);
    } else {
      query = query.eq("shiprocket_order_id", shiprocketOrderId);
    }

    const { data: order, error: orderError } = await query.maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ received: true, ignored: "Order not found" });
    }

    // Only update shipping_status. Do NOT touch master 'status'.
    if (order.shipping_status !== currentStatus) {
      await supabase
        .from("orders")
        .update({
          shipping_status: currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      await supabase.rpc("log_status_change", {
        p_order_id: order.id,
        p_status_type: "shipping_status",
        p_old_value: order.shipping_status || "UNSHIPPED",
        p_new_value: currentStatus,
        p_source: "shiprocket_webhook",
      });
    }

    await supabase.from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("source", "shiprocket").eq("event_id", eventId);

    return NextResponse.json({ received: true, updated: true });
  } catch (error) {
    console.error("[webhooks/shiprocket] Error processing webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
