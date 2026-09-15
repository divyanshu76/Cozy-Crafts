import { getPaginatedProductsByCategory, getCategoryTitle, getCategories } from "@/lib/products"
import { ProductGrid } from "@/components/products/product-grid"
import { Pagination } from "@/components/ui/pagination"
import { notFound } from "next/navigation"

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const categoriesList = await getCategories();
  const realCategories = categoriesList.map((category) => ({
    category: category.slug,
  }));
  return [
    ...realCategories,
    { category: "new-arrivals" },
    { category: "best-sellers" },
  ];
}

export async function generateMetadata(props: CategoryPageProps) {
  const params = await props.params;
  const title = getCategoryTitle(params.category);
  const categoriesList = await getCategories();
  const categoryData = categoriesList.find(c => c.slug === params.category);

  return {
    title: `${title} | Cozy Craft`,
    description: categoryData?.description || `Explore our collection of ${title ? title.toLowerCase() : ''}`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 16;

  const { products, total } = await getPaginatedProductsByCategory(resolvedParams.category, page, limit);
  const totalPages = Math.ceil(total / limit);

  const categoriesList = await getCategories();
  
  const isVirtual = resolvedParams.category === "new-arrivals" || resolvedParams.category === "best-sellers";
  const categoryData = categoriesList.find(c => c.slug === resolvedParams.category);
                          
  if (!categoryData && !isVirtual) {
    notFound();
  }

  const title = getCategoryTitle(resolvedParams.category);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl md:text-5xl text-espresso mb-4">{title}</h1>
        {categoryData?.description && (
          <p className="text-espresso-soft max-w-2xl mx-auto">
            {categoryData.description}
          </p>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-8 border-b border-taupe/20 pb-4">
        <p className="text-sm text-espresso-soft">{total} products</p>
      </div>

      {products.length > 0 ? (
        <div className="space-y-12">
          <ProductGrid products={products} />
          <Pagination totalPages={totalPages} />
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-espresso-soft">No products in this category yet.</p>
        </div>
      )}
    </div>
  )
}
