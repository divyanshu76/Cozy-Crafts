import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderOpen,
  Warehouse,
  Users,
  Star,
  Tag,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Re-verify session server-side (defense in depth beyond the middleware)
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in server components — mutations happen in middleware/route handlers
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin/login");

  return (
    <div className="min-h-screen flex bg-[#f5f0eb]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#2c1f14] text-cream flex flex-col min-h-screen sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <p className="text-xs text-cream/50 uppercase tracking-widest mb-1">
            Admin Panel
          </p>
          <p className="font-serif text-xl text-cream">Cozy Craft</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cream/70 hover:text-cream hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-cream/40 mb-3 truncate">
            {session.user.email}
          </p>
          <form
            action={async () => {
              "use server";
              // Sign out by calling the Supabase auth signOut via a server action
              // This clears the session cookie server-side
              const { createServerClient: makeClient } = await import("@supabase/ssr");
              const { cookies: getCookies } = await import("next/headers");
              const jar = await getCookies();
              const sb = makeClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                  cookies: {
                    getAll() { return jar.getAll(); },
                    setAll(c) { c.forEach(({ name, value, options }) => jar.set(name, value, options)); },
                  },
                }
              );
              await sb.auth.signOut();
              redirect("/admin/login");
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 text-xs text-cream/50 hover:text-cream transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
