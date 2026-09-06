import { AnnouncementRibbon } from "@/components/layout/announcement-ribbon"
import { Hero } from "@/components/sections/hero"
import { CategoryTiles } from "@/components/sections/category-tiles"
import { ProductCarousel } from "@/components/products/product-carousel"
import { StorySection } from "@/components/sections/story-section"
import { AboutSection } from "@/components/sections/about-section"
import { FeaturedTabs } from "@/components/sections/featured-tabs"
import { TrustSection } from "@/components/sections/trust-section"
import { Gallery } from "@/components/sections/gallery"
import { TestimonialsMarquee } from "@/components/sections/testimonials-marquee"
import { Newsletter } from "@/components/sections/newsletter"
import { ScrollRevealHeadline } from "@/components/ui/scroll-reveal-headline"
import { getBestSellers, getFeaturedProducts, getNewArrivals } from "@/lib/products"
import { protestRevolution } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export default async function Home() {
  const bestSellers = await getBestSellers();
  const featured = await getFeaturedProducts();
  const newArrivals = await getNewArrivals();

  return (
    <div className="flex flex-col w-full">
      <AnnouncementRibbon />
      <Hero />
      <CategoryTiles />
      
      <section className="py-16 md:py-24 bg-cream overflow-hidden">
        <div className="container mx-auto">
          <div className="px-4 md:px-6 mb-10 text-center">
            <h2 className={cn("text-3xl md:text-4xl text-espresso mb-4", protestRevolution.className)}>Best Sellers</h2>
            <p className="text-espresso-soft">The little things everyone's loving right now.</p>
          </div>
          <ProductCarousel products={bestSellers} />
        </div>
      </section>

      <ScrollRevealHeadline text="Not mass-made. Made with meaning." />

      <StorySection />

      <AboutSection />
      
      <FeaturedTabs featuredProducts={featured} newArrivals={newArrivals} />
      
      <TrustSection />
      <Gallery />
      
      <TestimonialsMarquee />

      <Newsletter />
    </div>
  );
}
