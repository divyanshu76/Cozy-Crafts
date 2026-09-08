import * as React from "react";
import { Heading, Text, Button, Section, Row, Column } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://www.cozycrafts.shop";

export function OrderShippedEmail({ order }: { order: OrderForEmail }) {
  return (
    <EmailLayout previewText={`Your order #${order.publicOrderNumber} is on its way!`}>
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Your order is on its way 🚚
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 24px", lineHeight: "1.6" }}>
        Order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> has been picked up
        by the courier and is heading to you.
      </Text>

      {(order.awbNumber || order.courierName) && (
        <Section
          style={{
            backgroundColor: "#F0EBE3",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          {order.courierName && (
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ fontSize: 13, color: "#6B5648" }}>Courier</Column>
              <Column
                align="right"
                style={{ fontSize: 13, fontWeight: 600, color: "#3E2C22" }}
              >
                {order.courierName}
              </Column>
            </Row>
          )}
          {order.awbNumber && (
            <Row>
              <Column style={{ fontSize: 13, color: "#6B5648" }}>AWB / Tracking No.</Column>
              <Column
                align="right"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#3E2C22",
                  fontFamily: "monospace",
                }}
              >
                {order.awbNumber}
              </Column>
            </Row>
          )}
        </Section>
      )}

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
