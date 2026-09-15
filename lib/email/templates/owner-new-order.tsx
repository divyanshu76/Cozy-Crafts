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

export function OwnerNewOrderEmail({ order }: { order: OrderForEmail }) {
  const adminLink = `${SITE}/admin/orders/${order.publicOrderNumber}`;

  return (
    <EmailLayout previewText={`New Order ${order.publicOrderNumber} received!`}>
      <Text style={{ color: "#6B5648", margin: "0 0 16px", fontSize: 16 }}>
        Hi Team,
      </Text>
      
      <Text style={{ color: "#6B5648", margin: "0 0 24px", lineHeight: "1.6", fontSize: 16 }}>
        Great news! A new order has been placed {order.paymentMethod === "COD" ? "with Cash on Delivery" : "and successfully paid"}. Here are the details:
      </Text>

      <Heading
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 24,
          fontWeight: 600,
          color: "#3E2C22",
          margin: "0 0 8px",
        }}
      >
        🎉 New Order #{order.publicOrderNumber}
      </Heading>

      <Section
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #EAE2D6",
          borderRadius: 12,
          padding: "20px",
          marginBottom: 24,
        }}
      >
        <Text style={{ margin: "0 0 8px", fontSize: 14, color: "#6B5648" }}>
          <strong>Customer:</strong> {order.customerName} ({order.customerEmail})
        </Text>
        <Text style={{ margin: "0 0 8px", fontSize: 14, color: "#6B5648" }}>
          <strong>Payment Method:</strong> {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
        </Text>
        <Text style={{ margin: 0, fontSize: 14, color: "#6B5648" }}>
          <strong>Payment Status:</strong> {order.paymentMethod === "COD" ? "Pending" : "Paid"}
        </Text>
        {order.shippingAddress && (
          <>
            <Hr style={{ borderColor: "#EAE2D6", margin: "16px 0" }} />
            <Text style={{ margin: "0 0 8px", fontSize: 14, color: "#6B5648" }}>
              <strong>Shipping Address:</strong>
            </Text>
            <Text style={{ margin: 0, fontSize: 14, color: "#6B5648", lineHeight: "1.5" }}>
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.addressLine}<br />
              {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pinCode].filter(Boolean).join(", ")}
            </Text>
          </>
        )}
      </Section>

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
        <Text style={{ margin: "0 0 16px", fontSize: 16, fontWeight: "bold", color: "#3E2C22" }}>
          Order Items
        </Text>
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
        
        <Row style={{ marginBottom: 8 }}>
          <Column style={{ fontSize: 14, color: "#6B5648" }}>Subtotal</Column>
          <Column align="right" style={{ fontSize: 14, color: "#6B5648" }}>
            ₹{order.subtotal.toLocaleString("en-IN")}
          </Column>
        </Row>
        
        {order.discount > 0 && (
          <Row style={{ marginBottom: 8 }}>
            <Column style={{ fontSize: 14, color: "#9BAA8C" }}>Discount</Column>
            <Column align="right" style={{ fontSize: 14, color: "#9BAA8C" }}>
              −₹{order.discount.toLocaleString("en-IN")}
            </Column>
          </Row>
        )}
        
        <Row style={{ marginBottom: 8 }}>
          <Column style={{ fontSize: 14, color: "#6B5648" }}>Shipping</Column>
          <Column align="right" style={{ fontSize: 14, color: "#9BAA8C", fontWeight: "bold" }}>
            {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}
          </Column>
        </Row>
        
        {order.paymentMethod === "COD" && order.codFee && order.codFee > 0 ? (
          <Row style={{ marginBottom: 8 }}>
            <Column style={{ fontSize: 14, color: "#6B5648" }}>COD Fee</Column>
            <Column align="right" style={{ fontSize: 14, color: "#6B5648" }}>
              ₹{order.codFee.toLocaleString("en-IN")}
            </Column>
          </Row>
        ) : null}
        
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
            href={adminLink}
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
            View Order in Admin
          </Button>
        </Column>
      </Row>
    </EmailLayout>
  );
}
