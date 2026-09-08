import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyOrderToken } from "@/lib/crypto";
import {
  normalizeIndianPhone,
  normalizeEmail,
  normalizeContactLookup,
} from "@/lib/contact-utils";

const schema = z.object({
  orderNumber: z.string().min(3),
  contact: z.string().optional(), // email or phone, optional if token is provided
  token: z.string().optional(),
});

const NOT_FOUND_MESSAGE =
  "We couldn't find this order. Please check your order number and the email or phone number used at checkout.";

export async function POST(req: NextRequest) {
  // ── Rate limiting: 10 attempts per IP per minute ──────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const allowed = await checkRateLimit(`track-order:${ip}`, {
    max: 10,
    windowSeconds: 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment before trying again." },
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
    return NextResponse.json(
      { error: "Please enter a valid order number and contact info." },
      { status: 400 }
    );
  }

  try {
    const { orderNumber, contact, token } = parsed.data;

    // Must have either token or contact
    if (!token && (!contact || contact.trim().length === 0)) {
      return NextResponse.json(
        { error: "Please provide the email or phone number used at checkout." },
        { status: 400 }
      );
    }

    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    const supabase = getSupabaseServerClient();

    // ── Fetch order + customer + items ──────────────────────────────────────
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
        customer_id,
        customers(email, phone, full_name),
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
      .eq("public_order_number", cleanOrderNumber)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { error: NOT_FOUND_MESSAGE },
        { status: 404 }
      );
    }

    // ── Verify authorization: Token OR Contact Info ────────────────────────
    let isAuthorized = false;

    // 1. Verify token if present
    if (token) {
      if (verifyOrderToken(order.public_order_number, token.trim())) {
        isAuthorized = true;
      }
    }

    // 2. Verify contact if not yet authorized
    if (!isAuthorized && contact) {
      const lookup = normalizeContactLookup(contact);

      // Parse address snapshot
      let addr: Record<string, any> = {};
      if (order.shipping_address_snapshot) {
        if (typeof order.shipping_address_snapshot === "string") {
          try {
            addr = JSON.parse(order.shipping_address_snapshot);
          } catch {
            addr = {};
          }
        } else if (typeof order.shipping_address_snapshot === "object") {
          addr = order.shipping_address_snapshot;
        }
      }

      const customer = (order.customers as any) || {};

      // Order contact candidates
      const orderPhones = [
        normalizeIndianPhone(addr.phone),
        normalizeIndianPhone(customer.phone),
        (addr.phone || "").replace(/\D/g, ""),
        (customer.phone || "").replace(/\D/g, ""),
      ].filter(Boolean);

      const orderEmails = [
        normalizeEmail(addr.email),
        normalizeEmail(customer.email),
        (addr.email || "").trim().toLowerCase(),
        (customer.email || "").trim().toLowerCase(),
      ].filter(Boolean);

      if (lookup.type === "phone") {
        isAuthorized = orderPhones.some(
          (p) => p === lookup.value || (lookup.value && p.endsWith(lookup.value))
        );
      } else if (lookup.type === "email") {
        isAuthorized = orderEmails.includes(lookup.value);
      } else {
        // Unknown type: compare both phone digits and email
        const digits = contact.replace(/\D/g, "");
        const lower = contact.trim().toLowerCase();
        isAuthorized =
          (digits.length >= 10 && orderPhones.some((p) => p.endsWith(digits.slice(-10)))) ||
          orderEmails.includes(lower);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: NOT_FOUND_MESSAGE },
        { status: 401 }
      );
    }

    // Filter out internal system changes for customer-facing timeline
    const timeline = (order.order_status_history as any[] || [])
      .filter((h) => h.source !== "admin_manual")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((h) => ({
        type: h.status_type,
        status: h.new_value,
        timestamp: h.created_at,
      }));

    // Map items
    const items = (order.order_items as any[] || []).map((i) => ({
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
      { error: "Server error retrieving order. Please try again." },
      { status: 500 }
    );
  }
}
