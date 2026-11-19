import { computed, Injectable, signal } from '@angular/core';
import type { CatalogProduct } from './product.types';

const STORAGE_KEY = 'carat-line:wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly productsState = signal<CatalogProduct[]>(this.read());

  readonly products = this.productsState.asReadonly();
  readonly count = computed(() => this.productsState().length);

  has(productId: number): boolean {
    return this.productsState().some((product) => product.id === productId);
  }

  toggle(product: CatalogProduct): boolean {
    const next = this.has(product.id)
      ? this.productsState().filter((item) => item.id !== product.id)
      : [...this.productsState(), product];
    this.productsState.set(next);
    this.persist(next);
    return this.has(product.id);
  }

  remove(productId: number): void {
    const next = this.productsState().filter((product) => product.id !== productId);
    this.productsState.set(next);
    this.persist(next);
  }

  private read(): CatalogProduct[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(value) ? (value as CatalogProduct[]) : [];
    } catch {
      return [];
    }
  }

  private persist(products: CatalogProduct[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }
}
