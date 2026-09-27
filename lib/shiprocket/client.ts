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
    const bodyText = await res.text();
    let detail = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.errors) {
        const errMap = Object.entries(parsed.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        detail = `${parsed.message || "Invalid Data"} - ${errMap}`;
      } else if (parsed.message) {
        detail = parsed.message;
      }
    } catch (e) {
      // not JSON, fallback to raw text
    }
    throw new Error(`Shiprocket API error (${path}): ${res.status} ${detail}`);
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

interface ShiprocketPickupLocation {
  id: number;
  pickup_location: string;
  is_primary_location: number;
}

interface ShiprocketPickupResponse {
  data: {
    shipping_address: ShiprocketPickupLocation[];
  };
}

/**
 * Resolves the correct pickup location name from the Shiprocket account.
 */
async function resolvePickupLocation(): Promise<string> {
  const configured = process.env.SHIPROCKET_PICKUP_LOCATION;
  
  let response: ShiprocketPickupResponse;
  try {
    response = await shiprocketFetch<ShiprocketPickupResponse>("/settings/company/pickup", { method: "GET" });
  } catch (err) {
    throw new Error("Shiprocket pickup location is not configured correctly. Please verify the configured pickup location in Shiprocket.");
  }

  const locations = response?.data?.shipping_address || [];

  if (locations.length === 0) {
    throw new Error("Shiprocket pickup location is not configured correctly. Please verify the configured pickup location in Shiprocket.");
  }

  if (configured) {
    const match = locations.find(loc => loc.pickup_location === configured);
    if (match) return match.pickup_location;
    throw new Error(`Shiprocket pickup location is invalid. Configured location '${configured}' does not exist in Shiprocket.`);
  }

  // Fallback to the primary location
  const primary = locations.find(loc => loc.is_primary_location === 1) || locations[0];
  return primary.pickup_location;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a Shiprocket order for a paid CozyCraft order.
 *
 * The pickup_location value is dynamically resolved from the API.
 *
 * Weight/dimensions come from per-product DB values (migration 0009).
 * Old products without explicit values fall back to sensible defaults.
 */
export async function createShiprocketOrder(
  order: OrderWithItems
): Promise<ShiprocketOrderResponse> {
  const addr = order.shipping_address_snapshot;

  // Resolve the actual pickup location from Shiprocket
  const pickupLocation = await resolvePickupLocation();

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

  // Cast addr to any to gracefully handle future or past schema changes
  const addrAny = addr as any;
  const rawFirstName = addrAny.firstName || addrAny.first_name;
  const rawLastName = addrAny.lastName || addrAny.last_name;

  let firstName = "Customer";
  let lastName = "-";

  if (rawFirstName && rawLastName) {
    // Case A: First and last name stored separately
    firstName = rawFirstName;
    lastName = rawLastName;
  } else {
    // Case B: Single full name
    const nameParts = (addr.fullName || "").trim().split(/\s+/);
    if (nameParts.length > 0 && nameParts[0] !== "") {
      firstName = nameParts[0];
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-";
    }
  }

  return shiprocketFetch<ShiprocketOrderResponse>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id:              order.public_order_number,
      order_date:            new Date(order.created_at)
                               .toISOString()
                               .slice(0, 19)
                               .replace("T", " "),
      pickup_location:       pickupLocation,
      channel_id:            "12153199",
      billing_customer_name: firstName,
      billing_last_name:     lastName,
      billing_address:       addr.addressLine,
      billing_city:          addr.city,
      billing_pincode:       addr.pinCode,
      billing_state:         addr.state,
      billing_country:       "India",
      billing_email:         addr.email,
      billing_phone:         addr.phone,
      shipping_is_billing:   true,
      shipping_customer_name: firstName,
      shipping_last_name:     lastName,
      shipping_address:       addr.addressLine,
      shipping_city:          addr.city,
      shipping_pincode:       addr.pinCode,
      shipping_state:         addr.state,
      shipping_country:       "India",
      shipping_email:         addr.email,
      shipping_phone:         addr.phone,
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

export interface CourierCompany {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string | number;
  etd: string;
  rating: number;
  cod: number;
  is_surface: boolean;
}

export interface CourierServiceabilityResponse {
  data: {
    available_courier_companies: CourierCompany[];
  };
}

/**
 * Fetch available couriers for a Shiprocket order.
 */
export async function getCourierServiceability(orderId: string): Promise<CourierServiceabilityResponse> {
  return shiprocketFetch<CourierServiceabilityResponse>(`/courier/serviceability/?order_id=${orderId}`, {
    method: "GET",
  });
}

/**
 * Assigns an AWB (Air Waybill) number to a shipment using a specific courier.
 */
export async function assignAwb(shipmentId: number, courierId?: number): Promise<AwbResponse> {
  const body: any = { shipment_id: shipmentId };
  if (courierId) {
    body.courier_id = courierId;
  }
  
  const data = await shiprocketFetch<{ response: { data: AwbResponse } }>(
    "/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return data.response.data;
}

interface PickupResponse {
  pickup_scheduled_date?: string;
  pickup_token_number?: string;
  response?: string;
}

/**
 * Schedules a pickup for a shipment.
 */
export async function requestPickup(shipmentId: number): Promise<PickupResponse> {
  return shiprocketFetch<PickupResponse>("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

interface LabelResponse {
  label_created: number;
  label_url: string;
}

/**
 * Generates a shipping label for a shipment.
 */
export async function generateLabel(shipmentId: number): Promise<LabelResponse> {
  return shiprocketFetch<LabelResponse>("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

interface ManifestResponse {
  status: number;
  manifest_url: string;
}

/**
 * Generates a manifest for a shipment.
 */
export async function generateManifest(shipmentId: number): Promise<ManifestResponse> {
  return shiprocketFetch<ManifestResponse>("/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

/**
 * Retrieves specific shipment details.
 */
export async function getShipmentDetails(shipmentId: number): Promise<any> {
  return shiprocketFetch<any>(`/shipments/${shipmentId}`, {
    method: "GET",
  });
}
