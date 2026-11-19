export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ProductWritePayload {
  name: string;
  sku: string;
  category_id: number;
  description: string;
  stock: number;
  purity: string | null;
  is_active: boolean;
  is_featured: boolean;
  metal_type: string;
  weight_grams: number;
  metal_price_per_gram: number;
  making_charges: number;
  shipping_charges: number;
  taxes: ReadonlyArray<{ name: string; rate: number }>;
}

export function buildProductFormData(
  payload: ProductWritePayload,
  image: File | null,
  spoofPatch = false,
): FormData {
  const formData = new FormData();

  if (spoofPatch) {
    formData.append('_method', 'PATCH');
  }

  formData.append('name', payload.name);
  formData.append('sku', payload.sku);
  formData.append('category_id', String(payload.category_id));
  formData.append('description', payload.description);
  formData.append('stock', String(payload.stock));
  formData.append('purity', payload.purity ?? '');
  formData.append('is_active', payload.is_active ? '1' : '0');
  formData.append('is_featured', payload.is_featured ? '1' : '0');
  formData.append('metal_type', payload.metal_type);
  formData.append('weight_grams', String(payload.weight_grams));
  formData.append('metal_price_per_gram', String(payload.metal_price_per_gram));
  formData.append('making_charges', String(payload.making_charges));
  formData.append('shipping_charges', String(payload.shipping_charges));

  for (const [index, tax] of payload.taxes.entries()) {
    formData.append(`taxes[${index}][name]`, tax.name);
    formData.append(`taxes[${index}][rate]`, String(tax.rate));
  }

  if (image) {
    formData.append('image', image, image.name);
  }

  return formData;
}

export function productImageError(file: File): string | null {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type as (typeof PRODUCT_IMAGE_TYPES)[number])) {
    return 'Choose a JPG, PNG or WebP image.';
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return 'The image must be 5 MB or smaller.';
  }

  return null;
}
