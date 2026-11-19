import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '@carat-line/api';
import { Category } from '@carat-line/models';
import { finalize } from 'rxjs';
import { apiErrorMessage, CollectionResponse, unwrapCollection } from '../../core/admin-api.utils';

@Component({
  selector: 'admin-categories-page',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './categories.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  private readonly api = inject(ApiService);

  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly categoryToDelete = signal<Category | null>(null);

  protected readonly filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return term
      ? this.categories().filter((category) =>
          [category.name, category.slug, category.description]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(term)),
        )
      : this.categories();
  });

  constructor() {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api
      .get<CollectionResponse<Category>>('admin/categories')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.categories.set(unwrapCollection(response)),
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }

  protected deleteCategory(): void {
    const category = this.categoryToDelete();
    if (!category || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.api
      .delete<void>(`admin/categories/${category.id}`)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.categories.update((categories) =>
            categories.filter((item) => item.id !== category.id),
          );
          this.categoryToDelete.set(null);
        },
        error: (error: unknown) => this.errorMessage.set(apiErrorMessage(error)),
      });
  }
}
