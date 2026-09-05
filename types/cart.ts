export interface CartItem {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  giftNote?: string;
  // Denormalized snapshot — stored in localStorage for display purposes.
  // The server re-prices everything from the DB at checkout; these are
  // only used for UI rendering (cart drawer, checkout summary).
  name: string;
  price: number;
  image?: string;
  slug?: string;
}
