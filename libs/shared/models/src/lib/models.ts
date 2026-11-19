export type UserRole = 'customer' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  image?: string | null;
  products_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
}

export interface ProductTax {
  name: string;
  rate: number;
  amount?: number;
}

export interface ProductPriceBreakdown {
  metal_value: number;
  making_charges: number;
  shipping_charges: number;
  subtotal: number;
  taxes: ProductTax[];
  tax_total: number;
  final_price: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  description: string | null;
  short_description?: string | null;
  price: number;
  sale_price?: number | null;
  final_price?: number;
  compare_at_price?: number | null;
  metal_type?: string | null;
  weight_grams?: number | null;
  metal_price_per_gram?: number | null;
  metal_value?: number;
  making_charges?: number;
  shipping_charges?: number;
  taxes?: ProductTax[];
  tax_total?: number;
  price_subtotal?: number;
  price_breakdown?: ProductPriceBreakdown;
  stock: number;
  image_url?: string | null;
  image?: string | null;
  images?: ProductImage[] | string[];
  category?: Category | null;
  category_id?: number | null;
  material?: string | null;
  purity?: string | null;
  gemstone?: string | null;
  weight?: number | string | null;
  available?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = 'placed' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending_cod' | 'collected' | 'failed';
export type ProductFilterOptionsByCategory = 'gold' | 'silver' | 'diamond' | 'gemstone' | 'other';
export type ProductFilterOptionsByMaterial = 'gold' | 'silver' | 'diamond' | 'gemstone' | 'other';
export interface OrderItem {
  id: number;
  product_id: number | null;
  product?: Product;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
  pricing_breakdown?: ProductPriceBreakdown | null;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number | null;
  user?: User | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  city: string;
  pincode: string;
  subtotal: number;
  gst: number;
  tax_amount?: number;
  total: number;
  payment_method: 'cod' | string;
  payment_status: PaymentStatus;
  status: OrderStatus;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links?: PaginationLink[];
  path?: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: PaginationLinks;
}

export type ValidationErrors = Record<string, string[]>;

export interface LaravelErrorResponse {
  message: string;
  errors?: ValidationErrors;
}
