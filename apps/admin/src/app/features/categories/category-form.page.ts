import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@carat-line/api';
import { ApiResponse, Category } from '@carat-line/models';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/admin-api.utils';
import {
  buildCategoryFormData,
  categoryImageError,
  CATEGORY_IMAGE_TYPES,
} from './category-form-data';

@Component({
  selector: 'admin-category-form-page',
  imports: [ReactiveFormsModule],
  templateUrl: './category-form.page.html',
  styleUrl: './category-form.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categoryId = this.route.snapshot.paramMap.get('id');
  private imageObjectUrl: string | null = null;

  protected readonly editing = this.categoryId !== null;
  protected readonly category = signal<Category | null>(null);
  protected readonly loading = signal(this.editing);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly formError = signal('');
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  protected readonly imageError = signal('');
  protected readonly acceptedImageTypes = CATEGORY_IMAGE_TYPES.join(',');

  protected readonly categoryImagePreview = computed(
    () => this.imagePreviewUrl() ?? this.category()?.image_url ?? this.category()?.image ?? null,
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', [Validators.maxLength(1000)]],
    is_active: [true],
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeImageObjectUrl());

    if (this.categoryId !== null) {
      this.loadCategory(this.categoryId);
    }
  }

  protected updateSlugFromName(): void {
    if (this.editing || this.form.controls.slug.dirty) {
      return;
    }

    this.form.controls.slug.setValue(
      this.form.controls.name.value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    );
  }

  protected cancel(): void {
    if (!this.saving()) {
      void this.router.navigateByUrl('/categories');
    }
  }

  protected selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.item(0);

    if (!image) {
      return;
    }

    const validationError = categoryImageError(image);
    if (validationError) {
      this.resetSelectedImage();
      this.imageError.set(validationError);
      input.value = '';
      return;
    }

    this.revokeImageObjectUrl();
    this.selectedImage.set(image);
    this.imageObjectUrl = URL.createObjectURL(image);
    this.imagePreviewUrl.set(this.imageObjectUrl);
    this.imageError.set('');
  }

  protected saveCategory(): void {
    if (this.form.invalid || this.saving() || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: raw.description.trim() || null,
      is_active: raw.is_active,
    };
    const formData = buildCategoryFormData(payload, this.selectedImage(), this.editing);
    const endpoint = this.editing
      ? `admin/categories/${this.categoryId as string}`
      : 'admin/categories';

    this.saving.set(true);
    this.formError.set('');
    this.api
      .post<ApiResponse<Category>>(endpoint, formData)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.resetSelectedImage();
          void this.router.navigateByUrl('/categories');
        },
        error: (error: unknown) => this.formError.set(apiErrorMessage(error)),
      });
  }

  private loadCategory(categoryId: string): void {
    this.loading.set(true);
    this.loadError.set('');
    this.api
      .get<ApiResponse<Category>>(`admin/categories/${categoryId}`)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const category = response.data;
          this.category.set(category);
          this.form.reset({
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            is_active: category.is_active ?? true,
          });
        },
        error: (error: unknown) => this.loadError.set(apiErrorMessage(error)),
      });
  }

  private resetSelectedImage(): void {
    this.revokeImageObjectUrl();
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set('');
  }

  private revokeImageObjectUrl(): void {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
      this.imageObjectUrl = null;
    }
  }
}
