import { safeReturnUrl } from './auth-return-url';

describe('safeReturnUrl', () => {
  it('preserves an internal checkout URL', () => {
    expect(safeReturnUrl('/checkout?step=review')).toBe('/checkout?step=review');
  });

  it('rejects protocol-relative and external URLs', () => {
    expect(safeReturnUrl('//malicious.example')).toBe('/');
    expect(safeReturnUrl('https://malicious.example')).toBe('/');
  });
});
