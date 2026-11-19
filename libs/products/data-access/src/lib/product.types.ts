import type { ApiResponse, Category, PaginatedResponse, Product } from '@carat-line/models';

export type CatalogCategory = Category & {
  description?: string | null;
  image_url?: string | null;
  product_count?: number;
};

export interface CatalogTax {
  name: string;
  rate: number;
}

export interface CatalogTaxBreakdown extends CatalogTax {
  amount: number;
}

export interface CatalogPriceBreakdown {
  metal_value: number;
  making_charges: number;
  shipping_charges: number;
  subtotal: number;
  taxes: CatalogTaxBreakdown[];
  tax_total: number;
  final_price: number;
}

export type CatalogProduct = Product & {
  category?: CatalogCategory | string | null;
  category_id?: number | null;
  sale_price?: number | string | null;
  final_price?: number | string | null;
  compare_at_price?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  images?: Array<string | { url?: string | null }>;
  material?: string | null;
  metal?: string | null;
  purity?: string | null;
  weight?: number | string | null;
  metal_price_per_gram?: number | string | null;
  making_charges?: number | string;
  shipping_charges?: number | string;
  taxes?: CatalogTax[];
  available?: boolean;
  price_breakdown?: CatalogPriceBreakdown | null;
  is_featured?: boolean;
  short_description?: string | null;
};

export type CatalogPage = PaginatedResponse<CatalogProduct> & {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export interface CatalogFilterOptions {
  metals: string[];
}

export type CatalogFilterOptionsResponse =
  ApiResponse<CatalogFilterOptions | string[]> | CatalogFilterOptions | string[];

export interface ProductQuery {
  search?: string;
  category?: string;
  metal?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest';
  page?: number;
  perPage?: number;
  featured?: boolean;
}

export function catalogMetals(response: CatalogFilterOptionsResponse): string[] {
  const payload = Array.isArray(response)
    ? response
    : 'data' in response
      ? response.data
      : response;
  const metals = Array.isArray(payload) ? payload : payload.metals;

  return [...new Set(metals.map((metal) => metal.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function productPrice(product: CatalogProduct): number {
  const value = product.final_price ?? product.sale_price ?? product.price;
  return Number(value) || 0;
}

export function productOriginalPrice(product: CatalogProduct): number | null {
  const value = product.compare_at_price ?? product.price;
  const original = Number(value);
  return original > productPrice(product) ? original : null;
}

export function productImage(product: CatalogProduct): string {
  const firstImage = product.images?.[0];
  const nestedImage = typeof firstImage === 'object' ? firstImage?.url : firstImage;
  return product.image_url ?? product.image ?? nestedImage ?? 'assets/images/hero-jewellery.png';
}

export function productCategoryName(product: CatalogProduct): string {
  if (typeof product.category === 'string') {
    return product.category;
  }

  return product.category?.name ?? 'Fine jewellery';
}
