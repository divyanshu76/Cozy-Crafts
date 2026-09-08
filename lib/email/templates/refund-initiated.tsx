import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://www.cozycrafts.shop";

export function RefundInitiatedEmail({ order }: { order: OrderForEmail }) {
  return (
    <EmailLayout previewText="Your refund has been processed.">
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Refund Processed 💸
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
        A refund {order.refundAmount ? `of ₹${order.refundAmount.toLocaleString("en-IN")} ` : ""}for order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> has been processed from our end.
      </Text>
      <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
        Depending on your bank or payment provider, it typically reflects in your original payment method once settled. If you have any questions, please contact us at{" "}
        <a href="mailto:hello@cozycrafts.shop" style={{ color: "#7C9A7E" }}>
          hello@cozycrafts.shop
        </a>.
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
