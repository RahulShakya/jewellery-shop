import { HttpErrorResponse } from '@angular/common/http';
import { LaravelErrorResponse, ValidationErrors } from '@carat-line/models';

function isLaravelErrorResponse(value: unknown): value is LaravelErrorResponse {
  return typeof value === 'object' && value !== null && 'message' in value;
}

export function getValidationErrors(error: unknown): ValidationErrors {
  if (error instanceof HttpErrorResponse && isLaravelErrorResponse(error.error)) {
    return error.error.errors ?? {};
  }

  return {};
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof HttpErrorResponse && isLaravelErrorResponse(error.error)) {
    const validationMessage = Object.values(error.error.errors ?? {})[0]?.[0];
    return validationMessage ?? error.error.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
