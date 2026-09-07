import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Product, ProductVariant } from "@/types/product";

// ---------------------------------------------------------------------------
// Shape returned by Supabase joined queries → mapped to Product type
// ---------------------------------------------------------------------------
type SupabaseProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  materials: string[] | null;
  care_instructions: string | null;
  personalization_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  tags: string[] | null;
  rating: number;
  review_count: number;
  created_at: string;
  categories: { slug: string } | null;
  images: { url: string; alt_text: string | null; position: number }[];
  variants: { id: string; label: string; price_override: number | null }[];
  inventory: { stock: number; variant_id: string | null }[];
};

function mapToProduct(p: SupabaseProduct): Product {
  const totalStock = p.inventory.reduce((sum, inv) => sum + inv.stock, 0);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    shortDescription: p.short_description ?? undefined,
    price: p.price,
    compareAtPrice: p.compare_at_price ?? undefined,
    images: p.images
      .sort((a, b) => a.position - b.position)
      .map((img) => img.url),
    category: p.categories?.slug ?? p.category_id ?? "",
    tags: p.tags ?? [],
    stock: totalStock,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      priceOverride: v.price_override ?? undefined,
      stock:
        p.inventory.find((inv) => inv.variant_id === v.id)?.stock ?? totalStock,
    })) as ProductVariant[],
    isFeatured: p.is_featured,
    isNew: p.is_new,
    isBestSeller: p.is_best_seller,
    rating: p.rating,
    reviewCount: p.review_count,
    materials: p.materials ?? [],
    careInstructions: p.care_instructions ?? "",
    personalizationAvailable: p.personalization_available,
    createdAt: p.created_at,
  };
}

const PRODUCT_SELECT = `
  id, name, slug, description, short_description, price, compare_at_price, category_id,
  materials, care_instructions, personalization_available,
  is_featured, is_new, is_best_seller, tags, rating, review_count, created_at,
  categories ( slug ),
  images:product_images ( url, alt_text, position ),
  variants:product_variants ( id, label, price_override ),
  inventory ( stock, variant_id )
`;

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as SupabaseProduct[]).map(mapToProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const { data, error } = await supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapToProduct(data as unknown as SupabaseProduct);
}

const VIRTUAL_CATEGORY_FILTERS: Record<
  string,
  { column: string; value: boolean }
> = {
  "new-arrivals": { column: "is_new", value: true },
  "best-sellers": { column: "is_best_seller", value: true },
};

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  const virtual = VIRTUAL_CATEGORY_FILTERS[categorySlug];

  let query = supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true);

  if (virtual) {
    query = query.eq(virtual.column, virtual.value);
  } else {
    // Filter via the joined categories table
    query = query.eq("categories.slug", categorySlug);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error || !data) return [];
  const products = (data as unknown as SupabaseProduct[]).map(mapToProduct);

  // For real-category queries, the join filter may return rows with non-matching
  // categories (Supabase returns null for the join rather than excluding the row).
  // Filter those out here.
  if (!virtual) {
    return products.filter((p) => p.category === categorySlug);
  }
  return products;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as SupabaseProduct[]).map(mapToProduct);
}

export async function getBestSellers(): Promise<Product[]> {
  const { data, error } = await supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("is_best_seller", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as SupabaseProduct[]).map(mapToProduct);
}

export async function getNewArrivals(): Promise<Product[]> {
  const { data, error } = await supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("is_new", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as SupabaseProduct[]).map(mapToProduct);
}

export async function getCategories() {
  const { data, error } = await supabaseBrowserClient
    .from("categories")
    .select("id, name, slug, description")
    .order("name");

  if (error || !data) return [];
  return data;
}

// Keep legacy named export for call sites that import { categories }
export const categories: ReturnType<typeof getCategories> extends Promise<
  infer T
>
  ? T
  : never = [] as any;

export const CATEGORY_TITLES: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  "best-sellers": "Best Sellers",
};

export function getCategoryTitle(categorySlug: string): string {
  return CATEGORY_TITLES[categorySlug] ?? categorySlug;
}

export async function getReviewsForProduct(productId: string) {
  const { data, error } = await supabaseBrowserClient
    .from("reviews")
    .select("id, customer_name, rating, body, image_url, verified, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const lower = query.toLowerCase();

  // Supabase full-text search (ilike is a simple fallback without tsvector index)
  const { data, error } = await supabaseBrowserClient
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .or(
      `name.ilike.%${lower}%,description.ilike.%${lower}%,tags.cs.{${lower}}`
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as SupabaseProduct[]).map(mapToProduct);
}
