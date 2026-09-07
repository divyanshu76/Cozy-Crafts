"use client";
import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Users, Package, Star, ChevronDown, Filter } from "lucide-react";
import { RawOrder, isQualifyingPrepaidOrder, isQualifyingCodOrder, isCancelledOrder, isRefundedOrder } from "@/lib/admin/stats";

type DashboardStats = {
  revenue: {
    all: number;
    prepaid: number;
    cod: number;
    cancelled: number;
  };
  customers: {
    all: number;
    confirmed: number;
    cancelled: number;
  };
  orders: {
    all: number;
    prepaid: number;
    cod: number;
    cancelled: number;
  };
  totalProducts: number;
  pendingReviews: number;
  recentOrdersPool: any[];
};

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

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  const [revenueFilter, setRevenueFilter] = React.useState<"all" | "prepaid" | "cod" | "cancelled">("all");
  const [customerFilter, setCustomerFilter] = React.useState<"all" | "confirmed" | "cancelled">("all");
  const [recentOrderFilter, setRecentOrderFilter] = React.useState<"all" | "confirmed" | "cancelled" | "cod" | "prepaid">("all");

  const revenueDisplay = {
    all: { value: stats.revenue.all, label: "Active Revenue", sub: "Prepaid + Expected COD" },
    prepaid: { value: stats.revenue.prepaid, label: "Prepaid Revenue", sub: "Successfully paid online" },
    cod: { value: stats.revenue.cod, label: "COD Revenue", sub: "Expected from confirmed COD" },
    cancelled: { value: stats.revenue.cancelled, label: "Cancelled Revenue", sub: "Value of cancelled orders" },
  }[revenueFilter];

  const customerDisplay = {
    all: { value: stats.customers.all, label: "All Customers", sub: "Total unique contacts" },
    confirmed: { value: stats.customers.confirmed, label: "Confirmed Customers", sub: "From valid orders" },
    cancelled: { value: stats.customers.cancelled, label: "Cancelled Customers", sub: "From cancelled orders" },
  }[customerFilter];

  // Filter the recent orders pool based on the selected filter
  const filteredRecentOrders = stats.recentOrdersPool.filter((order) => {
    if (recentOrderFilter === "all") return true;
    if (recentOrderFilter === "confirmed") return isQualifyingPrepaidOrder(order) || isQualifyingCodOrder(order);
    if (recentOrderFilter === "cancelled") return isCancelledOrder(order);
    if (recentOrderFilter === "cod") return order.payment_method === "COD";
    if (recentOrderFilter === "prepaid") return order.payment_method !== "COD";
    return true;
  }).slice(0, 5); // STRICTLY limit to 5

  return (
    <div>
      <h1 className="font-serif text-3xl text-espresso mb-2">Dashboard</h1>
      <p className="text-espresso-soft mb-8">Welcome back. Here&apos;s what&apos;s happening.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        
        {/* Total Orders Card */}
        <div className="bg-white rounded-xl border border-taupe/20 p-5 shadow-sm">
          <div className="inline-flex p-2 rounded-lg bg-sage/10 text-sage mb-3">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-espresso">{stats.orders.all}</p>
          <p className="text-sm text-espresso-soft mt-0.5">Total Orders</p>
          <p className="text-xs text-taupe mt-1">{stats.orders.prepaid} prepaid, {stats.orders.cod} COD</p>
        </div>

        {/* Revenue Card with Filter */}
        <div className="bg-white rounded-xl border border-taupe/20 p-5 shadow-sm relative group">
          <div className="flex justify-between items-start mb-3">
            <div className="inline-flex p-2 rounded-lg bg-amber-100 text-amber-700">
              <Package className="h-5 w-5" />
            </div>
            <div className="relative">
              <select 
                className="appearance-none bg-transparent text-xs font-medium text-espresso border border-taupe/20 rounded-md py-1 pl-2 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage"
                value={revenueFilter}
                onChange={(e) => setRevenueFilter(e.target.value as any)}
              >
                <option value="all">All Revenue</option>
                <option value="prepaid">Prepaid</option>
                <option value="cod">COD</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="w-3 h-3 text-espresso absolute right-2 top-1.5 pointer-events-none" />
            </div>
          </div>
          <p className="text-2xl font-bold text-espresso transition-all">₹{revenueDisplay.value.toLocaleString("en-IN")}</p>
          <p className="text-sm text-espresso-soft mt-0.5">{revenueDisplay.label}</p>
          <p className="text-xs text-taupe mt-1">{revenueDisplay.sub}</p>
        </div>

        {/* Customers Card with Filter */}
        <div className="bg-white rounded-xl border border-taupe/20 p-5 shadow-sm relative">
          <div className="flex justify-between items-start mb-3">
            <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            <div className="relative">
              <select 
                className="appearance-none bg-transparent text-xs font-medium text-espresso border border-taupe/20 rounded-md py-1 pl-2 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="w-3 h-3 text-espresso absolute right-2 top-1.5 pointer-events-none" />
            </div>
          </div>
          <p className="text-2xl font-bold text-espresso transition-all">{customerDisplay.value}</p>
          <p className="text-sm text-espresso-soft mt-0.5">{customerDisplay.label}</p>
          <p className="text-xs text-taupe mt-1">{customerDisplay.sub}</p>
        </div>

        {/* Pending Reviews Card */}
        <div className="bg-white rounded-xl border border-taupe/20 p-5 shadow-sm">
          <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-700 mb-3">
            <Star className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-espresso">{stats.pendingReviews}</p>
          <p className="text-sm text-espresso-soft mt-0.5">Pending Reviews</p>
          <p className="text-xs text-taupe mt-1">awaiting approval</p>
        </div>

      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm">
        <div className="p-4 md:p-5 border-b border-taupe/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-espresso">Recent Orders</h2>
          <div className="relative inline-block w-full sm:w-auto">
            <Filter className="w-4 h-4 text-taupe absolute left-3 top-2.5 pointer-events-none" />
            <select 
              className="appearance-none w-full sm:w-auto bg-cream-soft text-sm font-medium text-espresso border border-taupe/20 rounded-lg py-2 pl-9 pr-10 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage"
              value={recentOrderFilter}
              onChange={(e) => setRecentOrderFilter(e.target.value as any)}
            >
              <option value="all">All Orders</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="cod">COD Only</option>
              <option value="prepaid">Prepaid Only</option>
            </select>
            <ChevronDown className="w-4 h-4 text-espresso absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-taupe/10 text-left text-xs text-espresso-soft uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-taupe/5 hover:bg-cream/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-sage hover:underline font-medium"
                    >
                      {order.public_order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-espresso-soft whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-espresso px-2 py-1 bg-cream-soft border border-taupe/20 rounded-md">
                      {order.payment_method || "PREPAID"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-espresso whitespace-nowrap">
                    ₹{Number(order.total).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {filteredRecentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Package className="w-10 h-10 text-taupe mx-auto mb-3 opacity-50" />
                    <p className="text-espresso font-medium mb-1">No orders found</p>
                    <p className="text-sm text-espresso-soft">Try changing your filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-taupe/10">
          <Link href="/admin/orders" className="text-sm text-sage hover:underline font-medium">
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
