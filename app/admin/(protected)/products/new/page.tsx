import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: "Add Product — Cozy Craft Admin",
};

export default async function AddProductPage() {
  // Fetch categories server-side so the form loads with them immediately
  const supabase = getSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  return (
    <ToastProvider>
      <ProductForm initialCategories={categories ?? []} />
    </ToastProvider>
  );
}
