import * as React from "react";
import {
  Heading,
  Text,
  Button,
  Section,
  Row,
  Column,
  Hr,
} from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";

const SITE = "https://cozycraft.example";

export function OrderConfirmedEmail({ order }: { order: OrderForEmail }) {
  return (
    <EmailLayout previewText={`Order ${order.publicOrderNumber} confirmed — thank you!`}>
      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        Your order is confirmed 🎉
      </Heading>
      <Text style={{ color: "#6B5648", margin: "0 0 24px", lineHeight: "1.6" }}>
        Order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> — thank you for
        shopping handmade with Cozy Craft. We&apos;ll start preparing your items right away.
      </Text>

      <Section
        style={{
          backgroundColor: "#FAF6EF",
          border: "1px solid #EAE2D6",
          borderRadius: 8,
          padding: "16px",
          marginBottom: 20,
        }}
      >
        <Text style={{ margin: "0 0 8px", fontSize: 14, color: "#6B5648" }}>
          <strong>Payment Method:</strong>{" "}
          {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
        </Text>
        <Text style={{ margin: 0, fontSize: 14, color: "#6B5648" }}>
          <strong>Payment Status:</strong>{" "}
          {order.paymentMethod === "COD" ? "Payable on delivery" : "Paid"}
        </Text>
      </Section>

      {/* Order items */}
      <Section
        style={{
          backgroundColor: "#F0EBE3",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        {order.items.map((item) => (
          <Row key={item.id} style={{ marginBottom: 10 }}>
            <Column style={{ fontSize: 13, color: "#3E2C22" }}>
              {item.productName} × {item.quantity}
            </Column>
            <Column
              align="right"
              style={{ fontSize: 13, color: "#3E2C22", fontWeight: 600 }}
            >
              ₹{item.lineTotal.toLocaleString("en-IN")}
            </Column>
          </Row>
        ))}
        <Hr style={{ borderColor: "#CBB8A2", margin: "12px 0" }} />
        {order.discount > 0 && (
          <Row style={{ marginBottom: 4 }}>
            <Column style={{ fontSize: 13, color: "#7A9E7E" }}>Discount</Column>
            <Column align="right" style={{ fontSize: 13, color: "#7A9E7E" }}>
              −₹{order.discount.toLocaleString("en-IN")}
            </Column>
          </Row>
        )}
        <Row style={{ marginBottom: 4 }}>
          <Column style={{ fontSize: 13, color: "#6B5648" }}>Shipping</Column>
          <Column align="right" style={{ fontSize: 13, color: "#6B5648" }}>
            {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}
          </Column>
        </Row>
        {order.paymentMethod === "COD" && order.codFee && order.codFee > 0 ? (
          <Row style={{ marginBottom: 4 }}>
            <Column style={{ fontSize: 13, color: "#6B5648" }}>COD Fee</Column>
            <Column align="right" style={{ fontSize: 13, color: "#6B5648" }}>
              ₹{order.codFee.toLocaleString("en-IN")}
            </Column>
          </Row>
        ) : null}
        <Row>
          <Column style={{ fontSize: 14, fontWeight: 700, color: "#3E2C22" }}>
            Total
          </Column>
          <Column
            align="right"
            style={{ fontSize: 14, fontWeight: 700, color: "#3E2C22" }}
          >
            ₹{order.total.toLocaleString("en-IN")}
          </Column>
        </Row>
      </Section>

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
