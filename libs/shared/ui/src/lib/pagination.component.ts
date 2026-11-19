import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'lib-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav class="flex items-center justify-between gap-4" aria-label="Pagination">
        <button
          type="button"
          class="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="page() <= 1"
          (click)="select(page() - 1)"
        >
          Previous
        </button>
        <span class="text-sm text-stone-600">Page {{ page() }} of {{ totalPages() }}</span>
        <button
          type="button"
          class="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="page() >= totalPages()"
          (click)="select(page() + 1)"
        >
          Next
        </button>
      </nav>
    }
  `,
})
export class PaginationComponent {
  readonly page = input(1);
  readonly total = input(0);
  readonly perPage = input(12);
  readonly pageChange = output<number>();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.perPage())));

  select(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
