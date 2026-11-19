import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@carat-line/api';
import { ApiResponse, Category, Product, ProductTax } from '@carat-line/models';
import { finalize, forkJoin, map } from 'rxjs';
import { apiErrorMessage, CollectionResponse, unwrapCollection } from '../../core/admin-api.utils';
import { buildProductFormData, productImageError, PRODUCT_IMAGE_TYPES } from './product-form-data';
import { buildProductPricingPayload, calculateProductPricing } from './product-pricing';

@Component({
  selector: 'admin-product-form-page',
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './product-form.page.html',
  styleUrl: './product-form.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productId = this.route.snapshot.paramMap.get('id');
  private imageObjectUrl: string | null = null;

  protected readonly editing = this.productId !== null;
  protected readonly product = signal<Product | null>(null);
  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly formError = signal('');
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  protected readonly imageError = signal('');
  protected readonly acceptedImageTypes = PRODUCT_IMAGE_TYPES.join(',');

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    sku: ['', [Validators.required, Validators.maxLength(80)]],
    category_id: [0, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    metal_type: ['', [Validators.required, Validators.maxLength(100)]],
    purity: ['', [Validators.maxLength(50)]],
    weight_grams: [0, [Validators.required, Validators.min(0.001)]],
    metal_price_per_gram: [0, [Validators.required, Validators.min(0.01)]],
    making_charges: [0, [Validators.required, Validators.min(0)]],
    shipping_charges: [0, [Validators.required, Validators.min(0)]],
    taxes: this.formBuilder.array([this.createTaxGroup({ name: 'GST', rate: 3 })]),
    is_active: [true],
    is_featured: [false],
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly pricingPreview = computed(() => calculateProductPricing(this.formValue()));
  protected readonly productImagePreview = computed(
    () => this.imagePreviewUrl() ?? this.product()?.image_url ?? this.product()?.image ?? null,
  );

  protected get taxControls() {
    return this.form.controls.taxes.controls;
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeImageObjectUrl());
    this.loadFormData();
  }

  protected addTax(tax: Pick<ProductTax, 'name' | 'rate'> = { name: '', rate: 0 }): void {
    this.form.controls.taxes.push(this.createTaxGroup(tax));
  }

  protected removeTax(index: number): void {
    if (this.taxControls.length > 1) {
      this.form.controls.taxes.removeAt(index);
    }
  }

  protected cancel(): void {
    if (!this.saving()) {
      void this.router.navigateByUrl('/products');
    }
  }

  protected selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.item(0);

    if (!image) {
      return;
    }

    const validationError = productImageError(image);
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

  protected saveProduct(): void {
    if (this.form.invalid || this.saving() || this.loading()) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        this.formError.set('Please fix the highlighted fields before saving the product.');
      }
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim(),
      sku: value.sku.trim(),
      category_id: Number(value.category_id),
      description: value.description.trim(),
      stock: Number(value.stock),
      purity: value.purity.trim() || null,
      is_active: value.is_active,
      is_featured: value.is_featured,
      ...buildProductPricingPayload(value),
    };
    const formData = buildProductFormData(payload, this.selectedImage(), this.editing);
    const endpoint = this.editing ? `admin/products/${this.productId as string}` : 'admin/products';

    this.saving.set(true);
    this.formError.set('');
    this.api
      .post<ApiResponse<Product>>(endpoint, formData)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.resetSelectedImage();
          void this.router.navigateByUrl('/products');
        },
        error: (error: unknown) => this.formError.set(apiErrorMessage(error)),
      });
  }

  private loadFormData(): void {
    this.loading.set(true);
    this.loadError.set('');
    const categoriesRequest = this.api.get<CollectionResponse<Category>>('admin/categories');

    if (this.productId === null) {
      categoriesRequest
        .pipe(
          finalize(() => this.loading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (response) => {
            const categories = unwrapCollection(response);
            this.categories.set(categories);
            this.form.controls.category_id.setValue(categories.at(0)?.id ?? 0);
          },
          error: (error: unknown) => this.loadError.set(apiErrorMessage(error)),
        });
      return;
    }

    forkJoin({
      categories: categoriesRequest,
      product: this.api.get<ApiResponse<Product>>(`admin/products/${this.productId}`),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ categories: categoryResponse, product: productResponse }) => {
          this.categories.set(unwrapCollection(categoryResponse));
          this.populateForm(productResponse.data);
        },
        error: (error: unknown) => this.loadError.set(apiErrorMessage(error)),
      });
  }

  private populateForm(product: Product): void {
    this.product.set(product);
    this.form.reset({
      name: product.name,
      sku: product.sku ?? '',
      category_id: product.category_id ?? product.category?.id ?? 0,
      description: product.description ?? '',
      stock: Number(product.stock),
      metal_type: product.metal_type ?? product.material ?? '',
      purity: product.purity ?? '',
      weight_grams: Number(product.weight_grams ?? product.weight ?? 0),
      metal_price_per_gram: Number(product.metal_price_per_gram ?? 0),
      making_charges: Number(product.making_charges ?? 0),
      shipping_charges: Number(product.shipping_charges ?? 0),
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
    });
    this.replaceTaxes(product.taxes?.length ? product.taxes : [{ name: 'GST', rate: 3 }]);
  }

  private createTaxGroup(tax: Pick<ProductTax, 'name' | 'rate'>) {
    return this.formBuilder.nonNullable.group({
      name: [tax.name, [Validators.required, Validators.maxLength(80)]],
      rate: [Number(tax.rate), [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  private replaceTaxes(taxes: ReadonlyArray<Pick<ProductTax, 'name' | 'rate'>>): void {
    this.form.controls.taxes.clear();
    for (const tax of taxes) {
      this.addTax(tax);
    }
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
