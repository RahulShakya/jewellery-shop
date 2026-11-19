import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '@carat-line/api';
import { ApiResponse, Order, PaginatedResponse } from '@carat-line/models';
import { finalize, forkJoin } from 'rxjs';
import { apiErrorMessage } from '../../core/admin-api.utils';

interface DashboardMetrics {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  total_orders: number;
  placed_orders: number;
  customer_count: number;
  order_revenue: number;
  collected_revenue: number;
}

interface DashboardSummary {
  readonly revenue: number;
  readonly orders: number;
  readonly products: number;
  readonly customers: number;
  readonly low_stock: number;
  readonly pending_orders: number;
  readonly recent_orders: readonly Order[];
}

const EMPTY_SUMMARY: DashboardSummary = {
  revenue: 0,
  orders: 0,
  products: 0,
  customers: 0,
  low_stock: 0,
  pending_orders: 0,
  recent_orders: [],
};

@Component({
  selector: 'admin-dashboard-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly summary = signal<DashboardSummary>(EMPTY_SUMMARY);

  constructor() {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({
      metrics: this.api.get<ApiResponse<DashboardMetrics>>('admin/dashboard'),
      orders: this.api.get<PaginatedResponse<Order>>('admin/orders', {
        params: { per_page: 5 },
      }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ metrics: { data }, orders }) => {
          this.summary.set({
            revenue: data.order_revenue,
            orders: data.total_orders,
            products: data.active_products,
            customers: data.customer_count,
            low_stock: data.low_stock_products,
            pending_orders: data.placed_orders,
            recent_orders: orders.data,
          });
        },
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }
}
