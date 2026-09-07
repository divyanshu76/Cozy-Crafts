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
  const keyId = (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID
  )?.trim();
  const keySecret = (
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_SECRET
  )?.trim();

  // Safe diagnostic logging (never logs secret values)
  console.log("[razorpay/client] credential status:", {
    razorpay_key_present: !!keyId,
    razorpay_key_prefix: keyId ? keyId.substring(0, 8) : null,
    razorpay_secret_present: !!keySecret,
    razorpay_secret_length: keySecret ? keySecret.length : 0,
    webhook_secret_present: !!process.env.RAZORPAY_WEBHOOK_SECRET,
  });

  if (!keyId || !keySecret) {
    throw new Error(
      `Razorpay credentials missing on server (key_present: ${!!keyId}, secret_present: ${!!keySecret}). Please configure NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables.`
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

