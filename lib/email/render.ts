import * as React from "react";
import type { OrderForEmail } from "./templates/types";
import { OrderConfirmedEmail } from "./templates/order-confirmed";
import { OrderPackedEmail } from "./templates/order-packed";
import { OrderShippedEmail } from "./templates/order-shipped";
import { OrderOutForDeliveryEmail } from "./templates/order-out-for-delivery";
import { OrderDeliveredEmail } from "./templates/order-delivered";
import { PaymentFailedEmail } from "./templates/payment-failed";
import { OrderCancelledEmail } from "./templates/order-cancelled";
import { RefundInitiatedEmail } from "./templates/refund-initiated";

export type EmailTrigger =
  | "ORDER_CONFIRMED"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "PAYMENT_FAILED"
  | "ORDER_CANCELLED"
  | "REFUND_INITIATED";

export function renderEmailForTrigger(
  trigger: EmailTrigger,
  order: OrderForEmail
): { subject: string; react: React.ReactElement } {
  switch (trigger) {
    case "ORDER_CONFIRMED":
      return {
        subject: "Your Cozy Craft order is confirmed",
        react: React.createElement(OrderConfirmedEmail, { order }),
      };
    case "ORDER_PACKED":
      return {
        subject: "Your order is packed and ready",
        react: React.createElement(OrderPackedEmail, { order }),
      };
    case "ORDER_SHIPPED":
      return {
        subject: "Your order is on its way",
        react: React.createElement(OrderShippedEmail, { order }),
      };
    case "ORDER_OUT_FOR_DELIVERY":
      return {
        subject: "Arriving today",
        react: React.createElement(OrderOutForDeliveryEmail, { order }),
      };
    case "ORDER_DELIVERED":
      return {
        subject: "Delivered! We hope you love it",
        react: React.createElement(OrderDeliveredEmail, { order }),
      };
    case "PAYMENT_FAILED":
      return {
        subject: "We couldn't process your payment",
        react: React.createElement(PaymentFailedEmail, { order }),
      };
    case "ORDER_CANCELLED":
      return {
        subject: "Your order has been cancelled",
        react: React.createElement(OrderCancelledEmail, { order }),
      };
    case "REFUND_INITIATED":
      return {
        subject: "Your refund is on its way",
        react: React.createElement(RefundInitiatedEmail, { order }),
      };
  }
}
