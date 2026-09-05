import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";

// Prevents Next.js from caching this route
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Optional cron secret auth (configured in Vercel settings)
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const { data: failedEmails } = await supabase
    .from("email_log")
    .select("id, order_id, trigger, attempts")
    .eq("status", "failed")
    .lt("attempts", 3)
    // Don't retry immediately; wait a bit
    .lt("updated_at", new Date(Date.now() - 1000 * 60 * 5).toISOString())
    .limit(50); // batch size

  if (!failedEmails || failedEmails.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processedCount = 0;
  for (const log of failedEmails) {
    // Reset back to pending so we can call sendOrderEmail again
    await supabase
      .from("email_log")
      .update({ status: "pending", error: null })
      .eq("id", log.id);

    // This will overwrite the same email_log row or create a new one
    // We already passed the attempts guard.
    await sendOrderEmail(log.order_id, log.trigger as any);
    processedCount++;
  }

  return NextResponse.json({ processed: processedCount });
}
