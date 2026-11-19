import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@carat-line/auth';
import { filter, finalize } from 'rxjs';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact: boolean;
}

@Component({
  selector: 'admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly menuOpen = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly pageTitle = signal(this.titleForUrl(this.router.url));
  protected readonly navigation: readonly NavigationItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', exact: true },
    { label: 'Products', route: '/products', icon: 'products', exact: false },
    { label: 'Categories', route: '/categories', icon: 'categories', exact: false },
    { label: 'Orders', route: '/orders', icon: 'orders', exact: true },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.pageTitle.set(this.titleForUrl(event.urlAfterRedirects));
        this.menuOpen.set(false);
      });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe({ next: () => void this.router.navigateByUrl('/login') });
  }

  protected userName(): string {
    return this.auth.currentUser()?.name ?? 'Administrator';
  }

  protected userInitial(): string {
    return this.userName().trim().charAt(0).toUpperCase() || 'A';
  }

  private titleForUrl(url: string): string {
    const segment = url.split('?')[0].split('/').filter(Boolean).at(0) ?? 'dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
}
