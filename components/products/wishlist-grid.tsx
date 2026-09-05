"use client"
import * as React from "react"
import { Product } from "@/types/product"
import { ProductCard } from "@/components/products/product-card"
import { supabaseBrowserClient } from "@/lib/supabase/client"

export function WishlistGrid({ itemIds }: { itemIds: string[] }) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (itemIds.length === 0) {
      setIsLoading(false);
      return;
    }

    supabaseBrowserClient
      .from("products")
      .select(`
        id, name, slug, description, price, compare_at_price, category_id,
        materials, care_instructions, personalization_available,
        is_featured, is_new, is_best_seller, tags, rating, review_count, created_at,
        categories ( slug ),
        images:product_images ( url, alt_text, position ),
        variants:product_variants ( id, label, price_override ),
        inventory ( stock, variant_id )
      `)
      .in("id", itemIds)
      .eq("active", true)
      .then(({ data }) => {
        if (!data) { setIsLoading(false); return; }
        // Map to Product type
        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description ?? "",
          price: p.price,
          compareAtPrice: p.compare_at_price ?? undefined,
          images: [...(p.images ?? [])].sort((a: any, b: any) => a.position - b.position).map((img: any) => img.url),
          category: p.categories?.slug ?? "",
          tags: p.tags ?? [],
          stock: (p.inventory ?? []).reduce((s: number, inv: any) => s + inv.stock, 0),
          variants: (p.variants ?? []).map((v: any) => ({
            id: v.id,
            label: v.label,
            priceOverride: v.price_override ?? undefined,
            stock: (p.inventory ?? []).find((inv: any) => inv.variant_id === v.id)?.stock ?? 0,
          })),
          isFeatured: p.is_featured,
          isNew: p.is_new,
          isBestSeller: p.is_best_seller,
          rating: p.rating,
          reviewCount: p.review_count,
          materials: p.materials ?? [],
          careInstructions: p.care_instructions ?? "",
          personalizationAvailable: p.personalization_available,
          createdAt: p.created_at,
        }));
        setProducts(mapped);
        setIsLoading(false);
      });
  }, [itemIds]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
        {itemIds.map((id) => (
          <div key={id} className="h-64 rounded-xl bg-cream-soft animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <h3 className="font-serif text-2xl text-espresso mb-2">Your wishlist is empty</h3>
        <p className="text-espresso-soft">Save items you love here by clicking the heart icon.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
