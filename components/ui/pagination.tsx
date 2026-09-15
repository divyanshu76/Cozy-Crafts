"use client"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  totalPages: number;
}

export function Pagination({ totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center space-x-6 mt-12 mb-8">
      <Link
        href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
        className={`p-2 rounded-full border border-taupe/20 ${
          currentPage <= 1 
            ? "opacity-50 cursor-not-allowed pointer-events-none" 
            : "hover:bg-cream-soft transition-colors text-espresso"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={20} />
      </Link>
      
      <span className="text-sm font-medium text-espresso-soft">
        Page {currentPage} of {totalPages}
      </span>

      <Link
        href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
        className={`p-2 rounded-full border border-taupe/20 ${
          currentPage >= totalPages 
            ? "opacity-50 cursor-not-allowed pointer-events-none" 
            : "hover:bg-cream-soft transition-colors text-espresso"
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}
