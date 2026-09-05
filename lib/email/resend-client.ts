import { Resend } from "resend";

let resendInstance: Resend | null = null;

/**
 * Singleton Resend client getter — server-only.
 * Initialized lazily at runtime to avoid build failures when RESEND_API_KEY is not yet configured.
 */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Please configure it in your environment variables."
    );
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Lazy proxy so existing `resend.emails.send(...)` calls continue to work seamlessly
 * without triggering module evaluation errors during build time.
 */
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const client = getResendClient();
    const value = Reflect.get(client, prop);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
