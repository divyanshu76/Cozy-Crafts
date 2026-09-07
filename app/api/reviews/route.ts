import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerName, rating, reviewBody } = body;

    if (!productId || !customerName?.trim() || !rating || !reviewBody?.trim()) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const db = getSupabaseServerClient();
    
    // We insert the review as pending. The service role key bypasses RLS if necessary, 
    // or we assume anon has insert access depending on RLS. Since we use the admin client here 
    // to ensure it succeeds without auth hurdles for guests, it's safe.
    const { error } = await db.from("reviews").insert({
      product_id: productId,
      customer_name: customerName.trim(),
      rating: ratingNum,
      body: reviewBody.trim(),
      status: "pending",
      verified: false
    });

    if (error) {
      console.error("Failed to submit review:", error);
      return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
