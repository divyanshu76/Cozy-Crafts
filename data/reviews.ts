import { Review } from "@/types/review";

export const reviews: Review[] = [
  {
    id: "rev-001",
    productId: "prod-001",
    name: "Aarti",
    rating: 5,
    text: "So cute! It's much softer than I expected and the colors are lovely. Looks great on my backpack.",
    verified: true,
    createdAt: "2023-10-10T10:00:00Z",
  },
  {
    id: "rev-002",
    productId: "prod-001",
    name: "Sneha",
    rating: 4,
    text: "Really pretty keychain, but the ring was slightly hard to open. Otherwise, I love the handmade feel.",
    verified: true,
    createdAt: "2023-10-12T14:30:00Z",
  },
  {
    id: "rev-003",
    productId: "prod-002",
    name: "Priya",
    rating: 5,
    text: "Bought this as a tiny gift for my friend's desk. She loved it! The personalization note was a sweet touch.",
    verified: true,
    createdAt: "2023-10-20T09:15:00Z",
  }
];
