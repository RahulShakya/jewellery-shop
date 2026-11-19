import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartStore } from '@carat-line/cart-data';
import {
  ProductService,
  WishlistStore,
  productCategoryName,
  productImage,
  productOriginalPrice,
  productPrice,
  type CatalogProduct,
} from '@carat-line/products-data';
import { finalize, switchMap } from 'rxjs';

@Component({
  selector: 'lib-product-detail',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartStore);

  protected readonly wishlist = inject(WishlistStore);
  protected readonly product = signal<CatalogProduct | null>(null);
  protected readonly quantity = signal(1);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly added = signal(false);
  protected readonly productImage = productImage;
  protected readonly productPrice = productPrice;
  protected readonly productOriginalPrice = productOriginalPrice;
  protected readonly productCategoryName = productCategoryName;

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set('');
          return this.productsApi.getBySlug(params.get('slug') ?? '');
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.product.set('data' in response ? response.data : response);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('This piece is not available right now.');
        },
      });
  }

  protected changeQuantity(amount: number): void {
    const stock = Number(this.product()?.stock) || 1;
    this.quantity.update((quantity) => Math.min(stock, Math.max(1, quantity + amount)));
  }

  protected addToBag(): void {
    const product = this.product();
    if (product) {
      this.cart.add(product, this.quantity());
      this.added.set(true);
      setTimeout(() => this.added.set(false), 1800);
    }
  }
}
