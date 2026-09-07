import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminCustomersPage() {
  const supabase = getSupabaseServerClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-espresso">Customers</h1>
        <p className="text-sm text-espresso-soft">{(customers ?? []).length} contacts</p>
      </div>
      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="border-b border-taupe/5 hover:bg-cream/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-espresso">{c.full_name ?? "—"}</td>
                <td className="px-5 py-3.5 text-espresso-soft">{c.email ?? "—"}</td>
                <td className="px-5 py-3.5 text-espresso-soft">{c.phone ?? "—"}</td>
                <td className="px-5 py-3.5 text-espresso-soft">
                  {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
            {(customers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-espresso-soft">No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
