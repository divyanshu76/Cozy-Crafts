import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Eye } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  PAID: "bg-sage/20 text-sage",
  CONFIRMED: "bg-sage/20 text-sage",
  PROCESSING: "bg-amber-100 text-amber-700",
  PACKED: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default async function AdminOrdersPage() {
  const supabase = getSupabaseServerClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, public_order_number, status, payment_status, total, created_at, customers(email, phone)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl text-espresso mb-8">Orders</h1>

      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((order) => {
                const customer = order.customers as
                  | { email?: string; phone?: string }
                  | null;
                return (
                  <tr
                    key={order.id}
                    className="border-b border-taupe/5 hover:bg-cream/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-medium text-sage">
                      {order.public_order_number}
                    </td>
                    <td className="px-5 py-3.5 text-espresso-soft">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-espresso-soft">
                      {customer?.email ?? customer?.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[order.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-espresso">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs text-sage hover:underline font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(orders ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-espresso-soft"
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
