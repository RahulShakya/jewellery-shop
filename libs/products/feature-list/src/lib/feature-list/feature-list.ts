import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ProductService,
  catalogMetals,
  type CatalogCategory,
  type CatalogPage,
  type CatalogProduct,
  type ProductQuery,
} from '@carat-line/products-data';
import { finalize } from 'rxjs';
import { ProductCard } from '@carat-line/product-ui';

@Component({
  selector: 'lib-feature-list',
  imports: [ProductCard, RouterLink],
  templateUrl: './feature-list.html',
  styleUrl: './feature-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureList implements OnInit {
  private readonly productsApi = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly categories = signal<CatalogCategory[]>([]);
  protected readonly metals = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly metal = signal('');
  protected readonly minPrice = signal('');
  protected readonly maxPrice = signal('');
  protected readonly sort = signal<ProductQuery['sort']>('featured');
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly lastPage = signal(1);
  protected readonly pages = computed(() =>
    Array.from({ length: this.lastPage() }, (_, index) => index + 1).filter(
      (page) => page === 1 || page === this.lastPage() || Math.abs(page - this.page()) <= 1,
    ),
  );

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const requestedSort = params.get('sort') as ProductQuery['sort'];
    const requestedPage = Number(params.get('page'));
    this.search.set(params.get('q') ?? '');
    this.category.set(params.get('category') ?? '');
    this.metal.set(params.get('metal') ?? '');
    this.minPrice.set(params.get('minPrice') ?? '');
    this.maxPrice.set(params.get('maxPrice') ?? '');
    if (
      ['featured', 'newest', 'price-asc', 'price-desc', 'name-asc', 'name-desc'].includes(
        requestedSort ?? '',
      )
    ) {
      this.sort.set(requestedSort);
    }
    if (Number.isInteger(requestedPage) && requestedPage > 1) {
      this.page.set(requestedPage);
    }
    this.loadCategories();
    this.loadFilterOptions();
    this.loadProducts();
  }

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected updateCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
    this.applyFilters();
  }

  protected updateMetal(event: Event): void {
    this.metal.set((event.target as HTMLSelectElement).value);
    this.applyFilters();
  }

  protected updateMinPrice(event: Event): void {
    this.minPrice.set((event.target as HTMLInputElement).value);
  }

  protected updateMaxPrice(event: Event): void {
    this.maxPrice.set((event.target as HTMLInputElement).value);
  }

  protected updateSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as ProductQuery['sort']);
    this.applyFilters();
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.loadProducts();
  }

  protected resetFilters(): void {
    this.search.set('');
    this.category.set('');
    this.metal.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.sort.set('featured');
    this.applyFilters();
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage() && page !== this.page()) {
      this.page.set(page);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');
    const query: ProductQuery = {
      search: this.search().trim() || undefined,
      category: this.category() || undefined,
      metal: this.metal() || undefined,
      minPrice: this.numberOrUndefined(this.minPrice()),
      maxPrice: this.numberOrUndefined(this.maxPrice()),
      sort: this.sort(),
      page: this.page(),
      perPage: 12,
    };

    void this.router.navigate([], {
      queryParams: {
        q: query.search,
        category: query.category,
        metal: query.metal,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        sort: query.sort === 'featured' ? undefined : query.sort,
        page: query.page === 1 ? undefined : query.page,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.productsApi
      .list(query)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.setPage(response),
        error: () => this.error.set('The collection could not be loaded. Please try again.'),
      });
  }

  private loadCategories(): void {
    this.productsApi
      .categories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.categories.set(Array.isArray(response) ? response : response.data),
        error: () => this.categories.set([]),
      });
  }

  private loadFilterOptions(): void {
    this.productsApi
      .filterOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.metals.set(catalogMetals(response)),
        error: () => this.metals.set([]),
      });
  }

  private setPage(response: CatalogPage): void {
    this.products.set(response.data ?? []);
    this.total.set(response.meta?.total ?? response.total ?? response.data?.length ?? 0);
    this.lastPage.set(response.meta?.last_page ?? response.last_page ?? 1);
    this.page.set(response.meta?.current_page ?? response.current_page ?? this.page());
  }

  private numberOrUndefined(value: string): number | undefined {
    const parsed = Number(value);
    return value && Number.isFinite(parsed) ? parsed : undefined;
  }
}
