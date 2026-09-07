export interface ProductVariant {
  id: string;
  label: string; // e.g. "Pink", "Small"
  stock: number;
  priceOverride?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  images: string[]; // paths under /public/products/...
  category: string; // category slug
  subcategory?: string;
  tags: string[];
  stock: number;
  variants?: ProductVariant[];
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  rating: number; // 0-5, derived from reviews
  reviewCount: number;
  offer_enabled: boolean;
  offer_end_at: string | null;
  materials: string[];
  features?: string[];
  careInstructions: string;
  personalizationAvailable: boolean;
  createdAt: string;
}
