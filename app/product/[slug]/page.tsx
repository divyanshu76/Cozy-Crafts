import { getProductBySlug, getReviewsForProduct, getRelatedProducts, getCategoryTitle } from "@/lib/products"
import { notFound } from "next/navigation"
import { ProductGallery } from "@/components/products/product-gallery"
import { AddToCart } from "@/components/products/add-to-cart"
import { Accordion } from "@/components/ui/accordion"
import { StarRating } from "@/components/ui/star-rating"
import { TrustSection } from "@/components/sections/trust-section"
import { ProductReviews } from "@/components/products/product-reviews"
import { RelatedProducts } from "@/components/products/related-products"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  
  if (!product) return { title: "Product Not Found | Cozy Craft" };

  return {
    title: `${product.name} | Cozy Craft`,
    description: product.shortDescription || product.description,
    openGraph: {
      images: product.images?.[0] ? [product.images[0]] : [],
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  
  if (!product) {
    notFound();
  }

  const [reviews, relatedProducts] = await Promise.all([
    getReviewsForProduct(product.id),
    getRelatedProducts(product.id, product.category)
  ]);

  const accordionItems = [
    {
      id: "description",
      title: "Description",
      content: <div className="whitespace-pre-line text-espresso-soft leading-relaxed">{product.description}</div>
    },
    {
      id: "details",
      title: "Materials & Care",
      content: (
        <ul className="list-disc pl-4 space-y-1 text-espresso-soft">
          {product.materials && product.materials.length > 0 ? (
            product.materials.map((m, i) => <li key={i}>{m}</li>)
          ) : (
            <>
              <li>Handmade with premium materials</li>
              <li>Handle with care to ensure longevity</li>
            </>
          )}
          {product.careInstructions && (
            <li className="mt-2 text-espresso font-medium">{product.careInstructions}</li>
          )}
        </ul>
      )
    },
    {
      id: "shipping",
      title: "Shipping & Returns",
      content: (
        <div className="space-y-2 text-espresso-soft">
          <p>Orders are typically processed within 2-3 business days.</p>
          <p>Standard delivery takes 4-7 business days.</p>
          <p>Returns are accepted within 7 days for unused items in original packaging.</p>
        </div>
      )
    }
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.rating ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 1,
      }
    } : {}),
  };

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-taupe mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href="/" className="hover:text-espresso transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/shop" className="hover:text-espresso transition-colors">Shop</Link>
          {product.category && (
            <>
              <ChevronRight size={14} className="mx-2" />
              <Link href={`/shop/${product.category}`} className="hover:text-espresso transition-colors capitalize">
                {getCategoryTitle(product.category)}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="mx-2" />
          <span className="text-espresso font-medium truncate">{product.name}</span>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Gallery */}
          <div className="w-full">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.isNew && !hasDiscount && <Badge variant="outline" className="bg-cream-soft text-espresso border-taupe/30">New Arrival</Badge>}
              {product.isBestSeller && <Badge variant="outline" className="bg-sage/10 text-sage border-sage/20">Best Seller</Badge>}
              {hasDiscount && <Badge className="bg-sage text-white border-transparent">Save {discountPercent}%</Badge>}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-3 leading-tight">{product.name}</h1>
            
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={product.rating} />
                <a href="#reviews" className="text-sm text-espresso-soft hover:text-espresso transition-colors">
                  {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                </a>
              </div>
            )}
            
            <p className="text-espresso-soft text-lg mb-8 leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            <AddToCart product={product} />

            <div className="mt-12 border-t border-taupe/20 pt-8">
              <Accordion items={accordionItems} />
            </div>
          </div>
        </div>

        {/* Full Details Section */}
        <div id="reviews">
          <ProductReviews productId={product.id} reviews={reviews} />
        </div>

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
        
      </div>
      
      <TrustSection />
    </>
  )
}
