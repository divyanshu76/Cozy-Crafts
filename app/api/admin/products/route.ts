import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Verify the caller is an authenticated admin. */
async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
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
  return { ok: true, userId: session.user.id };
}

export interface CreateProductPayload {
  // Basic info
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  sku?: string;
  // Pricing
  price: number;
  compare_at_price?: number;
  // Flags
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  active: boolean;
  // Stock
  stock: number;
  // Variants (colors)
  variants: Array<{ label: string; price_override?: number }>;
  // Images: already uploaded, we just record them
  images: Array<{ url: string; alt_text?: string; position: number }>;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthenticated" ? 401 : 403 });
  }

  const body: CreateProductPayload = await req.json();

  // Server-side validation
  if (!body.name?.trim()) return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  if (!body.slug?.trim()) return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  if (typeof body.price !== "number" || body.price < 0) {
    return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
  }
  if (typeof body.stock !== "number" || body.stock < 0 || !Number.isInteger(body.stock)) {
    return NextResponse.json({ error: "Stock must be a non-negative integer." }, { status: 400 });
  }
  if (body.compare_at_price !== undefined && body.compare_at_price < body.price) {
    return NextResponse.json({ error: "Compare-at price must be ≥ product price." }, { status: 400 });
  }

  const adminDb = getSupabaseServerClient();

  // Check slug uniqueness
  const { data: existing } = await adminDb
    .from("products")
    .select("id")
    .eq("slug", body.slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `A product with slug "${body.slug}" already exists. Please choose a different slug.` },
      { status: 409 }
    );
  }

  // Check SKU uniqueness if provided
  if (body.sku?.trim()) {
    const { data: existingSku } = await adminDb
      .from("products")
      .select("id")
      .eq("sku", body.sku.trim())
      .maybeSingle();
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${body.sku}" is already in use.` }, { status: 409 });
    }
  }

  // 1. Insert product
  const { data: product, error: productError } = await adminDb
    .from("products")
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      short_description: body.short_description?.trim() || null,
      price: body.price,
      compare_at_price: body.compare_at_price ?? null,
      category_id: body.category_id || null,
      sku: body.sku?.trim() || null,
      is_featured: body.is_featured,
      is_new: body.is_new,
      is_best_seller: body.is_best_seller,
      active: body.active,
    })
    .select("id")
    .single();

  if (productError || !product) {
    console.error("Product insert error:", productError);
    return NextResponse.json({ error: "Failed to create product. Please try again." }, { status: 500 });
  }

  const productId = product.id;
  const cleanupProduct = async () => {
    await adminDb.from("products").delete().eq("id", productId);
  };

  // 2. Insert product images
  if (body.images.length > 0) {
    const { error: imgError } = await adminDb.from("product_images").insert(
      body.images.map((img) => ({
        product_id: productId,
        url: img.url,
        alt_text: img.alt_text ?? null,
        position: img.position,
      }))
    );
    if (imgError) {
      console.error("Image insert error:", imgError);
      await cleanupProduct();
      return NextResponse.json({ error: "Failed to save product images." }, { status: 500 });
    }
  }

  // 3. Insert variants (colors) + per-variant inventory
  if (body.variants.length > 0) {
    const { data: insertedVariants, error: variantError } = await adminDb
      .from("product_variants")
      .insert(
        body.variants.map((v) => ({
          product_id: productId,
          label: v.label.trim(),
          price_override: v.price_override ?? null,
        }))
      )
      .select("id");

    if (variantError || !insertedVariants) {
      console.error("Variant insert error:", variantError);
      await cleanupProduct();
      return NextResponse.json({ error: "Failed to save product variants." }, { status: 500 });
    }

    // Inventory per variant (all get same base stock)
    const { error: invError } = await adminDb.from("inventory").insert(
      insertedVariants.map((v) => ({
        product_id: productId,
        variant_id: v.id,
        stock: body.stock,
      }))
    );
    if (invError) {
      console.error("Variant inventory error:", invError);
      await cleanupProduct();
      return NextResponse.json({ error: "Failed to save variant inventory." }, { status: 500 });
    }
  } else {
    // 4. Base inventory (no variants)
    const { error: invError } = await adminDb.from("inventory").insert({
      product_id: productId,
      variant_id: null,
      stock: body.stock,
    });
    if (invError) {
      console.error("Base inventory error:", invError);
      await cleanupProduct();
      return NextResponse.json({ error: "Failed to save product inventory." }, { status: 500 });
    }
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, productId }, { status: 201 });
}

/** GET: fetch categories list for the form (admin authenticated) */
export async function GET() {
  // No auth required — categories are publicly readable
  const adminDb = getSupabaseServerClient();
  const { data: categories, error } = await adminDb
    .from("categories")
    .select("id, name, slug")
    .order("name");

  if (error) return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  return NextResponse.json({ categories });
}
