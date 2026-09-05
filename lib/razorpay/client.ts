import Razorpay from "razorpay";

/**
 * Razorpay SDK instance — SERVER ONLY.
 * Never import in "use client" files. The key_secret must never reach the browser.
 */
export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
