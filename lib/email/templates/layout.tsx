import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Img,
  Text,
  Hr,
  Link,
} from "@react-email/components";

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

/**
 * Shared brand wrapper for every Cozy Craft transactional email.
 * Keeps the header logo, footer, and color palette consistent without
 * repeating HTML boilerplate in every template.
 */
export function EmailLayout({ children, previewText }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        {previewText && (
          // Gmail / Apple Mail preview snippet — hidden from visible body
          <meta name="x-apple-disable-message-reformatting" />
        )}
      </Head>
      <Body
        style={{
          backgroundColor: "#FAF6EF",
          fontFamily:
            "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#3E2C22",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Hidden preview text */}
        {previewText && (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              maxHeight: 0,
              opacity: 0,
            }}
          >
            {previewText}
          </div>
        )}

        <Container
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "40px 24px 32px",
          }}
        >
          {/* Logo */}
          <Img
            src="https://www.cozycrafts.shop/assets/logo.png"
            width={160}
            alt="Cozy Craft"
            style={{ display: "block", margin: "0 auto 32px" }}
          />

          {/* Slot */}
          {children}

          {/* Footer */}
          <Hr style={{ margin: "36px 0 24px", borderColor: "#EAE2D6" }} />
          <Text
            style={{
              fontSize: 14,
              color: "#3E2C22",
              textAlign: "center",
              lineHeight: "1.6",
              margin: "0 0 16px",
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Made by hand, packed with care, and sent with love. ♡
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#6B5648",
              textAlign: "center",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Questions? Email us at{" "}
            <Link
              href="mailto:hello@cozycrafts.shop"
              style={{ color: "#9BAA8C", textDecoration: "underline" }}
            >
              hello@cozycrafts.shop
            </Link>
            <br />
            Cozy Craft · Ramaipatti, Mirzapur, 231001, Uttar Pradesh, India
            <br />
            <Link href="https://www.cozycrafts.shop/" style={{ color: "#9BAA8C", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
              www.cozycrafts.shop
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
