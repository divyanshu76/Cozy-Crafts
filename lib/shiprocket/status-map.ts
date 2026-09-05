/**
 * Maps Shiprocket / courier status strings to CozyCraft's internal
 * shipping_status enum values.
 *
 * Shiprocket status strings vary by courier and are not exhaustively
 * documented in one place — treat this as a starting point and refine it
 * once you see real webhook payloads in your Shiprocket dashboard.
 */
export type ShippingStatus =
  | "NOT_SHIPPED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RTO_INITIATED"
  | "RTO_DELIVERED"
  | "LOST_OR_DAMAGED"
  | "CANCELLED";

const STATUS_MAP: Record<string, ShippingStatus> = {
  "PICKUP SCHEDULED":    "PICKUP_SCHEDULED",
  "PICKUP QUEUED":       "PICKUP_SCHEDULED",
  "PICKED UP":           "PICKED_UP",
  "IN TRANSIT":          "IN_TRANSIT",
  "OUT FOR DELIVERY":    "OUT_FOR_DELIVERY",
  "DELIVERED":           "DELIVERED",
  "RTO INITIATED":       "RTO_INITIATED",
  "RTO DELIVERED":       "RTO_DELIVERED",
  "LOST":                "LOST_OR_DAMAGED",
  "DAMAGED":             "LOST_OR_DAMAGED",
  "CANCELLED":           "CANCELLED",
  // Common courier-specific aliases
  "SHIPMENT PICKED UP":  "PICKED_UP",
  "TRANSIT":             "IN_TRANSIT",
  "OUT FOR DEL":         "OUT_FOR_DELIVERY",
};

export function mapCourierStatusToShippingStatus(
  courierStatus: string
): ShippingStatus {
  const normalized = courierStatus.trim().toUpperCase();
  // Exact match first
  if (STATUS_MAP[normalized]) return STATUS_MAP[normalized];
  // Partial match fallback for long courier-specific strings
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (normalized.includes(key)) return value;
  }
  // Safe fallback — never throw on an unmapped status
  return "IN_TRANSIT";
}
