import { Resend } from "resend";

/**
 * Singleton Resend client.
 * Server-only — RESEND_API_KEY must never reach the client bundle.
 */
export const resend = new Resend(process.env.RESEND_API_KEY);
