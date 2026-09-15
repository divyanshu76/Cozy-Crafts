import { getPaginatedProducts } from "@/lib/products"
import { ProductGrid } from "@/components/products/product-grid"
import { Pagination } from "@/components/ui/pagination"

export const metadata = {
  title: "Shop All | Cozy Craft",
  description: "Browse all handcrafted gifts, keychains, and tiny treasures.",
};

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 16;
  const { products, total } = await getPaginatedProducts(page, limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl md:text-5xl text-espresso mb-4">Shop All</h1>
        <p className="text-espresso-soft max-w-2xl mx-auto">
          Explore our entire collection of handmade pieces, crafted with care and made to bring joy.
        </p>
      </div>
      
      {/* Filtering/Sorting placeholder (simplified for now) */}
      <div className="flex justify-between items-center mb-8 border-b border-taupe/20 pb-4">
        <p className="text-sm text-espresso-soft">{total} products</p>
      </div>

      <ProductGrid products={products} />
      <Pagination totalPages={totalPages} />
    </div>
  )
}
