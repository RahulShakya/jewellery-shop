import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '@carat-line/api';
import { Category, PaginatedResponse, Product } from '@carat-line/models';
import { PaginationComponent } from '@carat-line/ui';
import { finalize, forkJoin } from 'rxjs';
import { apiErrorMessage, CollectionResponse, unwrapCollection } from '../../core/admin-api.utils';
import { calculateProductPricing } from './product-pricing';

@Component({
  selector: 'admin-products-page',
  imports: [CurrencyPipe, DecimalPipe, PaginationComponent, RouterLink],
  templateUrl: './products.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly api = inject(ApiService);
  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly products = signal<readonly Product[]>([]);
  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly selectedCategoryId = signal('0');
  protected readonly currentPage = signal(1);
  protected readonly totalProducts = signal(0);
  protected readonly perPage = 20;
  protected readonly viewingProduct = signal<Product | null>(null);
  protected readonly productToDelete = signal<Product | null>(null);

  protected readonly viewedPrice = computed(() => {
    const product = this.viewingProduct();
    if (!product) {
      return null;
    }

    if (product.price_breakdown) {
      return product.price_breakdown;
    }

    if (product.metal_price_per_gram == null || product.weight_grams == null) {
      return null;
    }

    return calculateProductPricing({
      weight_grams: product.weight_grams,
      metal_price_per_gram: product.metal_price_per_gram,
      making_charges: product.making_charges ?? 0,
      shipping_charges: product.shipping_charges ?? 0,
      taxes: product.taxes ?? [],
    });
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
    });
    this.loadProducts();
  }

  protected loadProducts(page = 1): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const search = this.searchTerm().trim();
    const categoryId =
      this.selectedCategoryId().trim() !== '0' ? this.selectedCategoryId().trim() : undefined;

    forkJoin({
      products: this.api.get<PaginatedResponse<Product>>('admin/products', {
        params: {
          page,
          per_page: this.perPage,
          ...(search ? { search } : {}),
          ...(categoryId ? { category_id: categoryId } : {}),
        },
      }),
      categories: this.api.get<CollectionResponse<Category>>('admin/categories'),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ products, categories }) => {
          this.products.set(products.data);
          this.currentPage.set(products.meta.current_page);
          this.totalProducts.set(products.meta.total);
          this.categories.set(unwrapCollection(categories));
        },
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }

  protected searchProducts(value: string): void {
    this.searchTerm.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadProducts(1), 300);
  }

  protected filterByCategory(id: string): void {
    this.selectedCategoryId.set(id);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadProducts(1), 300);
  }

  protected openView(product: Product): void {
    this.viewingProduct.set(product);
  }

  protected closeView(): void {
    this.viewingProduct.set(null);
  }

  protected confirmDelete(product: Product): void {
    this.productToDelete.set(product);
  }

  protected displayPrice(product: Product): number {
    return Number(
      product.final_price ??
        product.price_breakdown?.final_price ??
        product.sale_price ??
        product.price,
    );
  }

  protected isAvailable(product: Product): boolean {
    return product.available ?? ((product.is_active ?? true) && product.stock > 0);
  }

  protected availabilityLabel(product: Product): string {
    if (product.is_active === false) {
      return 'Inactive';
    }

    return product.stock > 0 ? 'Available' : 'Out of stock';
  }

  protected deleteProduct(): void {
    const product = this.productToDelete();
    if (!product || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.api
      .delete<void>(`admin/products/${product.id}`)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.products.update((products) => products.filter((item) => item.id !== product.id));
          this.totalProducts.update((total) => Math.max(0, total - 1));
          this.productToDelete.set(null);
        },
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }
}
