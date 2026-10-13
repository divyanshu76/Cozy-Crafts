/**
 * Shipping policy — single authoritative source.
 *
 * Slabs are evaluated in order; the first matching rule wins.
 * `minSubtotal` is inclusive, `maxSubtotal` is exclusive (or Infinity for the
 * last slab so it catches everything above the free-shipping threshold).
 *
 * Business context:
 *   - Customer shipping charge is what the customer pays.
 *   - Actual carrier cost (Shiprocket rate) is separate and NOT derived here.
 *   - Free shipping ≥ ₹499 does NOT mean Shiprocket delivery is free to merchant.
 *
 * To change the policy, edit ONLY this array. Do not duplicate thresholds elsewhere.
 */
export const SHIPPING_SLABS: ReadonlyArray<{
  minSubtotal: number;   // inclusive
  maxSubtotal: number;   // exclusive
  fee: number;
}> = [
  { minSubtotal: 1,   maxSubtotal: 199, fee: 149 },
  { minSubtotal: 199, maxSubtotal: 499, fee: 99  },
  { minSubtotal: 499, maxSubtotal: Infinity, fee: 0 },
];

/** Threshold above which shipping is free. Derived from slabs — never hardcoded separately. */
export const FREE_SHIPPING_THRESHOLD = SHIPPING_SLABS.find((s) => s.fee === 0)?.minSubtotal ?? 499;

/** Legacy alias for backward compatibility with UI components (e.g. CartDrawer free delivery bar) */
export const DELIVERY_FEE_THRESHOLD = FREE_SHIPPING_THRESHOLD;

/**
 * Calculates the customer-facing shipping charge from the merchandise subtotal.
 *
 * The subtotal passed here is the pre-discount merchandise total.
 * Free-shipping eligibility is checked against the pre-discount subtotal
 * (preserves existing behaviour: discounts do not affect shipping tier).
 *
 * Returns 0 for a subtotal of 0 (empty cart guard).
 */
export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  for (const slab of SHIPPING_SLABS) {
    if (subtotal >= slab.minSubtotal && subtotal < slab.maxSubtotal) {
      return slab.fee;
    }
  }
  // Fallback — should never be reached if slabs cover [1, ∞)
  return 0;
}
