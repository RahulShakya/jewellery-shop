import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiEventsService, ApiService, apiConfig, getApiErrorMessage } from '@carat-line/api';
import {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  UserRole,
} from '@carat-line/models';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

function unwrapResponse<T>(response: ApiResponse<T> | T): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly apiEvents = inject(ApiEventsService);
  private readonly router = inject(Router);
  private readonly userState = signal<User | null>(null);
  private readonly initializedState = signal(false);
  private initializationRequest?: Observable<User | null>;

  readonly user = this.userState.asReadonly();
  readonly currentUser = this.user;
  readonly initialized = this.initializedState.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.userState() !== null);

  private readonly clearUnauthorizedSession = effect(() => {
    if (this.apiEvents.unauthorized() > 0) {
      this.userState.set(null);
      if (!this.router.url.startsWith('/login')) {
        void this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url },
        });
      }
    }
  });

  initialize(): Promise<void> {
    return firstValueFrom(this.ensureInitialized()).then(() => undefined);
  }

  ensureInitialized(): Observable<User | null> {
    if (this.initializedState()) {
      return of(this.userState());
    }

    if (!this.initializationRequest) {
      this.initializationRequest = this.api.get<ApiResponse<User> | User>('auth/me').pipe(
        map(unwrapResponse),
        tap((user) => this.userState.set(user)),
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
            this.error.set(getApiErrorMessage(error, 'Unable to restore your session.'));
          }
          this.userState.set(null);
          return of(null);
        }),
        finalize(() => this.initializedState.set(true)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.initializationRequest;
  }

  login(credentials: LoginCredentials): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<void>(apiConfig.csrfUrl).pipe(
      switchMap(() => this.api.post<ApiResponse<User> | User>('auth/login', credentials)),
      map(unwrapResponse),
      tap((user) => {
        this.userState.set(user);
        this.initializedState.set(true);
      }),
      catchError((error: unknown) => {
        this.error.set(getApiErrorMessage(error, 'The email or password is incorrect.'));
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  register(credentials: RegisterCredentials): Observable<User> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<void>(apiConfig.csrfUrl).pipe(
      switchMap(() => this.api.post<ApiResponse<User> | User>('auth/register', credentials)),
      map(unwrapResponse),
      map((user) => {
        if (user.role !== 'customer') {
          throw new Error('A customer account could not be created.');
        }

        return user;
      }),
      tap((user) => {
        this.userState.set(user);
        this.initializedState.set(true);
      }),
      catchError((error: unknown) => {
        this.error.set(getApiErrorMessage(error, 'Unable to create your account.'));
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  logout(): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.post<void>('auth/logout', {}).pipe(
      catchError((error: unknown) => {
        this.error.set(getApiErrorMessage(error, 'Unable to sign out.'));
        return throwError(() => error);
      }),
      finalize(() => {
        this.userState.set(null);
        this.initializedState.set(true);
        this.loading.set(false);
      }),
    );
  }

  hasRole(role: UserRole): boolean {
    return this.userState()?.role === role;
  }
}
