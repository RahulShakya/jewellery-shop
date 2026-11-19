import {
  buildProductFormData,
  MAX_PRODUCT_IMAGE_BYTES,
  productImageError,
  type ProductWritePayload,
} from './product-form-data';

const payload: ProductWritePayload = {
  name: 'Aurelia Ring',
  sku: 'CL-R-001',
  category_id: 4,
  description: 'A gold ring.',
  stock: 8,
  purity: '18K',
  is_active: true,
  is_featured: false,
  metal_type: 'Gold',
  weight_grams: 5.25,
  metal_price_per_gram: 7200,
  making_charges: 1200,
  shipping_charges: 250,
  taxes: [
    { name: 'CGST', rate: 1.5 },
    { name: 'SGST', rate: 1.5 },
  ],
};

describe('product form data', () => {
  it('serializes product fields, nested taxes and the selected image', () => {
    const image = new File(['image-bytes'], 'aurelia.png', { type: 'image/png' });

    const formData = buildProductFormData(payload, image);

    expect(formData.get('name')).toBe('Aurelia Ring');
    expect(formData.get('category_id')).toBe('4');
    expect(formData.get('is_active')).toBe('1');
    expect(formData.get('is_featured')).toBe('0');
    expect(formData.get('taxes[0][name]')).toBe('CGST');
    expect(formData.get('taxes[1][rate]')).toBe('1.5');
    const storedImage = formData.get('image');
    expect(storedImage).toBeInstanceOf(File);
    expect((storedImage as File).name).toBe('aurelia.png');
    expect((storedImage as File).type).toBe('image/png');
    expect((storedImage as File).size).toBe(image.size);
    expect(formData.has('_method')).toBe(false);
  });

  it('spoofs PATCH for multipart product updates without requiring a replacement image', () => {
    const formData = buildProductFormData(payload, null, true);

    expect(formData.get('_method')).toBe('PATCH');
    expect(formData.has('image')).toBe(false);
  });

  it('rejects unsupported or oversized images', () => {
    const unsupported = new File(['document'], 'details.pdf', { type: 'application/pdf' });
    const oversized = new File([new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1)], 'large.jpg', {
      type: 'image/jpeg',
    });

    expect(productImageError(unsupported)).toBe('Choose a JPG, PNG or WebP image.');
    expect(productImageError(oversized)).toBe('The image must be 5 MB or smaller.');
  });
});
