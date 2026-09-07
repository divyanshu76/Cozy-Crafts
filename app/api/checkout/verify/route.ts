import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing required payment fields" },
      { status: 400 }
    );
  }

  // ── Verify HMAC signature ─────────────────────────────────────────────────
  const keySecret = (
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_SECRET
  )?.trim();

  if (!keySecret) {
    console.error("[checkout/verify] Missing RAZORPAY_KEY_SECRET on server");
    return NextResponse.json(
      { error: "Payment verification configuration error" },
      { status: 500 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json(
      { error: "Payment verification failed — invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // ── Update payment row (idempotent — skip if already CAPTURED) ───────────
  await supabase
    .from("payments")
    .update({
      razorpay_payment_id,
      razorpay_signature,
      status: "CAPTURED",
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpay_order_id)
    .neq("status", "CAPTURED");

  // ── Update order status ───────────────────────────────────────────────────
  const { data: payment } = await supabase
    .from("payments")
    .select("order_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (payment) {
    await supabase
      .from("orders")
      .update({
        status: "PAID",
        payment_status: "CAPTURED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id)
      .neq("status", "PAID");
  }

  return NextResponse.json({ success: true });
}
