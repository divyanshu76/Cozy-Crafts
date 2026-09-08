"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, ExternalLink, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function ProductActions({ productId, slug, productName }: { productId: string; slug: string; productName: string }) {
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSettingInactive, setIsSettingInactive] = React.useState(false);
  // When set, shows the "can't delete, set inactive?" dialog
  const [showInactiveDialog, setShowInactiveDialog] = React.useState(false);
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
        // 409 = product has order history → offer "Set Inactive" instead
        if (res.status === 409) {
          setShowInactiveDialog(true);
          return;
        }
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

  const handleSetInactive = async () => {
    setIsSettingInactive(true);
    setShowInactiveDialog(false);

    try {
      // Fetch current product data first so we can PATCH with all required fields
      const getRes = await fetch(`/api/admin/products/${productId}`);
      let currentData: any = {};
      if (getRes.ok) {
        currentData = await getRes.json();
      }

      // PATCH with active: false — uses the existing PATCH endpoint
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Pass through existing data, just flip active to false
          name: currentData.name ?? productName,
          slug: currentData.slug ?? slug,
          price: currentData.price ?? 0,
          stock: currentData.stock ?? 0,
          is_featured: currentData.is_featured ?? false,
          is_new: currentData.is_new ?? false,
          is_best_seller: currentData.is_best_seller ?? false,
          variants: currentData.variants ?? [],
          images: currentData.images ?? [],
          ...currentData,
          active: false, // ensure this is always false
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set product inactive");
      }

      toast(`"${productName}" has been set to Inactive.`, "success");
      router.refresh();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSettingInactive(false);
    }
  };

  return (
    <>
      {/* Inactive dialog — shown when delete is blocked by order history */}
      {showInactiveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-taupe/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-espresso mb-1">Cannot Delete Product</h3>
                <p className="text-sm text-espresso-soft leading-relaxed">
                  <strong>&quot;{productName}&quot;</strong> is part of existing order history
                  and cannot be permanently deleted. This protects your order records.
                </p>
              </div>
            </div>
            <p className="text-sm text-espresso-soft mb-5 pl-11">
              You can set it to <strong>Inactive</strong> instead — it will no longer appear
              in the storefront or be purchasable, but historical orders will remain intact.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowInactiveDialog(false)}
                className="px-4 py-2 text-sm text-espresso-soft border border-taupe/30 rounded-lg hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetInactive}
                disabled={isSettingInactive}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-espresso text-cream rounded-lg hover:bg-espresso/90 transition-colors disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4" />
                {isSettingInactive ? "Setting Inactive…" : "Set Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={toggleOpen}
          disabled={isDeleting || isSettingInactive}
          className="p-1.5 text-espresso-soft hover:bg-taupe/10 rounded-md transition-colors disabled:opacity-50"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-md shadow-lg border border-taupe/20 z-50 overflow-hidden py-1">
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
    </>
  );
}
