import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://www.cozycrafts.shop";

export function OrderCancelledEmail({ order }: { order: OrderForEmail }) {
  const wasPaid = order.paymentMethod !== "COD" && (order.refundAmount ?? 0) > 0;

  return (
    <EmailLayout previewText="Your Cozy Craft order has been cancelled.">
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Order Cancelled
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
        Hi {order.customerName}, your order{" "}
        <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong>{" "}
        has been cancelled.
      </Text>

      {order.cancellationReason && (
        <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
          <strong>Reason:</strong> {order.cancellationReason}
        </Text>
      )}

      <Text style={{ color: "#6B5648", margin: "0 0 8px", lineHeight: "1.6" }}>
        <strong>Order Total:</strong> ₹{order.total.toLocaleString("en-IN")}
      </Text>

      {wasPaid ? (
        <Text
          style={{
            color: "#6B5648",
            margin: "0 0 28px",
            lineHeight: "1.6",
            background: "#FEF3C7",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #FDE68A",
          }}
        >
          <strong>Payment &amp; Refund:</strong> Your payment of ₹{(order.refundAmount ?? order.total).toLocaleString("en-IN")} was received.
          Our team will review your cancellation and process any eligible refund to your original payment method.
          You will receive a confirmation once the refund has been processed. If you have any questions,
          please contact us at{" "}
          <a href="mailto:hello@cozycrafts.shop" style={{ color: "#7C9A7E" }}>
            hello@cozycrafts.shop
          </a>{" "}
          with your order number #{order.publicOrderNumber}.
        </Text>
      ) : (
        <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
          No payment was charged for this order. We hope to welcome you back soon.
        </Text>
      )}

      <Button
        href={`${SITE}/shop`}
        style={{
          display: "block",
          background: "#F0EBE3",
          color: "#3E2C22",
          padding: "13px 28px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
          border: "1px solid #CBB8A2",
        }}
      >
        Continue Shopping
      </Button>
    </EmailLayout>
  );
}
