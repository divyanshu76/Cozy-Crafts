import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://www.cozycrafts.shop";

export function PaymentFailedEmail({ order }: { order: OrderForEmail }) {
  return (
    <EmailLayout previewText="Action Required: Your payment couldn't be processed.">
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Payment unsuccessful 💳
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
        We tried to process the payment for order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong>, but it wasn't successful.
      </Text>
      <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
        Don't worry — your card hasn't been charged, and your order is safe. You can securely retry the payment using the link below to complete your purchase.
      </Text>

      <Button
        href={`${SITE}/checkout`}
        style={{
          display: "block",
          background: "#3E2C22",
          color: "#FAF6EF",
          padding: "13px 28px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
        }}
      >
        Retry Payment
      </Button>
    </EmailLayout>
  );
}
