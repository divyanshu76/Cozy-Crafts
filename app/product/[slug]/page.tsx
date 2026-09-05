import { getProductBySlug } from "@/lib/products"
import { notFound } from "next/navigation"
import { ProductGallery } from "@/components/products/product-gallery"
import { AddToCart } from "@/components/products/add-to-cart"
import { Accordion } from "@/components/ui/accordion"
import { StarRating } from "@/components/ui/star-rating"
import { TrustSection } from "@/components/sections/trust-section"

interface ProductPageProps {
  params: {
    slug: string;
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product Not Found | Cozy Craft" };

  return {
    title: `${product.name} | Cozy Craft`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    notFound();
  }

  const accordionItems = [
    {
      id: "description",
      title: "Description",
      content: <p>{product.description}</p>
    },
    {
      id: "details",
      title: "Materials & Care",
      content: (
        <ul className="list-disc pl-4 space-y-1">
          {product.features?.map((f, i) => <li key={i}>{f}</li>) || (
            <>
              <li>Handmade with premium materials</li>
              <li>Handle with care to ensure longevity</li>
              <li>Keep away from water and direct sunlight</li>
            </>
          )}
        </ul>
      )
    },
    {
      id: "shipping",
      title: "Shipping & Returns",
      content: (
        <div className="space-y-2">
          <p>Orders are typically processed within 2-3 business days.</p>
          <p>Standard delivery takes 4-7 business days across India.</p>
          <p>Returns are accepted within 7 days for unused items in original packaging.</p>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 border-b border-taupe/20">
        {/* Breadcrumb could go here */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {/* Left: Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-2">{product.name}</h1>
            
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={product.rating} />
                <span className="text-sm text-espresso-soft underline cursor-pointer">{product.reviewCount} reviews</span>
              </div>
            )}
            
            <p className="text-espresso-soft text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            <AddToCart product={product} />

            <div className="mt-12">
              <Accordion items={accordionItems} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Product specifics sections could go here (e.g. cross-sell) */}
      <TrustSection />
    </>
  )
}
