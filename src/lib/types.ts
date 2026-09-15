export type ColourVariant = {
  colour: string
  sku: string
  stockQty: number
}

export type Variant = {
  size: number; // EU
  colours?: ColourVariant[]  // per-colour stock per size
  sku?: string;              // legacy
  stockQty?: number;         // legacy
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  subCategory?: string;       // slug of 2nd-level category
  subSubCategory?: string;    // slug of 3rd-level category
  categories?: string[];
  categoryLabels?: string[];
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
  isBestseller?: boolean;
  isFeatured?: boolean;
  featuredOrder?: number;
  rating?: number;
  reviewCount?: number;
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
  discountAmount?: number;
  discountCode?: string;
  total: number;
  paymentMethod: "COD";
  status: "Pending";
};

