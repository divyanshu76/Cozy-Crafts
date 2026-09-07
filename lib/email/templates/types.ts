/**
 * Shared type used by every email template.
 * Assembled by sendOrderEmail() from the orders + order_items + customers query.
 */
export interface OrderForEmail {
  publicOrderNumber: string;
  total: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  customerEmail: string;
  customerName: string;
  awbNumber?: string | null;
  courierName?: string | null;
  estimatedDeliveryDate?: string | null;
  cancellationReason?: string | null;
  refundAmount?: number | null;
  paymentMethod?: string;
  codFee?: number;
  items: {
    id: string;
    productName: string;
    productSlug?: string | null;
    productImage?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}
