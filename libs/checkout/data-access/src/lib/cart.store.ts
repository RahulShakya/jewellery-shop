import { computed, Injectable, signal } from '@angular/core';
import { productPrice, type CatalogProduct } from '@carat-line/products-data';

const STORAGE_KEY = 'carat-line:cart';

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly itemsState = signal<CartItem[]>(this.read());

  readonly items = this.itemsState.asReadonly();
  readonly itemCount = computed(() =>
    this.itemsState().reduce((total, item) => total + item.quantity, 0),
  );
  readonly metalValue = computed(() =>
    this.itemsState().reduce(
      (total, item) =>
        total +
        this.breakdownAmount(item.product, 'metal_value', productPrice(item.product)) *
          item.quantity,
      0,
    ),
  );
  readonly makingCharges = computed(() =>
    this.itemsState().reduce(
      (total, item) => total + this.breakdownAmount(item.product, 'making_charges') * item.quantity,
      0,
    ),
  );
  readonly shippingCharges = computed(() =>
    this.itemsState().reduce(
      (total, item) =>
        total + this.breakdownAmount(item.product, 'shipping_charges') * item.quantity,
      0,
    ),
  );
  readonly subtotal = computed(() =>
    this.itemsState().reduce(
      (total, item) =>
        total +
        this.breakdownAmount(item.product, 'subtotal', productPrice(item.product)) * item.quantity,
      0,
    ),
  );
  readonly taxTotal = computed(() =>
    this.itemsState().reduce(
      (total, item) => total + this.breakdownAmount(item.product, 'tax_total') * item.quantity,
      0,
    ),
  );
  readonly total = computed(() =>
    this.itemsState().reduce(
      (total, item) => total + productPrice(item.product) * item.quantity,
      0,
    ),
  );
  readonly empty = computed(() => this.itemsState().length === 0);

  add(product: CatalogProduct, quantity = 1): void {
    const maxQuantity = this.maximumQuantity(product);
    if (maxQuantity === 0) {
      return;
    }

    const existing = this.itemsState().find((item) => item.product.id === product.id);
    const requestedQuantity = Math.max(1, Math.floor(quantity));
    const nextQuantity = existing ? existing.quantity + requestedQuantity : requestedQuantity;
    const next = existing
      ? this.itemsState().map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: Math.min(nextQuantity, maxQuantity) }
            : item,
        )
      : [...this.itemsState(), { product, quantity: Math.min(quantity, maxQuantity) }];
    this.update(next);
  }

  setQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }

    const next = this.itemsState().map((item) => {
      const maxQuantity = this.maximumQuantity(item.product);
      return item.product.id === productId
        ? { ...item, quantity: Math.min(Math.floor(quantity), maxQuantity) }
        : item;
    });
    this.update(next.filter((item) => item.quantity > 0));
  }

  remove(productId: number): void {
    this.update(this.itemsState().filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.update([]);
  }

  private update(items: CartItem[]): void {
    this.itemsState.set(items);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }

  private read(): CartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) {
        return [];
      }

      return (value as CartItem[])
        .map((item) => ({
          ...item,
          quantity: Math.min(
            Math.max(1, Math.floor(item.quantity)),
            this.maximumQuantity(item.product),
          ),
        }))
        .filter((item) => item.quantity > 0);
    } catch {
      return [];
    }
  }

  private maximumQuantity(product: CatalogProduct): number {
    const stock = Number(product.stock);
    return Number.isFinite(stock) ? Math.max(0, Math.min(10, Math.floor(stock))) : 10;
  }

  private breakdownAmount(
    product: CatalogProduct,
    key: 'metal_value' | 'making_charges' | 'shipping_charges' | 'subtotal' | 'tax_total',
    fallback = 0,
  ): number {
    const amount = Number(product.price_breakdown?.[key]);
    return Number.isFinite(amount) ? amount : fallback;
  }
}
