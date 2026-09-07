import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  orderNumber: z.string().min(5),
  contact: z.string().min(5), // email or phone
});

/**
 * Normalize an Indian phone number to bare 10-digit form.
 * Strips whitespace, +91, country code 91, and leading 0.
 * If it looks like an email (contains @), returns lowercased as-is.
 */
const normalizeContact = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export async function POST(req: NextRequest) {
  // ── Rate limiting: 5 attempts per IP per minute ───────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const allowed = await checkRateLimit(`track-order:${ip}`, {
    max: 5,
    windowSeconds: 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const { orderNumber, contact } = parsed.data;
    const normalizedInput = normalizeContact(contact);
    const supabase = getSupabaseServerClient();

    // ── Fetch order + customer ────────────────────────────────────────────────
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        public_order_number,
        status,
        payment_status,
        shipping_status,
        awb_number,
        courier_name,
        estimated_delivery_date,
        total,
        created_at,
        shipping_address_snapshot,
        order_items(
          product_name_snapshot,
          product_image_snapshot,
          quantity,
          unit_price_snapshot
        ),
        order_status_history(
          status_type,
          new_value,
          created_at,
          source
        )
      `)
      .eq("public_order_number", orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found. Please check the number." },
        { status: 404 }
      );
    }

    // Verify contact info
    const addr = order.shipping_address_snapshot as { phone: string; email: string };
    const orderPhone = normalizeContact(addr.phone || "");
    const orderEmail = (addr.email || "").toLowerCase();

    if (normalizedInput !== orderPhone && normalizedInput !== orderEmail) {
      return NextResponse.json(
        { error: "Contact information does not match the order." },
        { status: 401 }
      );
    }

    // Filter out internal system changes for the customer-facing timeline
    const timeline = (order.order_status_history as any[])
      .filter((h) => h.source !== "admin_manual")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((h) => ({
        type: h.status_type,
        status: h.new_value,
        timestamp: h.created_at,
      }));

    // ── Map items to the shape the frontend OrderResult type expects ──────────
    const items = (order.order_items as any[]).map((i) => ({
      name: i.product_name_snapshot,
      image: i.product_image_snapshot ?? null,
      quantity: i.quantity,
      price: Number(i.unit_price_snapshot),
    }));

    return NextResponse.json({
      orderNumber: order.public_order_number,
      orderStatus: order.status,
      paymentStatus: order.payment_status,
      shippingStatus: order.shipping_status,
      awbNumber: order.awb_number ?? null,
      courierName: order.courier_name ?? null,
      estimatedDeliveryDate: order.estimated_delivery_date ?? null,
      total: Number(order.total),
      createdAt: order.created_at,
      items,
      timeline,
    });
  } catch (err: any) {
    console.error("[track-order] server error:", err);
    return NextResponse.json(
      { error: "Server error retrieving order", details: err?.message },
      { status: 500 }
    );
  }
}
