import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@carat-line/auth';
import { CartStore } from '@carat-line/cart-data';
import { WishlistStore } from '@carat-line/products-data';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly cart = inject(CartStore);
  protected readonly wishlist = inject(WishlistStore);
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  constructor() {
    this.auth.ensureInitialized().subscribe();
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
