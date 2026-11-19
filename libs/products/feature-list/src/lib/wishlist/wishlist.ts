import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistStore } from '@carat-line/products-data';
import { ProductCard } from '@carat-line/product-ui';

@Component({
  selector: 'lib-wishlist',
  imports: [ProductCard, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wishlist {
  protected readonly wishlist = inject(WishlistStore);
}
