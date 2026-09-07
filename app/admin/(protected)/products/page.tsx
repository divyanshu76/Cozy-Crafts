import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Package } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = getSupabaseServerClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, active, is_featured, is_new, is_best_seller, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-espresso">Products</h1>
        <div className="text-sm text-espresso-soft">
          {(products ?? []).length} products
        </div>
      </div>

      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Flags</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const cat = p.categories as { name?: string } | null;
              return (
                <tr key={p.id} className="border-b border-taupe/5 hover:bg-cream/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-espresso">{p.name}</p>
                    <p className="text-xs text-taupe font-mono">{p.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-espresso-soft">{cat?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 font-medium text-espresso">₹{Number(p.price).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {p.is_featured && <span className="text-xs bg-sage/10 text-sage px-1.5 py-0.5 rounded">Featured</span>}
                      {p.is_new && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">New</span>}
                      {p.is_best_seller && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Best Seller</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${p.active ? "bg-sage/10 text-sage" : "bg-red-100 text-red-700"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-espresso-soft">
                  <Package className="h-8 w-8 mx-auto mb-2 text-taupe" />
                  No products found. Add products in Supabase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
