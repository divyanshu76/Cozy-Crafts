import * as React from "react";
import {
  Heading,
  Text,
  Button,
  Section,
  Row,
  Column,
  Hr,
  Img,
} from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderForEmail } from "./types";
import { getPublicImageUrl } from "@/lib/email/images";

const SITE = "https://www.cozycrafts.shop";

export function OrderCancelledEmail({ order }: { order: OrderForEmail }) {
  const isPrepaid = order.paymentMethod !== "COD";

  return (
    <EmailLayout previewText={`Order ${order.publicOrderNumber} has been cancelled.`}>
      <Text style={{ color: "#6B5648", margin: "0 0 16px", fontSize: 16 }}>
        Hi {order.customerName || "there"},
      </Text>
      
      <Text style={{ color: "#6B5648", margin: "0 0 24px", lineHeight: "1.6", fontSize: 16 }}>
        Your order <strong style={{ color: "#3E2C22" }}>#{order.publicOrderNumber}</strong> has been cancelled.
      </Text>

      {order.cancellationReason && (
        <Text style={{ color: "#6B5648", margin: "0 0 24px", lineHeight: "1.6", fontSize: 16 }}>
          <strong>Reason:</strong> {order.cancellationReason}
        </Text>
      )}

      {isPrepaid ? (
        <Text
          style={{
            color: "#6B5648",
            margin: "0 0 28px",
            lineHeight: "1.6",
            background: "#FEF3C7",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #FDE68A",
            fontSize: 16,
          }}
        >
          Your cancellation request has been recorded. If a refund is applicable, it will be processed according to our refund policy.
        </Text>
      ) : (
        <Text
          style={{
            color: "#6B5648",
            margin: "0 0 28px",
            lineHeight: "1.6",
            background: "#F3F4F6",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            fontSize: 16,
          }}
        >
          Your COD order has been cancelled. No payment was collected.
        </Text>
      )}

      {/* Order items */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #EAE2D6",
          borderRadius: 12,
          padding: "20px",
          marginBottom: 24,
        }}
      >
        <Heading style={{ fontSize: 16, color: "#3E2C22", margin: "0 0 16px" }}>
          Cancelled Items
        </Heading>
        {order.items.map((item) => {
          const publicImg = getPublicImageUrl(item.productImage);
          return (
            <Row key={item.id} style={{ marginBottom: 16 }}>
              <Column style={{ width: "60px", paddingRight: "16px" }}>
                {publicImg ? (
                  <Img
                    src={publicImg}
                    width="60"
                    height="60"
                    style={{ borderRadius: 8, objectFit: "cover" }}
                    alt={item.productName}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: "#FAF6EF",
                      borderRadius: 8,
                      border: "1px solid #EAE2D6",
                      textAlign: "center",
                      lineHeight: "60px",
                      color: "#7C9A7E",
                      fontSize: 20,
                      fontWeight: "bold",
                    }}
                  >
                    {item.productName.charAt(0).toUpperCase()}
                  </div>
                )}
              </Column>
              <Column style={{ fontSize: 14, color: "#3E2C22", verticalAlign: "middle" }}>
                <Text style={{ margin: "0 0 4px", fontWeight: 600 }}>{item.productName}</Text>
                <Text style={{ margin: 0, color: "#9BAA8C" }}>Qty: {item.quantity}</Text>
              </Column>
              <Column
                align="right"
                style={{ fontSize: 14, color: "#3E2C22", fontWeight: 600, verticalAlign: "middle" }}
              >
                ₹{item.lineTotal.toLocaleString("en-IN")}
              </Column>
            </Row>
          );
        })}
        
        <Hr style={{ borderColor: "#EAE2D6", margin: "16px 0" }} />
        
        <Row>
          <Column style={{ fontSize: 16, fontWeight: 700, color: "#3E2C22" }}>
            Total
          </Column>
          <Column
            align="right"
            style={{ fontSize: 16, fontWeight: 700, color: "#3E2C22" }}
          >
            ₹{order.total.toLocaleString("en-IN")}
          </Column>
        </Row>
      </Section>

      <Row>
        <Column align="center">
          <Button
            href={`${SITE}/shop`}
            style={{
              display: "inline-block",
              backgroundColor: "#3E2C22",
              color: "#FAF6EF",
              padding: "14px 28px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Continue Shopping
          </Button>
        </Column>
      </Row>
    </EmailLayout>
  );
}
