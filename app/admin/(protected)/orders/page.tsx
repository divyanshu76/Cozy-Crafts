import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Eye, Filter } from "lucide-react";
import { OrdersFilters } from "./OrdersFilters"; // A client component for the dropdowns

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

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string; payment?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams.status || "ALL";
  const paymentFilter = searchParams.payment || "ALL";

  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("orders")
    .select(
      "id, public_order_number, status, payment_method, payment_status, total, created_at, customers(email, phone)"
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }
  if (paymentFilter !== "ALL") {
    if (paymentFilter === "PREPAID") {
      query = query.neq("payment_method", "COD"); // includes RAZORPAY, CARD, etc.
    } else {
      query = query.eq("payment_method", paymentFilter);
    }
  }

  const { data: orders } = await query;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-espresso">Orders</h1>
        <OrdersFilters currentStatus={statusFilter} currentPayment={paymentFilter} />
      </div>

      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-taupe/10 flex justify-between items-center text-sm text-espresso-soft">
          <span>{orders?.length || 0} matching orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Payment</th>
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
                    <td className="px-5 py-4 font-mono font-medium text-sage whitespace-nowrap">
                      {order.public_order_number}
                    </td>
                    <td className="px-5 py-4 text-espresso-soft whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-espresso-soft">
                      {customer?.email ?? customer?.phone ?? "Guest Customer"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-espresso px-2 py-1 bg-cream-soft border border-taupe/20 rounded-md whitespace-nowrap">
                        {order.payment_method || "PREPAID"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                          STATUS_COLORS[order.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-espresso whitespace-nowrap">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
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
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <Filter className="w-10 h-10 text-taupe mx-auto mb-3 opacity-50" />
                    <p className="text-espresso font-medium mb-1">No orders found.</p>
                    <p className="text-sm text-espresso-soft">Adjust your filters to see more results.</p>
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
