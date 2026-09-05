import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

/**
 * Razorpay SDK client getter — SERVER ONLY.
 * Never import in "use client" files. The key_secret must never reach the browser.
 *
 * Initialized lazily at runtime only when called, preventing Next.js build-time
 * failures when environment variables are not yet configured.
 */
export function getRazorpayClient(): Razorpay {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are missing. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables."
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}
