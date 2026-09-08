import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://www.cozycrafts.shop";

export function OrderOutForDeliveryEmail({ order }: { order: OrderForEmail }) {
  const edd = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <EmailLayout previewText="Your Cozy Craft order is out for delivery today!">
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Arriving today 🏡
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
        Order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> is out for
        delivery{edd ? ` — expected today, ${edd}` : ""}.
      </Text>
      <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
        Please keep your phone handy in case the delivery executive tries to reach you.
        Someone should be available to receive the package.
      </Text>

      <Button
        href={`${SITE}/track-order?order=${order.publicOrderNumber}${order.trackingToken ? `&token=${order.trackingToken}` : ""}`}
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
