import { buildProductPricingPayload, calculateProductPricing } from './product-pricing';

describe('product pricing', () => {
  it('calculates metal value and multiple tax lines', () => {
    const price = calculateProductPricing({
      weight_grams: 10,
      metal_price_per_gram: 6500,
      making_charges: 5000,
      shipping_charges: 500,
      taxes: [
        { name: 'GST', rate: 3 },
        { name: 'Local levy', rate: 1.5 },
      ],
    });

    expect(price).toEqual({
      metal_value: 65000,
      making_charges: 5000,
      shipping_charges: 500,
      subtotal: 70500,
      taxes: [
        { name: 'GST', rate: 3, amount: 2115 },
        { name: 'Local levy', rate: 1.5, amount: 1057.5 },
      ],
      tax_total: 3172.5,
      final_price: 73672.5,
    });
  });

  it('rounds each tax line to two decimal places', () => {
    const price = calculateProductPricing({
      weight_grams: 1,
      metal_price_per_gram: 100.01,
      making_charges: 0,
      shipping_charges: 0,
      taxes: [
        { name: 'Tax A', rate: 3.333 },
        { name: 'Tax B', rate: 2.777 },
      ],
    });

    expect(price.taxes.map((tax) => tax.amount)).toEqual([3.33, 2.78]);
    expect(price.tax_total).toBe(6.11);
    expect(price.final_price).toBe(106.12);
  });

  it('builds a write payload containing inputs rather than computed totals', () => {
    const payload = buildProductPricingPayload({
      metal_type: ' 18K Yellow Gold ',
      weight_grams: '4.25',
      metal_price_per_gram: '7225',
      making_charges: '1250.555',
      shipping_charges: 250,
      taxes: [{ name: ' GST ', rate: '3' }],
    });

    expect(payload).toEqual({
      metal_type: '18K Yellow Gold',
      weight_grams: 4.25,
      metal_price_per_gram: 7225,
      making_charges: 1250.56,
      shipping_charges: 250,
      taxes: [{ name: 'GST', rate: 3 }],
    });
    expect(payload).not.toHaveProperty('final_price');
    expect(payload).not.toHaveProperty('tax_total');
  });
});
