import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@carat-line/models';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureInitialized().pipe(
    map((user) =>
      user
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};

export function roleGuard(roles: readonly UserRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.ensureInitialized().pipe(
      map((user) => {
        if (!user) {
          return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }

        return roles.includes(user.role) ? true : router.createUrlTree(['/']);
      }),
    );
  };
}

export const adminGuard = roleGuard(['admin']);
export const customerGuard = roleGuard(['customer']);
