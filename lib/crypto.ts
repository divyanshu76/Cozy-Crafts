import crypto from "crypto";

// Use SUPABASE_SERVICE_ROLE_KEY or a dedicated TRACKING_SECRET if you prefer.
const getSecret = () => {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Token verification may fail.");
    return "fallback-dev-secret-cozy-craft";
  }
  return secret;
};

/**
 * Generate an HMAC token for a given order number.
 * This ensures URLs are secure without needing a database lookup.
 */
export function generateOrderToken(orderNumber: string): string {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(orderNumber).digest("hex");
}

/**
 * Verify an HMAC token for a given order number.
 */
export function verifyOrderToken(orderNumber: string, token: string): boolean {
  if (!token) return false;
  const expectedToken = generateOrderToken(orderNumber);
  
  try {
    const a = Buffer.from(expectedToken);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}
