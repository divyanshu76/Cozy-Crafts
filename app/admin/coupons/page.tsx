import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Tag } from "lucide-react";

async function toggleCoupon(couponId: string, active: boolean) {
  "use server";
  const supabase = getSupabaseServerClient();
  await supabase.from("coupons").update({ active }).eq("id", couponId);
  revalidatePath("/admin/coupons");
}

export default async function AdminCouponsPage() {
  const supabase = getSupabaseServerClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-espresso">Coupons</h1>
        <p className="text-sm text-espresso-soft">Manage discount codes</p>
      </div>

      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Discount</th>
              <th className="px-5 py-3 font-medium">Min Order</th>
              <th className="px-5 py-3 font-medium">Usage</th>
              <th className="px-5 py-3 font-medium">Expires</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((c) => {
              const toggleAction = toggleCoupon.bind(null, c.id, !c.active);
              return (
                <tr key={c.id} className="border-b border-taupe/5 hover:bg-cream/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-espresso flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-sage" />
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-espresso">
                    {c.discount_type === "percentage"
                      ? `${c.discount_value}% off`
                      : `₹${c.discount_value} off`}
                  </td>
                  <td className="px-5 py-3.5 text-espresso-soft">
                    {c.min_order_amount > 0 ? `₹${c.min_order_amount}` : "None"}
                  </td>
                  <td className="px-5 py-3.5 text-espresso-soft">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="px-5 py-3.5 text-espresso-soft">
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "Never"}
                  </td>
                  <td className="px-5 py-3.5">
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-opacity hover:opacity-70 ${
                          c.active ? "bg-sage/10 text-sage" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(coupons ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-espresso-soft">
                  No coupons yet. Insert them directly in Supabase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
