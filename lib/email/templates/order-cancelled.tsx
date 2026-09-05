import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://cozycraft.example";

export function OrderCancelledEmail({ order }: { order: OrderForEmail }) {
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
        Your order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> has been cancelled.
      </Text>
      
      {order.cancellationReason && (
        <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
          <strong>Reason:</strong> {order.cancellationReason}
        </Text>
      )}

      <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
        If a charge was made to your account, a refund has been initiated and will reflect in your original payment method within 5–7 business days. We hope to welcome you back soon.
      </Text>

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
          border: "1px solid #CBB8A2"
        }}
      >
        Continue Shopping
      </Button>
    </EmailLayout>
  );
}
