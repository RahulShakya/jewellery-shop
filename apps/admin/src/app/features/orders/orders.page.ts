import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ApiService } from '@carat-line/api';
import { ApiResponse, Order, OrderStatus, PaginatedResponse } from '@carat-line/models';
import { PaginationComponent } from '@carat-line/ui';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/admin-api.utils';

@Component({
  selector: 'admin-orders-page',
  imports: [CurrencyPipe, DatePipe, PaginationComponent, UpperCasePipe],
  templateUrl: './orders.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly api = inject(ApiService);
  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly totalOrders = signal(0);
  protected readonly perPage = 20;
  protected readonly updatingOrderId = signal<number | null>(null);
  protected readonly selectedOrder = signal<Order | null>(null);
  protected readonly statuses: readonly OrderStatus[] = [
    'placed',
    'confirmed',
    'dispatched',
    'delivered',
    'cancelled',
  ];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
    });
    this.loadOrders();
  }

  protected loadOrders(page = 1): void {
    this.loading.set(true);
    this.errorMessage.set('');
    const search = this.searchTerm().trim();
    const status = this.statusFilter();
    this.api
      .get<PaginatedResponse<Order>>('admin/orders', {
        params: {
          page,
          per_page: this.perPage,
          ...(search ? { search } : {}),
          ...(status !== 'all' ? { status } : {}),
        },
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.orders.set(response.data);
          this.currentPage.set(response.meta.current_page);
          this.totalOrders.set(response.meta.total);
        },
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }

  protected searchOrders(value: string): void {
    this.searchTerm.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadOrders(1), 300);
  }

  protected filterByStatus(status: string): void {
    this.statusFilter.set(status);
    this.loadOrders(1);
  }

  protected updateStatus(order: Order, status: OrderStatus): void {
    if (status === order.status || this.updatingOrderId() !== null) {
      return;
    }

    this.updatingOrderId.set(order.id);
    this.errorMessage.set('');
    this.api
      .patch<ApiResponse<Order> | Order>(`admin/orders/${order.id}/status`, {
        order_status: status,
      })
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe({
        next: (response) => {
          const updatedOrder = 'data' in response ? response.data : response;
          this.orders.update((orders) =>
            orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)),
          );
          if (this.selectedOrder()?.id === updatedOrder.id) {
            this.selectedOrder.set(updatedOrder);
          }
        },
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }
}
