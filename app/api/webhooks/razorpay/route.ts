import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";

/**
 * Razorpay webhook handler — authoritative source of truth.
 * Works even if the browser tab closed before /verify was called.
 *
 * Register this URL in the Razorpay dashboard:
 *   https://yourdomain.com/api/webhooks/razorpay
 * Subscribed to: payment.captured, payment.failed
 */
export async function POST(req: NextRequest) {
  // ── Read raw body BEFORE any parsing — required for signature verification ─
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // ── Verify webhook signature ──────────────────────────────────────────────
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event: string;
    payload: {
      payment: {
        entity: {
          id: string;
          order_id: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // ── payment.captured ──────────────────────────────────────────────────────
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    // Shared idempotency ledger check
    const eventId = payment.id ?? `${event.event}-${Date.now()}`;
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({ source: "razorpay", event_id: eventId, payload: event as any });
    
    if (insertError) {
      // Unique constraint violation = we've already processed this exact event.
      return NextResponse.json({ received: true, duplicate: true });
    }

    const { data: existing } = await supabase
      .from("payments")
      .select("status, order_id")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();

    if (existing?.status !== "CAPTURED") {
      await supabase
        .from("payments")
        .update({
          razorpay_payment_id: payment.id,
          status: "CAPTURED",
          raw_webhook_payload: event as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", payment.order_id);

      if (existing?.order_id) {
        await supabase
          .from("orders")
          .update({
            status: "PAID",
            payment_status: "CAPTURED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.order_id);
          
        await supabase.rpc("log_status_change", {
          p_order_id: existing.order_id,
          p_status_type: "payment_status",
          p_old_value: existing.status, // previous payment status
          p_new_value: "CAPTURED",
          p_source: "razorpay_webhook",
        });

        await supabase.rpc("log_status_change", {
          p_order_id: existing.order_id,
          p_status_type: "order_status",
          p_old_value: "PENDING_PAYMENT",
          p_new_value: "PAID",
          p_source: "razorpay_webhook",
        });

        await sendOrderEmail(existing.order_id, "ORDER_CONFIRMED");

        // TODO (launch hardening): decrement inventory stock for each order_item
        // inside a Postgres transaction or function to avoid race conditions.
      }
    }
    
    await supabase.from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("source", "razorpay").eq("event_id", eventId);
  }

  // ── payment.failed ────────────────────────────────────────────────────────
  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity;
    
    // Shared idempotency ledger check
    const eventId = payment.id ?? `${event.event}-${Date.now()}`;
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({ source: "razorpay", event_id: eventId, payload: event as any });
      
    if (insertError) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const { data: paymentRow } = await supabase
      .from("payments")
      .select("order_id, status")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();

    // Only update if not already in a terminal state
    if (paymentRow && paymentRow.status !== "CAPTURED") {
      await supabase
        .from("payments")
        .update({
          status: "FAILED",
          raw_webhook_payload: event as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", payment.order_id);

      if (paymentRow.order_id) {
        await supabase
          .from("orders")
          .update({
            status: "PAYMENT_FAILED",
            payment_status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentRow.order_id)
          .neq("status", "PAID"); // never downgrade a PAID order
          
        await supabase.rpc("log_status_change", {
          p_order_id: paymentRow.order_id,
          p_status_type: "payment_status",
          p_old_value: paymentRow.status,
          p_new_value: "FAILED",
          p_source: "razorpay_webhook",
        });
        
        await sendOrderEmail(paymentRow.order_id, "PAYMENT_FAILED");
      }
    }
    
    await supabase.from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("source", "razorpay").eq("event_id", eventId);
  }

  return NextResponse.json({ received: true });
}
