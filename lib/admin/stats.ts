// lib/admin/stats.ts
// Centralized business logic for identifying order revenue and status categories.

export type RawOrder = {
  id: string;
  total: number | string;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  customer_id?: string | null;
};

/**
 * Valid Prepaid Orders:
 * - Payment Method is online (RAZORPAY, CARD, PREPAID)
 * - Payment Status must be explicitly successful ('CAPTURED' or 'AUTHORIZED')
 * - Order Status must not be explicitly cancelled or refunded
 */
export function isQualifyingPrepaidOrder(order: RawOrder): boolean {
  const method = order.payment_method || "PREPAID"; // Fallback for old orders
  if (method === "COD") return false;

  // 1 & 2: Payment pending or failed -> false. Must be successful.
  if (order.payment_status !== "CAPTURED" && order.payment_status !== "AUTHORIZED") {
    return false;
  }

  // 4 & 5: Must not be CANCELLED or REFUNDED
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return false;
  }

  return true;
}

/**
 * Valid COD Orders (Expected Revenue):
 * - Payment Method is COD
 * - Order Status is confirmed or progressing (not pending/cancelled/refunded)
 */
export function isQualifyingCodOrder(order: RawOrder): boolean {
  if (order.payment_method !== "COD") return false;

  const validStatuses = [
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  return validStatuses.includes(order.status);
}

/**
 * Active Revenue Orders:
 * The order is either a valid prepaid or valid COD order.
 */
export function isQualifyingActiveOrder(order: RawOrder): boolean {
  return isQualifyingPrepaidOrder(order) || isQualifyingCodOrder(order);
}

/**
 * Cancelled Orders:
 * The order was explicitly cancelled.
 */
export function isCancelledOrder(order: RawOrder): boolean {
  return order.status === "CANCELLED";
}

/**
 * Refunded Orders:
 * The order was explicitly refunded.
 */
export function isRefundedOrder(order: RawOrder): boolean {
  return order.status === "REFUNDED";
}

/**
 * Extracts unique customer IDs from a list of orders.
 */
export function getUniqueCustomerIds(orders: RawOrder[]): string[] {
  const ids = new Set<string>();
  for (const o of orders) {
    if (o.customer_id) {
      ids.add(o.customer_id);
    }
  }
  return Array.from(ids);
}

/**
 * Aggregates revenue securely.
 */
export function calculateRevenue(orders: RawOrder[]): number {
  return orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
}
