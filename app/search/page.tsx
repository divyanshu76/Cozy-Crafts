import { searchProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Search | Cozy Craft",
  description: "Search for handmade gifts, keychains, and tiny treasures.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  
  const products = query ? await searchProducts(query) : [];

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl md:text-5xl text-espresso mb-4">Search Results</h1>
        {query ? (
          <p className="text-espresso-soft max-w-2xl mx-auto">
            Showing results for <span className="font-semibold text-espresso">"{query}"</span>
          </p>
        ) : (
          <p className="text-espresso-soft max-w-2xl mx-auto">
            Enter a search term to find products.
          </p>
        )}
      </div>

      {query && products.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-8 border-b border-taupe/20 pb-4">
            <p className="text-sm text-espresso-soft">{products.length} products found</p>
          </div>
          <ProductGrid products={products} />
        </>
      ) : query ? (
        <div className="text-center py-20 border border-taupe/20 rounded-2xl bg-cream-soft/50">
          <Search className="mx-auto h-12 w-12 text-taupe mb-4 opacity-50" />
          <h2 className="font-serif text-2xl text-espresso mb-2">No products found</h2>
          <p className="text-espresso-soft mb-6">
            We couldn't find anything matching "{query}". Try checking your spelling or using more general terms.
          </p>
          <Button asChild className="bg-espresso text-cream hover:bg-espresso/90 rounded-full">
            <Link href="/shop">Browse All Products</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
