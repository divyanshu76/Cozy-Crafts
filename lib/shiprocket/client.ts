/**
 * Shiprocket API client.
 *
 * Endpoints verified against Shiprocket docs as of 2026:
 *   POST /v1/external/auth/login
 *   POST /v1/external/orders/create/adhoc
 *   POST /v1/external/courier/assign/awb
 *   POST /v1/external/courier/generate/pickup
 *
 * Token caching: Shiprocket tokens are valid ~240 hours. We cache the token
 * in the `shiprocket_auth_cache` table (single row) with a 220h TTL so we
 * re-authenticate well before expiry without an extra round-trip on every
 * API call.
 *
 * IMPORTANT: This file must only be imported in server-side code
 * (API routes, Server Actions, Server Components).
 * SHIPROCKET_PASSWORD / SHIPROCKET_EMAIL must never reach the client bundle.
 */
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// ── Types ────────────────────────────────────────────────────────────────────
export interface OrderWithItems {
  id: string;
  public_order_number: string;
  subtotal: number;
  created_at: string;
  payment_method: string;
  shipping_address_snapshot: {
    fullName: string;
    phone: string;
    email: string;
    addressLine: string;
    city: string;
    state: string;
    pinCode: string;
  };
  order_items: {
    product_id: string;
    product_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
    product?: {
      sku?: string;
      weight?: number;
      length?: number;
      breadth?: number;
      height?: number;
    } | null;
  }[];
}

interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
}

interface AwbResponse {
  awb_code: string;
  courier_name: string;
  courier_company_id: number;
}

// ── Token management ─────────────────────────────────────────────────────────
async function getShiprocketToken(): Promise<string> {
  const supabase = getSupabaseServerClient();

  const { data: cached } = await supabase
    .from("shiprocket_auth_cache")
    .select("token, expires_at")
    .eq("id", 1)
    .maybeSingle();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return cached.token;
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shiprocket authentication failed: ${res.status} ${body}`);
  }

  const { token } = (await res.json()) as { token: string };

  // 220h TTL — refreshes well before the 240h expiry
  const expiresAt = new Date(Date.now() + 220 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("shiprocket_auth_cache")
    .upsert({ id: 1, token, expires_at: expiresAt });

  return token;
}

// ── Authenticated fetch wrapper ──────────────────────────────────────────────
async function shiprocketFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getShiprocketToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shiprocket API error (${path}): ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a CozyCraft payment_method to the Shiprocket payment_method string.
 *
 * Shiprocket only accepts "COD" or "Prepaid".
 * All known non-COD methods (RAZORPAY, CARD) are Prepaid.
 *
 * An unknown value throws a plain Error (no PII, no secrets) so that
 * createShipmentAction's existing catch blocks release the shipment_lock
 * and surface a clear message to the admin.
 */
function mapPaymentMethod(method: string): "COD" | "Prepaid" {
  switch (method) {
    case "COD":
      return "COD";
    case "RAZORPAY":
    case "CARD":
      return "Prepaid";
    default:
      // Throw — never silently treat unknown values as Prepaid.
      // The message intentionally omits the actual value to avoid
      // accidentally leaking internal data into logs or error surfaces.
      throw new Error("Invalid payment method for shipment creation.");
  }
}

/**
 * Ensures a dimension value sent to Shiprocket is a finite positive number.
 *
 * Guards against: zero, negative, NaN, Infinity.
 * Falls back to the provided default if the value is invalid.
 */
function sanitizeDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a Shiprocket order for a paid CozyCraft order.
 *
 * The pickup_location value ("Primary") must exactly match the name of a
 * pickup location configured in your Shiprocket panel → Settings → Pickup.
 *
 * Weight/dimensions come from per-product DB values (migration 0009).
 * Old products without explicit values fall back to sensible defaults.
 */
export async function createShiprocketOrder(
  order: OrderWithItems
): Promise<ShiprocketOrderResponse> {
  const addr = order.shipping_address_snapshot;

  // ── Dimension / weight calculation ─────────────────────────────────────────
  // Strategy:
  //   weight  → sum of (per-item weight × quantity)
  //   length  → max across all items (longest side of the largest item)
  //   breadth → max across all items
  //   height  → sum of (per-item height × quantity)  (stacked in box)
  // All raw values are sanitized before accumulation so that zero/negative/NaN
  // values in the DB never silently reach Shiprocket.

  let totalWeight = 0;
  let maxLength = 0;
  let maxBreadth = 0;
  let totalHeight = 0;

  const orderItemsPayload = order.order_items.map((item) => {
    // Sanitize each dimension — reject zero/negative/NaN/Infinity, fall back to defaults.
    const w = sanitizeDimension(item.product?.weight ?? 0,  0.2);
    const l = sanitizeDimension(item.product?.length ?? 0,  10);
    const b = sanitizeDimension(item.product?.breadth ?? 0, 10);
    const h = sanitizeDimension(item.product?.height ?? 0,  5);

    totalWeight += w * item.quantity;
    maxLength    = Math.max(maxLength, l);
    maxBreadth   = Math.max(maxBreadth, b);
    totalHeight  += h * item.quantity;

    return {
      name:          item.product_name_snapshot,
      sku:           item.product?.sku || item.product_id, // Fallback to UUID if SKU missing
      units:         item.quantity,
      selling_price: item.unit_price_snapshot,
    };
  });

  // Final sanitization pass — should never be needed if per-item sanitization
  // above is correct, but acts as a last-resort safety net.
  const finalWeight  = sanitizeDimension(totalWeight,  0.2);
  const finalLength  = sanitizeDimension(maxLength,    10);
  const finalBreadth = sanitizeDimension(maxBreadth,   10);
  const finalHeight  = sanitizeDimension(totalHeight,  5);

  return shiprocketFetch<ShiprocketOrderResponse>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id:              order.public_order_number,
      order_date:            new Date(order.created_at)
                               .toISOString()
                               .slice(0, 19)
                               .replace("T", " "),
      pickup_location:       process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: addr.fullName,
      billing_address:       addr.addressLine,
      billing_city:          addr.city,
      billing_pincode:       addr.pinCode,
      billing_state:         addr.state,
      billing_country:       "India",
      billing_email:         addr.email,
      billing_phone:         addr.phone,
      shipping_is_billing:   true,
      payment_method:        mapPaymentMethod(order.payment_method),
      sub_total:             order.subtotal,
      order_items:           orderItemsPayload,
      length:                finalLength,
      breadth:               finalBreadth,
      height:                finalHeight,
      weight:                finalWeight,
    }),
  });
}

/**
 * Assigns an AWB (Air Waybill) number to a shipment.
 * Shiprocket auto-selects the best courier unless you pass courier_id.
 */
export async function assignAwb(shipmentId: number): Promise<AwbResponse> {
  const data = await shiprocketFetch<{ response: { data: AwbResponse } }>(
    "/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentId }),
    }
  );
  return data.response.data;
}

/**
 * Schedules a pickup for a shipment.
 * Shiprocket expects an array of shipment IDs.
 */
export async function schedulePickup(shipmentId: number): Promise<void> {
  await shiprocketFetch("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}
