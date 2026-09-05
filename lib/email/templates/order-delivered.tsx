import * as React from "react";
import { Heading, Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://cozycraft.example";

export function OrderDeliveredEmail({ order }: { order: OrderForEmail }) {
  // If the order has only 1 unique item, link directly to it.
  // Otherwise, link to the first item (or general shop, if you prefer).
  const reviewUrl =
    order.items.length > 0 && order.items[0].productSlug
      ? `${SITE}/product/${order.items[0].productSlug}#reviews`
      : `${SITE}/shop`;

  return (
    <EmailLayout previewText="Your package has been delivered! We hope you love it.">
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Delivered! 📦
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 12px", lineHeight: "1.6" }}>
        Your order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> has been marked as delivered.
      </Text>
      <Text style={{ color: "#6B5648", margin: "0 0 28px", lineHeight: "1.6" }}>
        We pour our hearts into every piece, and we hope it brings a little extra coziness to your home.
        Once you've had a chance to settle in with it, we'd love to hear your thoughts.
      </Text>

      <Button
        href={reviewUrl}
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
        Leave a Review
      </Button>
    </EmailLayout>
  );
}
