"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function ProductActions({ productId, slug, productName }: { productId: string; slug: string; productName: string }) {
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const toggleOpen = () => setOpen(!open);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productName}"?\nThis will remove the product and all its images/inventory. This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setOpen(false);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete product");
      }

      toast("Product deleted successfully.", "success");
      router.refresh();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        disabled={isDeleting}
        className="p-1.5 text-espresso-soft hover:bg-taupe/10 rounded-md transition-colors disabled:opacity-50"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-taupe/20 z-50 overflow-hidden py-1">
            <Link
              href={`/product/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm text-espresso hover:bg-cream/50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="w-4 h-4" /> View Store
            </Link>
            <Link
              href={`/admin/products/${productId}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-espresso hover:bg-cream/50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Edit className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
