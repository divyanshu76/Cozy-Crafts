import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { ProductActions } from "@/components/admin/product-actions";

export default async function AdminProductsPage() {
  const supabase = getSupabaseServerClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, active, is_featured, is_new, is_best_seller, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <ToastProvider>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-espresso">Products</h1>
            <p className="text-sm text-espresso-soft mt-1">{(products ?? []).length} products</p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-espresso text-cream text-sm font-medium hover:bg-espresso-soft transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Flags</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => {
                  const cat = p.categories as { name?: string } | null;
                  return (
                    <tr key={p.id} className="border-b border-taupe/5 hover:bg-cream/50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-espresso">{p.name}</p>
                        <p className="text-xs text-taupe font-mono">{p.slug}</p>
                      </td>
                      <td className="px-5 py-3.5 text-espresso-soft whitespace-nowrap">{cat?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 font-medium text-espresso whitespace-nowrap">₹{Number(p.price).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 w-max">
                          {p.is_featured && <span className="text-xs bg-sage/10 text-sage px-1.5 py-0.5 rounded">Featured</span>}
                          {p.is_new && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">New</span>}
                          {p.is_best_seller && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Best Seller</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${p.active ? "bg-sage/10 text-sage" : "bg-red-100 text-red-700"}`}>
                          {p.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <ProductActions productId={p.id} slug={p.slug} productName={p.name} />
                      </td>
                    </tr>
                  );
                })}
                {(products ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Package className="h-8 w-8 mx-auto mb-3 text-taupe" />
                      <p className="text-espresso-soft mb-4">No products yet.</p>
                      <Link
                        href="/admin/products/new"
                        className="inline-flex items-center gap-1.5 text-sm text-sage hover:underline font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add your first product
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
