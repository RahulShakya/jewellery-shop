import {
  buildCategoryFormData,
  categoryImageError,
  MAX_CATEGORY_IMAGE_BYTES,
  type CategoryWritePayload,
} from './category-form-data';

const payload: CategoryWritePayload = {
  name: 'Gold Rings',
  slug: 'gold-rings',
  description: 'Fine gold rings.',
  is_active: true,
};

describe('category form data', () => {
  it('serializes category fields and the selected image', () => {
    const image = new File(['image-bytes'], 'gold-rings.png', { type: 'image/png' });

    const formData = buildCategoryFormData(payload, image);

    expect(formData.get('name')).toBe('Gold Rings');
    expect(formData.get('slug')).toBe('gold-rings');
    expect(formData.get('description')).toBe('Fine gold rings.');
    expect(formData.get('is_active')).toBe('1');
    const storedImage = formData.get('image');
    expect(storedImage).toBeInstanceOf(File);
    expect((storedImage as File).name).toBe('gold-rings.png');
    expect(formData.has('_method')).toBe(false);
  });

  it('spoofs PATCH without requiring a replacement image', () => {
    const formData = buildCategoryFormData(payload, null, true);

    expect(formData.get('_method')).toBe('PATCH');
    expect(formData.has('image')).toBe(false);
  });

  it('rejects unsupported or oversized images', () => {
    const unsupported = new File(['document'], 'category.pdf', { type: 'application/pdf' });
    const oversized = new File(
      [new Uint8Array(MAX_CATEGORY_IMAGE_BYTES + 1)],
      'large-category.jpg',
      { type: 'image/jpeg' },
    );

    expect(categoryImageError(unsupported)).toBe('Choose a JPG, PNG or WebP image.');
    expect(categoryImageError(oversized)).toBe('The image must be 5 MB or smaller.');
  });
});
