import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ShoppingBag, Users, Package, Star } from "lucide-react";

async function getStats() {
  const supabase = getSupabaseServerClient();

  const [ordersRes, customersRes, productsRes, pendingReviewsRes] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, total, status, created_at", { count: "exact" }),
      supabase.from("customers").select("id", { count: "exact" }),
      supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("active", true),
      supabase
        .from("reviews")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
    ]);

  const orders = ordersRes.data ?? [];
  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const paidOrders = orders.filter((o) =>
    ["PAID", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.status)
  );

  // Recent 5 orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, public_order_number, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalOrders: ordersRes.count ?? 0,
    paidOrders: paidOrders.length,
    revenue,
    totalCustomers: customersRes.count ?? 0,
    totalProducts: productsRes.count ?? 0,
    pendingReviews: pendingReviewsRes.count ?? 0,
    recentOrders: recentOrders ?? [],
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  PAID: "bg-sage/20 text-sage",
  CONFIRMED: "bg-sage/20 text-sage",
  PROCESSING: "bg-amber-100 text-amber-700",
  PACKED: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-sage/20 text-sage",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      sub: `${stats.paidOrders} paid`,
      icon: ShoppingBag,
      color: "bg-sage/10 text-sage",
    },
    {
      label: "Revenue",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
      sub: "from all orders",
      icon: Package,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      sub: "total contacts",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      sub: "awaiting approval",
      icon: Star,
      color: "bg-red-100 text-red-700",
    },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-espresso mb-2">Dashboard</h1>
      <p className="text-espresso-soft mb-8">Welcome back. Here&apos;s what&apos;s happening.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-taupe/20 p-5 shadow-sm"
          >
            <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-espresso">{card.value}</p>
            <p className="text-sm text-espresso-soft mt-0.5">{card.label}</p>
            <p className="text-xs text-taupe mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm">
        <div className="p-5 border-b border-taupe/10">
          <h2 className="font-serif text-xl text-espresso">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-taupe/5 hover:bg-cream/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <a
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-sage hover:underline font-medium"
                    >
                      {order.public_order_number}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-espresso-soft">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-espresso">
                    ₹{Number(order.total).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-espresso-soft">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-taupe/10">
          <a href="/admin/orders" className="text-sm text-sage hover:underline font-medium">
            View all orders →
          </a>
        </div>
      </div>
    </div>
  );
}
