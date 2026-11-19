import { catalogMetals } from './product.types';

describe('catalogMetals', () => {
  it('accepts a wrapped response and returns unique sorted values', () => {
    expect(catalogMetals({ data: { metals: ['Silver', ' Gold ', 'Silver', ''] } })).toEqual([
      'Gold',
      'Silver',
    ]);
  });

  it('accepts an unwrapped metals array', () => {
    expect(catalogMetals(['Platinum', 'Gold'])).toEqual(['Gold', 'Platinum']);
  });
});
