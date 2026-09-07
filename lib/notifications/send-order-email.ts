import { resend } from "@/lib/email/resend-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { renderEmailForTrigger, type EmailTrigger } from "@/lib/email/render";
import type { OrderForEmail } from "@/lib/email/templates/types";

export async function sendOrderEmail(orderId: string, trigger: EmailTrigger) {
  const supabase = getSupabaseServerClient();

  // 1. Create the initial pending log entry
  const { data: logRow } = await supabase
    .from("email_log")
    .insert({ order_id: orderId, trigger, status: "pending" })
    .select()
    .single();

  if (!logRow) {
    console.error(`Failed to create email_log for order ${orderId}, trigger ${trigger}`);
    return;
  }

  try {
    // 2. Fetch all necessary data
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
      items: order.order_items.map((item: any) => ({
        id: item.id,
        productName: item.product_name_snapshot,
        productImage: item.product_image_snapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price_snapshot),
        lineTotal: Number(item.line_total),
      })),
    };

    // 3. Render and send
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

    // 4. Mark success
    await supabase
      .from("email_log")
      .update({
        status: "sent",
        resend_message_id: result.data?.id,
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
