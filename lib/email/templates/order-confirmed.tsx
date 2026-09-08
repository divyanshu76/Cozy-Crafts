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

export function OrderConfirmedEmail({ order }: { order: OrderForEmail }) {
  const invoiceLink = `${SITE}/api/invoice?order=${order.publicOrderNumber}&token=${order.trackingToken}`;
  const trackLink = `${SITE}/track-order?order=${order.publicOrderNumber}&token=${order.trackingToken}`;

  return (
    <EmailLayout previewText={`Order ${order.publicOrderNumber} confirmed — thank you!`}>
      <Text style={{ color: "#6B5648", margin: "0 0 16px", fontSize: 16 }}>
        Hi {order.customerName || "there"},
      </Text>
      
      <Text style={{ color: "#6B5648", margin: "0 0 24px", lineHeight: "1.6", fontSize: 16 }}>
        Thank you so much for choosing Cozy Craft. ♡ Your order is confirmed and we're getting your handmade pieces ready with lots of care.
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
        Your order is confirmed 🎉
      </Heading>
      <Text style={{ color: "#9BAA8C", margin: "0 0 24px", fontWeight: "bold", fontSize: 14 }}>
        Order #{order.publicOrderNumber}
      </Text>

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
          <strong>Payment Method:</strong>{" "}
          {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
        </Text>
        <Text style={{ margin: 0, fontSize: 14, color: "#6B5648" }}>
          <strong>Payment Status:</strong>{" "}
          {order.paymentMethod === "COD" ? "Pending" : "Paid"}
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
            href={trackLink}
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
              marginRight: "12px",
            }}
          >
            Track Your Order
          </Button>
          <Button
            href={invoiceLink}
            style={{
              display: "inline-block",
              backgroundColor: "#FAF6EF",
              border: "1px solid #3E2C22",
              color: "#3E2C22",
              padding: "14px 28px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Download Invoice
          </Button>
        </Column>
      </Row>
    </EmailLayout>
  );
}
