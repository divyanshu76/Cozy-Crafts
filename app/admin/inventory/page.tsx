import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function updateStock(inventoryId: string, stock: number) {
  "use server";
  const supabase = getSupabaseServerClient();
  await supabase.from("inventory").update({ stock, updated_at: new Date().toISOString() }).eq("id", inventoryId);
  revalidatePath("/admin/inventory");
}

export default async function AdminInventoryPage() {
  const supabase = getSupabaseServerClient();
  const { data: inventory } = await supabase
    .from("inventory")
    .select("id, stock, product_id, variant_id, products(name, slug), product_variants(label)")
    .order("stock", { ascending: true });

  return (
    <div>
      <h1 className="font-serif text-3xl text-espresso mb-8">Inventory</h1>
      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Variant</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {(inventory ?? []).map((inv) => {
              const product = inv.products as { name?: string } | null;
              const variant = inv.product_variants as { label?: string } | null;
              const updateStockAction = updateStock.bind(null, inv.id);
              return (
                <tr key={inv.id} className="border-b border-taupe/5 hover:bg-cream/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-espresso">{product?.name ?? inv.product_id}</td>
                  <td className="px-5 py-3.5 text-espresso-soft">{variant?.label ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${inv.stock === 0 ? "text-red-600" : inv.stock <= 5 ? "text-amber-600" : "text-sage"}`}>
                      {inv.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <form action={async (fd: FormData) => {
                      "use server";
                      await updateStockAction(Number(fd.get("stock") ?? 0));
                    }} className="flex items-center gap-2">
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        defaultValue={inv.stock}
                        className="w-20 border border-taupe/30 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30"
                      />
                      <button type="submit" className="text-xs bg-sage text-white px-3 py-1.5 rounded-lg hover:bg-sage/80 transition-colors">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(inventory ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-espresso-soft">No inventory records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
