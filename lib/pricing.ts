export const DELIVERY_FEE_THRESHOLD = 499;
export const STANDARD_DELIVERY_FEE = 9;

/**
 * Server-authoritative utility to calculate the delivery fee based on the order subtotal.
 * Subtotal is the total merchandise amount BEFORE delivery charges.
 */
export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal < DELIVERY_FEE_THRESHOLD) {
    return STANDARD_DELIVERY_FEE;
  }
  return 0;
}
