export const CATEGORY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_CATEGORY_IMAGE_BYTES = 5 * 1024 * 1024;

export interface CategoryWritePayload {
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export function buildCategoryFormData(
  payload: CategoryWritePayload,
  image: File | null,
  spoofPatch = false,
): FormData {
  const formData = new FormData();

  if (spoofPatch) {
    formData.append('_method', 'PATCH');
  }

  formData.append('name', payload.name);
  formData.append('slug', payload.slug);
  formData.append('description', payload.description ?? '');
  formData.append('is_active', payload.is_active ? '1' : '0');

  if (image) {
    formData.append('image', image, image.name);
  }

  return formData;
}

export function categoryImageError(file: File): string | null {
  if (!CATEGORY_IMAGE_TYPES.includes(file.type as (typeof CATEGORY_IMAGE_TYPES)[number])) {
    return 'Choose a JPG, PNG or WebP image.';
  }

  if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
    return 'The image must be 5 MB or smaller.';
  }

  return null;
}
