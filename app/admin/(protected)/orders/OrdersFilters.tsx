"use client";
import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Filter } from "lucide-react";

export function OrdersFilters({ currentStatus, currentPayment }: { currentStatus: string, currentPayment: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-espresso-soft mr-2">
        <Filter className="w-4 h-4" />
        <span className="font-medium hidden sm:inline">Filters</span>
      </div>
      
      <div className="relative w-full sm:w-auto">
        <select 
          className="appearance-none w-full sm:w-auto bg-white text-sm font-medium text-espresso border border-taupe/20 rounded-lg py-2 pl-3 pr-10 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage"
          value={currentStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAYMENT_FAILED">Payment Failed</option>
          <option value="PAID">Paid</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <ChevronDown className="w-4 h-4 text-espresso absolute right-3 top-2.5 pointer-events-none" />
      </div>

      <div className="relative w-full sm:w-auto">
        <select 
          className="appearance-none w-full sm:w-auto bg-white text-sm font-medium text-espresso border border-taupe/20 rounded-lg py-2 pl-3 pr-10 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage"
          value={currentPayment}
          onChange={(e) => handleFilterChange("payment", e.target.value)}
        >
          <option value="ALL">All Payment Methods</option>
          <option value="COD">Cash on Delivery</option>
          <option value="PREPAID">Prepaid Only</option>
        </select>
        <ChevronDown className="w-4 h-4 text-espresso absolute right-3 top-2.5 pointer-events-none" />
      </div>
    </div>
  );
}
