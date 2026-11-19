import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore, type CartItem } from '@carat-line/cart-data';
import { productCategoryName, productImage, productPrice } from '@carat-line/products-data';

@Component({
  selector: 'lib-feature-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './feature-cart.html',
  styleUrl: './feature-cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCart {
  protected readonly cart = inject(CartStore);
  protected readonly productImage = productImage;
  protected readonly productPrice = productPrice;
  protected readonly productCategoryName = productCategoryName;

  protected lineTotal(item: CartItem): number {
    return productPrice(item.product) * item.quantity;
  }
}
