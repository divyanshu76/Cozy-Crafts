import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://cozycraft.example";

export function OrderPackedEmail({ order }: { order: OrderForEmail }) {
  return (
    <EmailLayout previewText="Your Cozy Craft order is packed and ready for pickup!">
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Your order is packed ✨
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
        Order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> has been carefully
        packed and is waiting for the courier to pick it up.
      </Text>
      <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
        We&apos;ll send you another email with your tracking number as soon as it&apos;s on its
        way. Handmade things are worth the wait — we promise it&apos;ll be beautiful. 🤍
      </Text>

      <Button
        href={`${SITE}/track-order?order=${order.publicOrderNumber}`}
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
        Track Your Order
      </Button>
    </EmailLayout>
  );
}
