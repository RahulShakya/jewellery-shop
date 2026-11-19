import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { apiConfig } from './api.config';
import { ApiEventsService } from './api-events.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest =
    request.url === apiConfig.csrfUrl ||
    request.url.startsWith(`${apiConfig.baseUrl}/`) ||
    request.url === apiConfig.baseUrl;

  if (!isApiRequest) {
    return next(request);
  }

  const apiEvents = inject(ApiEventsService);
  const preparedRequest = request.clone({
    withCredentials: true,
    setHeaders: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return next(preparedRequest).pipe(
    catchError((error: unknown) => {
      const isSessionProbe =
        request.url.endsWith('/auth/me') || request.url.endsWith('/auth/login');

      if (error instanceof HttpErrorResponse && error.status === 401 && !isSessionProbe) {
        apiEvents.notifyUnauthorized();
      }

      return throwError(() => error);
    }),
  );
};
