import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";
import {
  normalizeIndianPhone,
  isValidIndianMobile,
  normalizeEmail,
} from "@/lib/contact-utils";

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
    phone: z
      .string()
      .transform((val) => normalizeIndianPhone(val) ?? val.trim())
      .refine((val) => isValidIndianMobile(val), {
        message: "Enter a valid 10-digit Indian mobile number",
      }),
    email: z
      .string()
      .transform((val) => val.trim().toLowerCase())
      .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Enter a valid email address",
      }),
    addressLine: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  }),
  paymentMethod: z.enum(["RAZORPAY", "CARD", "COD"]).default("RAZORPAY"),
});

export async function POST(req: NextRequest) {
  const tag = "[checkout/create-order]";

  try {
    // ── 1. Validate body ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      console.error(tag, "Validation failed:", parsed.error.flatten());
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

    if (productsError) {
      console.error(tag, "step=product_fetch", { code: productsError.code, message: productsError.message });
      return NextResponse.json({ error: "Could not verify products. Please try again." }, { status: 500 });
    }
    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products could not be found" }, { status: 400 });
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

      let { data: inv, error: invError } = await invQuery.maybeSingle();

      if (invError) {
        console.error(tag, "step=inventory_fetch", { productId: item.productId, code: invError.code, message: invError.message });
      }

      // Fallback: if product only has inventory assigned to variants and no variant was specified
      if (!inv && !item.variantId) {
        const { data: fallbackInv } = await supabase
          .from("inventory")
          .select("stock, variant_id")
          .eq("product_id", item.productId)
          .order("stock", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackInv) {
          inv = fallbackInv;
          item.variantId = fallbackInv.variant_id ?? undefined;
        }
      }

      if (!inv || inv.stock < item.quantity) {
        return NextResponse.json(
          { error: `${product.name} is out of stock or has insufficient quantity` },
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

    const shippingFee = 0; // Shipping is always free
    const codFee = paymentMethod === "COD" ? 0 : 0; // Configurable COD fee. Currently ₹0
    const total = Math.max(subtotal - discount + shippingFee + codFee, 0);

    // ── 5. Canonical contact details ─────────────────────────────────────────
    const canonicalPhone = normalizeIndianPhone(address.phone) || address.phone.replace(/\D/g, "");
    const canonicalEmail = address.email.trim().toLowerCase();
    const canonicalFullName = address.fullName.trim();

    const canonicalAddress = {
      ...address,
      fullName: canonicalFullName,
      phone: canonicalPhone,
      email: canonicalEmail,
    };

    // Upsert customer record with canonical values
    let customerId: string | null = null;
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        email: canonicalEmail,
        phone: canonicalPhone,
        full_name: canonicalFullName,
      })
      .select("id")
      .single();

    if (customerError) {
      // Log but don't fail — customer linkage is nice-to-have, not required
      console.error(tag, "step=customer_insert", { code: customerError.code, message: customerError.message });
    } else {
      customerId = customer.id;
    }

    // ── 6. Generate order number (atomic via DB function) ─────────────────────
    const { data: orderNumberRow, error: rpcError } = await supabase.rpc("next_order_number");
    if (rpcError || !orderNumberRow) {
      console.error(tag, "step=order_number_rpc", { code: rpcError?.code, message: rpcError?.message });
      return NextResponse.json(
        { error: "Could not generate order number. Please try again." },
        { status: 500 }
      );
    }
    const publicOrderNumber = orderNumberRow as unknown as string;

    // ── 7. Create order row with canonical address snapshot ───────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        public_order_number: publicOrderNumber,
        customer_id: customerId,
        subtotal,
        discount,
        shipping_fee: shippingFee,
        total,
        shipping_address_snapshot: canonicalAddress,
        payment_method: paymentMethod,
        cod_fee: codFee,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(tag, "step=order_insert", { code: orderError?.code, message: orderError?.message, details: orderError?.details });
      return NextResponse.json(
        { error: "Could not create order. Please try again." },
        { status: 500 }
      );
    }

    // ── 8. Insert order items ─────────────────────────────────────────────────
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

    if (itemsError) {
      console.error(tag, "step=order_items_insert", { code: itemsError.code, message: itemsError.message });
      // Order exists but items failed — mark as failed to prevent silent orphan
      await supabase.from("orders").update({ status: "PAYMENT_FAILED" }).eq("id", order.id);
      return NextResponse.json({ error: "Could not save order items. Please try again." }, { status: 500 });
    }

    // ── 9. Handle COD Branch ──────────────────────────────────────────────────
    if (paymentMethod === "COD") {
      // For COD: mark order as CONFIRMED immediately (payment on delivery)
      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: "CONFIRMED" })
        .eq("id", order.id);

      if (statusError) {
        console.error(tag, "step=cod_status_update", { code: statusError.code, message: statusError.message });
        // Don't fail — order is created, status update is secondary
      }

      // Send confirmation email via the idempotent sendOrderEmail() path.
      // This creates an email_log row (pending → sent/failed) and handles
      // all retry logic. Fire without await so the HTTP response is not held
      // hostage by the email provider, but errors are still caught and logged.
      sendOrderEmail(order.id, "ORDER_CONFIRMED").catch((err) => {
        console.error(tag, "step=cod_email_send", err);
      });

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
    let razorpayOrder: { id: string; amount: number; currency: string };
    const keyId = (
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID
    )?.trim();

    try {
      const razorpay = getRazorpayClient();
      razorpayOrder = (await razorpay.orders.create({
        amount: Math.round(total * 100), // paise
        currency: "INR",
        receipt: order.public_order_number,
      })) as { id: string; amount: number; currency: string };
    } catch (err: any) {
      const safeReason =
        err?.error?.description ||
        err?.error?.code ||
        err?.message ||
        "Payment gateway initialization failed";

      console.error(tag, "step=razorpay_order_create", {
        reason: safeReason,
        statusCode: err?.statusCode,
        rawError: err,
      });

      // Mark the order as failed so it's not silently orphaned
      await supabase
        .from("orders")
        .update({ status: "PAYMENT_FAILED" })
        .eq("id", order.id);

      return NextResponse.json(
        {
          error: "Payment gateway error. Please try again.",
          details: safeReason,
        },
        { status: 502 }
      );
    }

    // ── 11. Record pending payment ────────────────────────────────────────────
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      razorpay_order_id: razorpayOrder.id,
      amount: total,
    });
    if (paymentError) {
      console.error(tag, "step=payment_insert", { code: paymentError.code, message: paymentError.message });
      // Payment row insert failure is non-fatal at this point — Razorpay webhook will reconcile
    }

    return NextResponse.json({
      orderId: order.id,
      publicOrderNumber: order.public_order_number,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: keyId || null,
      subtotal,
      discount,
      shippingFee,
      codFee,
      total,
      paymentMethod,
    });
  } catch (fatalErr: any) {
    console.error(tag, "step=fatal_unhandled", fatalErr);
    return NextResponse.json(
      {
        error: "Server processing error",
        details: fatalErr?.message || "An unexpected error occurred while preparing your order.",
      },
      { status: 500 }
    );
  }
}
