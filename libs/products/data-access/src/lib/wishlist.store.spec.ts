import { WishlistStore } from './wishlist.store';
import type { CatalogProduct } from './product.types';

describe('WishlistStore', () => {
  const product = {
    id: 7,
    name: 'Solitaire ring',
    slug: 'solitaire-ring',
    price: 42000,
  } as CatalogProduct;

  beforeEach(() => localStorage.clear());

  it('toggles products without duplicates', () => {
    const store = new WishlistStore();
    expect(store.toggle(product)).toBe(true);
    expect(store.count()).toBe(1);
    expect(store.toggle(product)).toBe(false);
    expect(store.count()).toBe(0);
  });
});
