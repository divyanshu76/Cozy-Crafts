import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = "product-images";

/** Verify the caller is an authenticated admin. */
async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in route handlers */ },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "Unauthenticated" };

  const adminDb = getSupabaseServerClient();
  const { data: profile } = await adminDb
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") return { ok: false, error: "Forbidden" };
  return { ok: true };
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthenticated" ? 401 : 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type "${file.type}" is not allowed. Use PNG, JPG, JPEG, or WEBP.` },
      { status: 400 }
    );
  }

  // Validate extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `File extension ".${ext}" is not allowed. Use .png, .jpg, .jpeg, or .webp.` },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File "${file.name}" exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` },
      { status: 400 }
    );
  }

  // Build unique path
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${productId}/${timestamp}-${safeName}`;

  // Upload using service role (bypasses RLS)
  const adminDb = getSupabaseServerClient();

  // Ensure bucket exists (idempotent)
  const { error: bucketError } = await adminDb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
  });
  // Ignore "already exists" error
  if (bucketError && !bucketError.message.includes("already exists") && !bucketError.message.includes("Duplicate")) {
    console.error("Bucket creation error:", bucketError);
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminDb.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = adminDb.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}

/** Delete an uploaded image — called during cleanup on failure. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { path } = await req.json() as { path: string };
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const adminDb = getSupabaseServerClient();
  await adminDb.storage.from(BUCKET).remove([path]);

  return NextResponse.json({ ok: true });
}
