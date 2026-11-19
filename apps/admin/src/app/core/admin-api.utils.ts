export type CollectionResponse<T> = T[] | { data: T[] | { data: T[] } };

export function unwrapCollection<T>(response: CollectionResponse<T>): readonly T[] {
  if (Array.isArray(response)) {
    return response;
  }

  const data = response.data;
  return Array.isArray(data) ? data : data.data;
}

export function entityValue(entity: unknown, ...keys: string[]): unknown {
  const record = entity as Record<string, unknown>;
  return keys.map((key) => record[key]).find((value) => value !== undefined && value !== null);
}

export function entityText(entity: unknown, ...keys: string[]): string {
  const value = entityValue(entity, ...keys);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function entityNumber(entity: unknown, ...keys: string[]): number {
  const value = entityValue(entity, ...keys);
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export function apiErrorMessage(error: unknown): string {
  const record = error as {
    error?: { message?: string; errors?: Record<string, string[]> };
    message?: string;
  };
  const validationMessage = record.error?.errors
    ? Object.values(record.error.errors).flat().at(0)
    : undefined;

  return (
    validationMessage ??
    record.error?.message ??
    record.message ??
    'Something went wrong. Try again.'
  );
}
