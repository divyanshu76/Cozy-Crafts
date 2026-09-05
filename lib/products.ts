import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { reviews } from "@/data/reviews";
import { Product } from "@/types/product";

export async function getProducts(): Promise<Product[]> {
  // Simulating network delay for realistic loading states
  await new Promise((resolve) => setTimeout(resolve, 300));
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return products.find((p) => p.slug === slug);
}

const VIRTUAL_CATEGORY_FILTERS: Record<string, (p: Product) => boolean> = {
  "new-arrivals": (p) => p.isNew,
  "best-sellers": (p) => p.isBestSeller,
};

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const virtualFilter = VIRTUAL_CATEGORY_FILTERS[categorySlug];
  if (virtualFilter) {
    return products.filter(virtualFilter);
  }
  return products.filter((p) => p.category === categorySlug);
}

const CATEGORY_TITLES: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  "best-sellers": "Best Sellers",
};

export function getCategoryTitle(categorySlug: string): string {
  return (
    CATEGORY_TITLES[categorySlug] ??
    categories.find((c) => c.slug === categorySlug)?.name ??
    categorySlug
  );
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return products.filter((p) => p.isFeatured);
}

export async function getBestSellers(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return products.filter((p) => p.isBestSeller);
}

export async function getNewArrivals(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return products.filter((p) => p.isNew);
}

export async function getCategories() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return categories;
}

export { categories };

export async function getReviewsForProduct(productId: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return reviews.filter((r) => r.productId === productId);
}

export async function searchProducts(query: string): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const lowercaseQuery = query.toLowerCase();
  return products.filter((p) => 
    p.name.toLowerCase().includes(lowercaseQuery) || 
    p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    p.description.toLowerCase().includes(lowercaseQuery)
  );
}
