import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay/client";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  couponCode: z.string().optional(),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    email: z.string().email(),
    addressLine: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  }),
  paymentMethod: z.enum(["RAZORPAY", "CARD", "COD"]).default("RAZORPAY"),
});

export async function POST(req: NextRequest) {
  // ── 1. Validate body ──────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, address, couponCode, paymentMethod } = parsed.data;
  const supabase = getSupabaseServerClient();

  // ── 2. Re-fetch real product data (never trust client prices) ─────────────
  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, active, images:product_images(url, position)")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products could not be found" },
      { status: 400 }
    );
  }

  // ── 3. Check stock and build order items ──────────────────────────────────
  let subtotal = 0;
  const orderItems: {
    product_id: string;
    variant_id?: string;
    product_name_snapshot: string;
    product_image_snapshot: string | null;
    unit_price_snapshot: number;
    quantity: number;
    line_total: number;
  }[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId) as
      | {
          id: string;
          name: string;
          price: number;
          active: boolean;
          images: { url: string; position: number }[];
        }
      | undefined;

    if (!product || !product.active) {
      return NextResponse.json(
        { error: `Product ${item.productId} is unavailable` },
        { status: 400 }
      );
    }

    // Build inventory query — variant-aware
    let invQuery = supabase
      .from("inventory")
      .select("stock")
      .eq("product_id", item.productId);

    if (item.variantId) {
      invQuery = invQuery.eq("variant_id", item.variantId);
    } else {
      invQuery = invQuery.is("variant_id", null);
    }

    const { data: inv } = await invQuery.maybeSingle();

    if (!inv || inv.stock < item.quantity) {
      return NextResponse.json(
        { error: `${product.name} is out of stock` },
        { status: 409 }
      );
    }

    const sortedImages = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position
    );
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      product_id: product.id,
      variant_id: item.variantId,
      product_name_snapshot: product.name,
      product_image_snapshot: sortedImages[0]?.url ?? null,
      unit_price_snapshot: product.price,
      quantity: item.quantity,
      line_total: lineTotal,
    });
  }

  // ── 4. Resolve coupon ────────────────────────────────────────────────────
  let discount = 0;
  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .eq("active", true)
      .maybeSingle();

    if (
      coupon &&
      subtotal >= coupon.min_order_amount &&
      (!coupon.max_uses || coupon.used_count < coupon.max_uses) &&
      (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
    ) {
      discount =
        coupon.discount_type === "percentage"
          ? subtotal * (coupon.discount_value / 100)
          : coupon.discount_value;
    }
  }

  const shippingFee = subtotal - discount >= 499 ? 0 : 49;
  const codFee = paymentMethod === "COD" ? 0 : 0; // Configurable COD fee. Currently ₹0
  const total = Math.max(subtotal - discount + shippingFee + codFee, 0);

  // ── 5. Upsert customer record ─────────────────────────────────────────────
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      email: address.email,
      phone: address.phone,
      full_name: address.fullName,
    })
    .select()
    .single();

  if (customerError) {
    console.error("Customer insertion failed:", customerError);
    // Continue anyway without linking a customer if we can't create one.
  }

  // ── 6. Generate order number (atomic via DB function) ─────────────────────
  const { data: orderNumberRow, error: rpcError } = await supabase.rpc("next_order_number");
  if (rpcError || !orderNumberRow) {
    console.error("Order number generation failed:", rpcError);
    return NextResponse.json(
      { error: "Could not generate order number. Please try again." },
      { status: 500 }
    );
  }
  const publicOrderNumber = orderNumberRow as unknown as string;

  // ── 7. Create order row ───────────────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      public_order_number: publicOrderNumber,
      customer_id: customer?.id ?? null,
      subtotal,
      discount,
      shipping_fee: shippingFee,
      total,
      shipping_address_snapshot: address,
      payment_method: paymentMethod,
      cod_fee: codFee,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Order creation failed:", orderError);
    return NextResponse.json(
      { error: "Could not create order. Please try again." },
      { status: 500 }
    );
  }

  await supabase
    .from("order_items")
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

  // ── 9. Handle COD Branch ──────────────────────────────────────────────────
  if (paymentMethod === "COD") {
    // For COD, the payment is pending until delivery. 
    // We do NOT create a Razorpay order.
    // However, we still need a row in the payments table or we can just rely on orders.payment_status.
    // Existing schema might expect a payment row. If so, we could insert a dummy one, or better yet, just leave it to the orders table.
    
    // Trigger order confirmation email logic manually because there is no Razorpay webhook for COD.
    // Usually webhooks do this, but for COD we must trigger it here.
    // We will call sendOrderEmail or insert an email_log row.
    await supabase.from("email_log").insert({
      order_id: order.id,
      trigger: "ORDER_CONFIRMED",
      status: "pending"
    });
    
    // In production, you might fire a background job here. The cron will pick up the pending email log anyway,
    // but typically you'd trigger it directly or rely on the cron. We'll let the cron or direct call handle it.
    
    return NextResponse.json({
      orderId: order.id,
      publicOrderNumber: order.public_order_number,
      subtotal,
      discount,
      shippingFee,
      codFee,
      total,
      paymentMethod,
    });
  }

  // ── 10. Create Razorpay order (Online Payment) ────────────────────────────
  // NOTE: steps 5-10 are not wrapped in a single Postgres transaction.
  // If the Razorpay call below fails, the order row will be orphaned.
  // TODO (launch hardening): wrap steps 5-10 in a Postgres function called via supabase.rpc().
  let razorpayOrder: { id: string; amount: number; currency: string };
  try {
    const razorpay = getRazorpayClient();
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: order.public_order_number,
    }) as { id: string; amount: number; currency: string };
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    // Mark the order as failed so it's not silently orphaned
    await supabase
      .from("orders")
      .update({ status: "PAYMENT_FAILED" })
      .eq("id", order.id);
    return NextResponse.json(
      { error: "Payment gateway error. Please try again." },
      { status: 502 }
    );
  }

  // ── 11. Record pending payment ────────────────────────────────────────────
  await supabase.from("payments").insert({
    order_id: order.id,
    razorpay_order_id: razorpayOrder.id,
    amount: total,
  });

  return NextResponse.json({
    orderId: order.id,
    publicOrderNumber: order.public_order_number,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    subtotal,
    discount,
    shippingFee,
    codFee,
    total,
    paymentMethod,
  });
}

