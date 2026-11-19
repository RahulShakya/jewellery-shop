import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  ProductService,
  type CatalogCategory,
  type CatalogProduct,
} from '@carat-line/products-data';
import { ProductCard } from '@carat-line/product-ui';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [ProductCard, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly productsApi = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly featured = signal<CatalogProduct[]>([]);
  protected readonly loading = signal(true);
  protected readonly categories = signal<CatalogCategory[]>([
    { id: -1, name: 'Rings', slug: 'rings' } as CatalogCategory,
    { id: -2, name: 'Necklaces', slug: 'necklaces' } as CatalogCategory,
    { id: -3, name: 'Earrings', slug: 'earrings' } as CatalogCategory,
    { id: -4, name: 'Bracelets', slug: 'bracelets' } as CatalogCategory,
  ]);

  constructor() {
    this.productsApi
      .featured(4)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.featured.set(response.data ?? []),
        error: () => this.featured.set([]),
      });

    this.productsApi
      .categories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const categories = Array.isArray(response) ? response : response.data;
          if (categories.length) this.categories.set(categories.slice(0, 4));
        },
        error: () => undefined,
      });
  }
}
