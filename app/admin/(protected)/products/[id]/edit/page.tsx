import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { notFound } from "next/navigation";
import { UploadedImage } from "@/components/admin/product-image-uploader";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServerClient();
  const resolvedParams = await params;

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");

  // Fetch product
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      product_images ( url, position ),
      product_variants ( id, label ),
      inventory ( stock, variant_id )
    `)
    .eq("id", resolvedParams.id)
    .single();

  if (!product) return notFound();

  // Reconstruct the payload to pass to ProductForm as initialData
  const images: UploadedImage[] = (product.product_images || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((img: any) => ({
      previewUrl: img.url, // For existing images, we use the remote URL as preview
      uploadedUrl: img.url,
    }));

  const colors = (product.product_variants || []).map((v: any) => v.label);
  
  // Get base stock
  const baseStock = product.inventory?.find((inv: any) => inv.variant_id === null)?.stock || 
                    product.inventory?.[0]?.stock || 0;

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    shortDescription: product.short_description || "",
    categoryId: product.category_id || "",
    price: product.price,
    compareAtPrice: product.compare_at_price,
    isFeatured: product.is_featured,
    isNew: product.is_new,
    isBestSeller: product.is_best_seller,
    isActive: product.active,
    sku: product.sku || "",
    stock: baseStock,
    colors,
    images,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ProductForm initialCategories={categories || []} initialData={initialData} />
    </div>
  );
}
