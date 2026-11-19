import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '@carat-line/cart-data';
import {
  productCategoryName,
  productImage,
  productOriginalPrice,
  productPrice,
  WishlistStore,
  type CatalogProduct,
} from '@carat-line/products-data';

@Component({
  selector: 'lib-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<CatalogProduct>();

  private readonly cart = inject(CartStore);
  protected readonly wishlist = inject(WishlistStore);
  protected readonly added = signal(false);
  protected readonly productImage = productImage;
  protected readonly productPrice = productPrice;
  protected readonly productOriginalPrice = productOriginalPrice;
  protected readonly productCategoryName = productCategoryName;

  protected addToBag(): void {
    this.cart.add(this.product());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1800);
  }
}
