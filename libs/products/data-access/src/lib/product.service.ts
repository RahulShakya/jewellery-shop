import { inject, Injectable } from '@angular/core';
import { ApiService } from '@carat-line/api';
import type { ApiResponse } from '@carat-line/models';
import type { Observable } from 'rxjs';
import type {
  CatalogCategory,
  CatalogFilterOptionsResponse,
  CatalogPage,
  CatalogProduct,
  ProductQuery,
} from './product.types';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  list(query: ProductQuery = {}): Observable<CatalogPage> {
    const params = new URLSearchParams();
    this.append(params, 'search', query.search);
    this.append(params, 'category', query.category);
    this.append(params, 'metal', query.metal);
    this.append(params, 'min_price', query.minPrice);
    this.append(params, 'max_price', query.maxPrice);
    this.append(params, 'sort', query.sort);
    this.append(params, 'page', query.page);
    this.append(params, 'per_page', query.perPage);
    this.append(params, 'featured', query.featured ? 1 : undefined);

    const queryString = params.toString();
    return this.api.get<CatalogPage>(`products${queryString ? `?${queryString}` : ''}`);
  }

  featured(limit = 4): Observable<CatalogPage> {
    return this.list({ featured: true, perPage: limit });
  }

  getBySlug(slug: string): Observable<ApiResponse<CatalogProduct> | CatalogProduct> {
    return this.api.get<ApiResponse<CatalogProduct> | CatalogProduct>(
      `products/${encodeURIComponent(slug)}`,
    );
  }

  categories(): Observable<ApiResponse<CatalogCategory[]> | CatalogCategory[]> {
    return this.api.get<ApiResponse<CatalogCategory[]> | CatalogCategory[]>('categories');
  }

  filterOptions(): Observable<CatalogFilterOptionsResponse> {
    return this.api.get<CatalogFilterOptionsResponse>('products/filter-options');
  }

  private append(params: URLSearchParams, key: string, value: string | number | undefined): void {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
}
