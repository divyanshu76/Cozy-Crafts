import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";
import type { EmailTrigger } from "@/lib/email/render";

import crypto from "crypto";

// Prevents Next.js from caching this route
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron/retry-failed-emails] CRON_SECRET is not configured.");
    return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const secretBuffer = Buffer.from(cronSecret);
    const tokenBuffer = Buffer.from(token);

    if (secretBuffer.length !== tokenBuffer.length || !crypto.timingSafeEqual(secretBuffer, tokenBuffer)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const tag = "[cron/retry-failed-emails]";

  // ── Fetch rows that need processing ──────────────────────────────────────
  // We retry two categories:
  //   1. status = 'failed'   — previous attempt errored; retried after 5 min
  //   2. status = 'pending'  — stuck (e.g. COD legacy path or timed-out
  //                           serverless function); retried after 10 min
  //                           to avoid double-sends on in-flight rows
  const cutoffFailed  = new Date(Date.now() - 1000 * 60 *  5).toISOString(); // 5 min
  const cutoffPending = new Date(Date.now() - 1000 * 60 * 10).toISOString(); // 10 min

  const { data: emailsToRetry } = await supabase
    .from("email_log")
    .select("id, order_id, trigger, attempts, status")
    .or(
      `and(status.eq.failed,updated_at.lt.${cutoffFailed},attempts.lt.3),` +
      `and(status.eq.pending,updated_at.lt.${cutoffPending},attempts.lt.3)`
    )
    .limit(50); // batch size per run

  if (!emailsToRetry || emailsToRetry.length === 0) {
    console.log(tag, "No emails to retry.");
    return NextResponse.json({ processed: 0 });
  }

  console.log(tag, `Retrying ${emailsToRetry.length} email(s)`);

  let processedCount = 0;
  for (const log of emailsToRetry) {
    try {
      // Reset to pending so sendOrderEmail() can claim it and transition it.
      // sendOrderEmail() checks for an existing 'sent' row first (idempotency
      // guard) and skips if already delivered — safe for concurrent runs.
      await supabase
        .from("email_log")
        .update({ status: "pending", error: null, updated_at: new Date().toISOString() })
        .eq("id", log.id);

      await sendOrderEmail(log.order_id, log.trigger as EmailTrigger);
      processedCount++;
    } catch (err) {
      console.error(tag, `Failed to retry email_log ${log.id}:`, err);
    }
  }

  return NextResponse.json({ processed: processedCount });
}
