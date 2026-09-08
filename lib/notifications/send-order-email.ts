import { resend } from "@/lib/email/resend-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { renderEmailForTrigger, type EmailTrigger } from "@/lib/email/render";
import type { OrderForEmail } from "@/lib/email/templates/types";

export async function sendOrderEmail(orderId: string, trigger: EmailTrigger) {
  const supabase = getSupabaseServerClient();

  // ── Idempotency guard ────────────────────────────────────────────────────
  // Check if a 'sent' email already exists for this (order_id, trigger) pair.
  // The partial unique index (uidx_email_log_order_trigger_sent) enforces this
  // at the DB level too, but checking first avoids a wasted round-trip.
  const { data: existingSent } = await supabase
    .from("email_log")
    .select("id")
    .eq("order_id", orderId)
    .eq("trigger", trigger)
    .eq("status", "sent")
    .maybeSingle();

  if (existingSent) {
    console.log(`[send-order-email] Skipping duplicate — already sent ${trigger} for order ${orderId}`);
    return;
  }

  // ── 1. Create the initial pending log entry ──────────────────────────────
  // Use upsert to handle the race condition where two concurrent callers both
  // pass the guard above before either has written a 'sent' row.
  const { data: logRow, error: logInsertError } = await supabase
    .from("email_log")
    .insert({ order_id: orderId, trigger, status: "pending" })
    .select()
    .single();

  if (logInsertError || !logRow) {
    // If the error is a unique constraint violation it means the webhook already
    // sent this email in a concurrent request — safe to skip.
    if (logInsertError?.code === "23505") {
      console.log(`[send-order-email] Skipping — concurrent send for ${trigger} on order ${orderId}`);
      return;
    }
    console.error(`Failed to create email_log for order ${orderId}, trigger ${trigger}`, logInsertError);
    return;
  }

  try {
    // ── 2. Fetch all necessary data ────────────────────────────────────────
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*), customers(email, full_name)")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Order not found for email");

    const customer = order.customers as { email: string; full_name: string };

    // Generate tracking token
    const { generateOrderToken } = await import("@/lib/crypto");
    const trackingToken = generateOrderToken(order.public_order_number);

    // Determine refund context for cancellation emails
    const isCancelledWithPayment =
      trigger === "ORDER_CANCELLED" && order.payment_status === "CAPTURED";

    const orderData: OrderForEmail = {
      publicOrderNumber: order.public_order_number,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingFee: Number(order.shipping_fee),
      customerEmail: customer.email,
      customerName: customer.full_name || "there",
      awbNumber: order.awb_number,
      courierName: order.courier_name,
      estimatedDeliveryDate: order.estimated_delivery_date,
      paymentMethod: order.payment_method,
      codFee: Number(order.cod_fee ?? 0),
      trackingToken,
      // If this is a cancellation of a paid order, surface refund context
      refundAmount: isCancelledWithPayment ? Number(order.total) : null,
      items: order.order_items.map((item: any) => ({
        id: item.id,
        productName: item.product_name_snapshot,
        productImage: item.product_image_snapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price_snapshot),
        lineTotal: Number(item.line_total),
      })),
    };

    // ── 3. Render and send ─────────────────────────────────────────────────
    const { subject, react } = renderEmailForTrigger(trigger, orderData);

    const textFallback = `Order ${order.public_order_number} Update: ${subject}\n\nTrack your order here: https://www.cozycrafts.shop/track-order?order=${order.public_order_number}&token=${trackingToken}\n\nThank you for choosing Cozy Craft!`;

    const result = await resend.emails.send({
      from: "Cozy Craft <orders@cozycrafts.shop>",
      replyTo: "k7616168@gmail.com",
      to: customer.email,
      subject,
      react,
      text: textFallback,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    // ── 4. Mark success (idempotent: the partial unique index prevents dupes) ─
    await supabase
      .from("email_log")
      .update({
        status: "sent",
        resend_message_id: result.data?.id,
        sent_at: new Date().toISOString(),
        attempts: logRow.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", logRow.id);
  } catch (err) {
    // CRITICAL: An email failure must NEVER throw back up into the caller.
    // The webhook/order flow that called this must keep succeeding regardless.
    console.error(`Email send failed for order ${orderId}, trigger ${trigger}`, err);
    await supabase
      .from("email_log")
      .update({
        status: "failed",
        error: String(err),
        attempts: logRow.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", logRow.id);
  }
}
