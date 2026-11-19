import type { CatalogProduct } from '@carat-line/products-data';
import { CartStore } from './cart.store';

describe('CartStore', () => {
  const ring = {
    id: 1,
    slug: 'ring',
    name: 'Ring',
    price: 1184.5,
    stock: 3,
    price_breakdown: {
      metal_value: 1000,
      making_charges: 100,
      shipping_charges: 50,
      subtotal: 1150,
      taxes: [{ name: 'GST', rate: 3, amount: 34.5 }],
      tax_total: 34.5,
      final_price: 1184.5,
    },
  } as CatalogProduct;

  beforeEach(() => localStorage.clear());

  it('aggregates the authoritative product price breakdown', () => {
    const store = new CartStore();
    store.add(ring);
    store.add(ring, 2);
    expect(store.itemCount()).toBe(3);
    expect(store.metalValue()).toBe(3000);
    expect(store.makingCharges()).toBe(300);
    expect(store.shippingCharges()).toBe(150);
    expect(store.subtotal()).toBe(3450);
    expect(store.taxTotal()).toBe(103.5);
    expect(store.total()).toBe(3553.5);
  });

  it('treats a legacy product price as tax-inclusive', () => {
    const store = new CartStore();
    store.add({ ...ring, price: 1000, price_breakdown: undefined });

    expect(store.subtotal()).toBe(1000);
    expect(store.taxTotal()).toBe(0);
    expect(store.total()).toBe(1000);
  });

  it('removes a line when its quantity reaches zero', () => {
    const store = new CartStore();
    store.add(ring);
    store.setQuantity(ring.id, 0);
    expect(store.empty()).toBe(true);
  });

  it('caps a line at the checkout quantity limit', () => {
    const store = new CartStore();
    store.add({ ...ring, stock: 20 }, 12);
    expect(store.itemCount()).toBe(10);
  });

  it('does not add an out-of-stock product', () => {
    const store = new CartStore();
    store.add({ ...ring, stock: 0 });
    expect(store.empty()).toBe(true);
  });
});
