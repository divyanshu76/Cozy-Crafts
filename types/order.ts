import { CartItem } from "./cart";

export interface Address {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  address: Address;
  paymentMethod: "cod" | "upi" | "card" | "netbanking";
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: "placed" | "packed" | "shipped" | "delivered";
  createdAt: string;
}
