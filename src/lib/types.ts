export type Variant = {
  size: number; // EU
  sku: string;
  stockQty: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "mens" | "womens" | "kids" | "sale";
  categoryLabel: string;
  subtitle: string;
  colour: string;
  colourway: string[];
  price: number; // LKR
  compareAtPrice?: number;
  images: string[];
  description: string;
  details: string[];
  variants: Variant[];
  isNew?: boolean;
  rating: number;
  reviewCount: number;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  colour: string;
  image: string;
  size: number;
  price: number;
  qty: number;
  maxQty: number;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    district: string;
    notes?: string;
  };
  lines: CartLine[];
  subtotal: number;
  delivery: number;
  total: number;
  paymentMethod: "COD";
  status: "Pending";
};
