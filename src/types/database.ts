export type UserRole = "admin" | "customer";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  ingredients: string | null;
  image_urls: string[];
  stock: number;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  shipping_name: string;
  shipping_postal_code: string;
  shipping_address: string;
  shipping_phone: string;
  shipping_fee: number;
  created_at: string;
  order_items?: OrderItem[];
  order_payments?: OrderPayment[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  stripe_session_id: string | null;
  amount: number;
  status: PaymentStatus;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface ShippingSettings {
  fee: number;
  free_threshold: number;
}
