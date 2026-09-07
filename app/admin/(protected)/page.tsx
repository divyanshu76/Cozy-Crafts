import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import {
  calculateRevenue,
  getUniqueCustomerIds,
  isCancelledOrder,
  isQualifyingCodOrder,
  isQualifyingPrepaidOrder,
} from "@/lib/admin/stats";

async function getStats() {
  const supabase = getSupabaseServerClient();

  const [ordersRes, customersRes, productsRes, pendingReviewsRes] =
    await Promise.all([
      // Fetch minimum fields needed for statistics
      supabase
        .from("orders")
        .select("id, total, status, payment_status, payment_method, customer_id, created_at, public_order_number"),
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

  // Arrays of specific order types
  const prepaidOrders = orders.filter(isQualifyingPrepaidOrder);
  const codOrders = orders.filter(isQualifyingCodOrder);
  const cancelledOrders = orders.filter(isCancelledOrder);

  // Revenue Calculations
  const prepaidRevenue = calculateRevenue(prepaidOrders);
  const codRevenue = calculateRevenue(codOrders);
  const cancelledRevenue = calculateRevenue(cancelledOrders);

  // Customer Calculations
  const allCustomersCount = customersRes.count ?? 0;
  // Confirmed customers = unique customers from prepaid + COD valid orders
  const confirmedCustomersCount = getUniqueCustomerIds([...prepaidOrders, ...codOrders]).length;
  const cancelledCustomersCount = getUniqueCustomerIds(cancelledOrders).length;

  // Recent Orders pool (top 50 is enough for the client to filter locally and slice to 5)
  // They are already sorted by Supabase implicitly, but we must sort by created_at DESC locally since we didn't order in the query above (to get ALL stats efficiently).
  const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentOrdersPool = sortedOrders.slice(0, 50);

  return {
    revenue: {
      all: prepaidRevenue + codRevenue,
      prepaid: prepaidRevenue,
      cod: codRevenue,
      cancelled: cancelledRevenue,
    },
    customers: {
      all: allCustomersCount,
      confirmed: confirmedCustomersCount,
      cancelled: cancelledCustomersCount,
    },
    orders: {
      all: orders.length,
      prepaid: prepaidOrders.length,
      cod: codOrders.length,
      cancelled: cancelledOrders.length,
    },
    totalProducts: productsRes.count ?? 0,
    pendingReviews: pendingReviewsRes.count ?? 0,
    recentOrdersPool,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <DashboardClient stats={stats} />;
}
