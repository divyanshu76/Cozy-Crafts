import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const supabase = getSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, description, created_at")
    .order("name");

  return (
    <div>
      <h1 className="font-serif text-3xl text-espresso mb-8">Categories</h1>
      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((c) => (
              <tr key={c.id} className="border-b border-taupe/5 hover:bg-cream/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-espresso">{c.name}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-taupe">{c.slug}</td>
                <td className="px-5 py-3.5 text-espresso-soft">{c.description ?? "—"}</td>
              </tr>
            ))}
            {(categories ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-espresso-soft">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
