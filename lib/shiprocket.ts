/**
 * Shiprocket API Client
 *
 * Provides a reusable, authenticated client for Shiprocket API.
 * Securely manages credentials and token caching.
 */

let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Authenticates with the Shiprocket API and returns a valid Bearer token.
 * Reuses the token if it is still valid.
 */
export async function getShiprocketToken(): Promise<string> {
  const now = Date.now();
  
  // Reuse token if valid (buffer of 5 minutes to prevent edge-case expiry)
  if (cachedToken && tokenExpiryTime && now < tokenExpiryTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error("Shiprocket credentials are not configured.");
  }

  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Shiprocket authentication failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.token) {
    throw new Error("Shiprocket authentication successful but no token received.");
  }

  cachedToken = data.token;
  tokenExpiryTime = now + 24 * 60 * 60 * 1000;

  return data.token;
}
