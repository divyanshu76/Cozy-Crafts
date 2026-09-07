"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ProductImageUploader, UploadedImage } from "./product-image-uploader";
import { ProductPreview } from "./product-preview";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Category { id: string; name: string; slug: string; }

interface FormErrors {
  images?: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  categoryId?: string;
  price?: string;
  compareAtPrice?: string;
  stock?: string;
  colors?: string;
  global?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─────────────────────────────────────────────
// Toggle switch
// ─────────────────────────────────────────────
function Toggle({ checked, onChange, id, label, description }: {
  checked: boolean; onChange: (v: boolean) => void;
  id: string; label: string; description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-taupe/10 last:border-0">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-espresso cursor-pointer">{label}</label>
        <p className="text-xs text-espresso-soft mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 shrink-0",
          checked ? "bg-espresso" : "bg-taupe/40"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────
function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-taupe/20 shadow-sm p-6 md:p-7">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-espresso text-cream text-xs font-bold shrink-0">
          {number}
        </span>
        <h2 className="font-serif text-xl text-espresso">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────
function Field({ label, required, error, htmlFor, children, hint }: {
  label: string; required?: boolean; error?: string; htmlFor?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-espresso">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-espresso-soft">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
interface ProductFormProps {
  initialCategories: Category[];
}

export function ProductForm({ initialCategories }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ── Images ────────────────────────────────
  const [images, setImages] = React.useState<UploadedImage[]>([]);

  // ── Basic info ────────────────────────────
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  // Auto-generate slug from name (unless manually edited)
  React.useEffect(() => {
    if (!slugManuallyEdited) setSlug(slugify(name));
  }, [name, slugManuallyEdited]);

  // ── Description ───────────────────────────
  const [shortDescription, setShortDescription] = React.useState("");
  const [fullDescription, setFullDescription] = React.useState("");
  const SHORT_DESC_LIMIT = 300;

  // ── Category ──────────────────────────────
  const [categoryId, setCategoryId] = React.useState("");
  const selectedCategory = initialCategories.find((c) => c.id === categoryId);

  // ── Colors ────────────────────────────────
  const [colors, setColors] = React.useState<string[]>([]);
  const [colorInput, setColorInput] = React.useState("");
  const [showColorInput, setShowColorInput] = React.useState(false);
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  function addColor() {
    const val = colorInput.trim();
    if (!val) return;
    if (colors.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
      setColorInput("");
      return;
    }
    setColors([...colors, val]);
    setColorInput("");
    setShowColorInput(false);
  }

  function removeColor(color: string) {
    setColors(colors.filter((c) => c !== color));
  }

  // ── Pricing ───────────────────────────────
  const [price, setPrice] = React.useState("");
  const [compareAtPrice, setCompareAtPrice] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [sku, setSku] = React.useState("");

  // ── Flags ────────────────────────────────
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [isNew, setIsNew] = React.useState(false);
  const [isBestSeller, setIsBestSeller] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  // ── State ────────────────────────────────
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [saving, setSaving] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);

  // ─────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────
  function validate(): FormErrors {
    const e: FormErrors = {};

    if (images.length === 0) e.images = "Please upload at least one product image.";
    if (!name.trim()) e.name = "Product name is required.";
    if (!slug.trim()) e.slug = "Slug is required.";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      e.slug = "Slug must be lowercase letters, numbers, and hyphens only.";
    }
    if (!shortDescription.trim()) e.shortDescription = "Short description is required.";
    if (!categoryId) e.categoryId = "Please select a category.";

    const priceNum = parseFloat(price);
    if (!price) e.price = "Price is required.";
    else if (isNaN(priceNum) || priceNum < 0) e.price = "Price must be a valid non-negative number.";

    if (compareAtPrice) {
      const capNum = parseFloat(compareAtPrice);
      if (isNaN(capNum) || capNum < 0) e.compareAtPrice = "Compare-at price must be a valid number.";
      else if (capNum < priceNum) e.compareAtPrice = "Compare-at price must be ≥ product price.";
    }

    const stockNum = parseInt(stock, 10);
    if (!stock && stock !== "0") e.stock = "Stock quantity is required.";
    else if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      e.stock = "Stock must be a non-negative whole number.";
    }

    return e;
  }

  // ─────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstErrEl = document.querySelector("[data-error-field]");
      firstErrEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSaving(true);

    // Generate a temp product ID for storage path (we'll use the real one after insert)
    const tempId = crypto.randomUUID();
    const uploadedPaths: string[] = [];

    try {
      // 1. Upload images
      setUploadProgress("Uploading images…");
      const uploadedImages: Array<{ url: string; alt_text?: string; position: number }> = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setUploadProgress(`Uploading image ${i + 1} of ${images.length}…`);

        const formData = new FormData();
        formData.append("file", img.file);
        formData.append("productId", tempId);

        const res = await fetch("/api/admin/upload-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? `Failed to upload image ${i + 1}`);
        }

        uploadedPaths.push(data.path);
        uploadedImages.push({ url: data.url, alt_text: name || undefined, position: i });
      }

      // 2. Create product
      setUploadProgress("Adding product…");
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: fullDescription.trim() || undefined,
        short_description: shortDescription.trim() || undefined,
        category_id: categoryId || undefined,
        sku: sku.trim() || undefined,
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        is_featured: isFeatured,
        is_new: isNew,
        is_best_seller: isBestSeller,
        active: isActive,
        stock: parseInt(stock, 10),
        variants: colors.map((c) => ({ label: c })),
        images: uploadedImages,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        // Cleanup uploaded images
        for (const path of uploadedPaths) {
          await fetch("/api/admin/upload-image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
          }).catch(() => {});
        }
        throw new Error(data.error ?? "Failed to create product.");
      }

      toast("Product added successfully.", "success");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrors({ global: msg });
      toast(msg, "error");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-espresso">Add Product</h1>
          <p className="text-espresso-soft mt-1 text-sm">Create a beautiful product for your Cozy Craft store.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/products")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Products
          </Button>
        </div>
      </div>

      {/* Global error */}
      {errors.global && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{errors.global}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: form */}
          <div className="space-y-6">

            {/* 1. Product Images */}
            <Section number={1} title="Product Images">
              <p className="text-sm text-espresso-soft mb-4">
                Upload up to 4 images. The first image will be the main product image.
              </p>
              <div data-error-field={errors.images ? "images" : undefined}>
                <ProductImageUploader
                  images={images}
                  onChange={setImages}
                  error={errors.images}
                />
              </div>
            </Section>

            {/* 2. Basic Information */}
            <Section number={2} title="Basic Information">
              <div className="space-y-5">
                <Field label="Product Name" required htmlFor="product-name" error={errors.name}>
                  <div data-error-field={errors.name ? "name" : undefined}>
                    <Input
                      id="product-name"
                      placeholder="e.g. Cherry Blossom Hair Clip"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={200}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                  </div>
                </Field>

                <Field
                  label="Slug"
                  required
                  htmlFor="product-slug"
                  error={errors.slug}
                  hint="Auto-generated from name. You can edit it manually."
                >
                  <div data-error-field={errors.slug ? "slug" : undefined}>
                    <Input
                      id="product-slug"
                      placeholder="cherry-blossom-hair-clip"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugManuallyEdited(true);
                      }}
                      className="font-mono"
                    />
                  </div>
                  {slug && !errors.slug && (
                    <p className="text-xs text-espresso-soft font-mono mt-1">
                      /products/<span className="text-sage">{slug}</span>
                    </p>
                  )}
                </Field>
              </div>
            </Section>

            {/* 3. Description */}
            <Section number={3} title="Description">
              <div className="space-y-5">
                <Field label="Short Description" required htmlFor="short-desc" error={errors.shortDescription}>
                  <div data-error-field={errors.shortDescription ? "shortDesc" : undefined}>
                    <textarea
                      id="short-desc"
                      rows={3}
                      maxLength={SHORT_DESC_LIMIT}
                      placeholder="Describe what makes this handmade piece special."
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className={cn(
                        "flex w-full rounded-md border border-taupe bg-white px-3 py-2 text-sm placeholder:text-taupe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 resize-none",
                        errors.shortDescription && "border-red-400"
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className={cn("text-xs", shortDescription.length >= SHORT_DESC_LIMIT ? "text-red-500" : "text-taupe")}>
                      {shortDescription.length}/{SHORT_DESC_LIMIT}
                    </span>
                  </div>
                </Field>

                <Field label="Full Description" htmlFor="full-desc" hint="Optional. Provide detailed product information.">
                  <textarea
                    id="full-desc"
                    rows={5}
                    placeholder="Full product description, materials, dimensions, care instructions…"
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    className="flex w-full rounded-md border border-taupe bg-white px-3 py-2 text-sm placeholder:text-taupe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 resize-none"
                  />
                </Field>
              </div>
            </Section>

            {/* 4. Category */}
            <Section number={4} title="Category">
              <Field label="Category" required htmlFor="category" error={errors.categoryId}>
                <div data-error-field={errors.categoryId ? "category" : undefined}>
                  {initialCategories.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No categories found. Please add categories first in the{" "}
                      <a href="/admin/categories" className="underline font-medium">Categories</a> section.
                    </div>
                  ) : (
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className={cn(
                        "flex h-10 w-full rounded-md border border-taupe bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
                        !categoryId && "text-taupe",
                        errors.categoryId && "border-red-400"
                      )}
                    >
                      <option value="" disabled>Select a category…</option>
                      {initialCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </Field>
            </Section>

            {/* 5. Colors & Variants */}
            <Section number={5} title="Colors & Variants">
              <p className="text-sm text-espresso-soft mb-4">
                Colors are optional. Leave empty if this product has no color variants.
              </p>
              {errors.colors && (
                <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.colors}
                </p>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                {colors.map((color) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-taupe/30 bg-cream-soft text-sm text-espresso"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="w-4 h-4 rounded-full hover:bg-espresso hover:text-cream flex items-center justify-center transition-colors"
                      aria-label={`Remove color ${color}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}

                {showColorInput ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={colorInputRef}
                      type="text"
                      placeholder="Color name…"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addColor(); }
                        if (e.key === "Escape") { setShowColorInput(false); setColorInput(""); }
                      }}
                      className="h-8 rounded-full border border-taupe px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage w-32"
                      autoFocus
                      maxLength={30}
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="h-8 px-3 rounded-full bg-espresso text-cream text-xs font-medium hover:bg-espresso-soft transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowColorInput(false); setColorInput(""); }}
                      className="h-8 w-8 rounded-full border border-taupe flex items-center justify-center hover:bg-cream-soft transition-colors"
                    >
                      <X className="h-3 w-3 text-taupe" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowColorInput(true)}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full border border-dashed border-taupe/50 text-sm text-espresso-soft hover:border-sage hover:text-sage transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Color
                  </button>
                )}
              </div>
            </Section>

            {/* 6. Pricing & Inventory */}
            <Section number={6} title="Pricing & Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Price (₹)" required htmlFor="price" error={errors.price}>
                  <div data-error-field={errors.price ? "price" : undefined}>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={cn(errors.price && "border-red-400")}
                    />
                  </div>
                </Field>

                <Field
                  label="Compare-at Price (₹)"
                  htmlFor="compare-price"
                  error={errors.compareAtPrice}
                  hint="Optional. Show a strikethrough 'was' price."
                >
                  <Input
                    id="compare-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className={cn(errors.compareAtPrice && "border-red-400")}
                  />
                </Field>

                <Field label="Stock Quantity" required htmlFor="stock" error={errors.stock}>
                  <div data-error-field={errors.stock ? "stock" : undefined}>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className={cn(errors.stock && "border-red-400")}
                    />
                  </div>
                </Field>

                <Field
                  label="SKU"
                  htmlFor="sku"
                  hint="Optional. Must be unique if provided."
                >
                  <Input
                    id="sku"
                    placeholder="e.g. CC-HAIR-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="font-mono"
                  />
                </Field>
              </div>
            </Section>

            {/* 7. Flags & Status */}
            <Section number={7} title="Product Flags & Status">
              <Toggle
                id="toggle-active"
                label="Active"
                description="Product will be visible in the store."
                checked={isActive}
                onChange={setIsActive}
              />
              <Toggle
                id="toggle-featured"
                label="Featured"
                description="Show on homepage featured section."
                checked={isFeatured}
                onChange={setIsFeatured}
              />
              <Toggle
                id="toggle-best-seller"
                label="Best Seller"
                description="Mark as a best-selling product."
                checked={isBestSeller}
                onChange={setIsBestSeller}
              />
              <Toggle
                id="toggle-new"
                label="New Arrival"
                description="Show as a new product in the store."
                checked={isNew}
                onChange={setIsNew}
              />
            </Section>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 pb-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/admin/products")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
                size="lg"
                className="gap-2 min-w-[160px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress ?? "Adding product…"}
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </div>

          {/* Right: preview */}
          <div className="hidden xl:block">
            <ProductPreview
              name={name}
              price={parseFloat(price) || 0}
              compareAtPrice={compareAtPrice ? parseFloat(compareAtPrice) : undefined}
              shortDescription={shortDescription}
              categoryName={selectedCategory?.name ?? ""}
              colors={colors}
              isFeatured={isFeatured}
              isNew={isNew}
              isBestSeller={isBestSeller}
              isActive={isActive}
              images={images}
            />
          </div>
        </div>

        {/* Mobile preview (below form) */}
        <div className="xl:hidden mb-8">
          <ProductPreview
            name={name}
            price={parseFloat(price) || 0}
            compareAtPrice={compareAtPrice ? parseFloat(compareAtPrice) : undefined}
            shortDescription={shortDescription}
            categoryName={selectedCategory?.name ?? ""}
            colors={colors}
            isFeatured={isFeatured}
            isNew={isNew}
            isBestSeller={isBestSeller}
            isActive={isActive}
            images={images}
          />
        </div>
      </form>
    </div>
  );
}
