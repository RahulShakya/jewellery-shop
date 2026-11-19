import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '@carat-line/cart-data';
import { productImage, productPrice } from '@carat-line/products-data';
import { finalize } from 'rxjs';
import { CheckoutService, type CheckoutAddress } from '../checkout.service';

@Component({
  selector: 'lib-feature-checkout',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './feature-checkout.html',
  styleUrl: './feature-checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCheckout {
  private readonly formBuilder = inject(FormBuilder);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  protected readonly cart = inject(CartStore);
  protected readonly productImage = productImage;
  protected readonly productPrice = productPrice;
  protected readonly step = signal<1 | 2 | 3>(1);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');

  protected readonly shippingForm = this.formBuilder.nonNullable.group({
    customer_name: ['', [Validators.required, Validators.maxLength(120)]],
    customer_phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s-]{7,14}$/)]],
    customer_email: ['', [Validators.email]],
    shipping_address: ['', [Validators.required, Validators.minLength(8)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected continueToReview(): void {
    this.shippingForm.markAllAsTouched();
    if (this.shippingForm.valid) {
      this.step.set(2);
      this.focusHeading();
    }
  }

  protected continueToPayment(): void {
    this.step.set(3);
    this.focusHeading();
  }

  protected goBack(): void {
    this.step.update((step) => (step === 3 ? 2 : 1));
    this.focusHeading();
  }

  protected invalid(name: keyof CheckoutAddress): boolean {
    const control = this.shippingForm.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  protected placeOrder(): void {
    if (this.submitting() || this.cart.empty()) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');
    this.checkoutService
      .placeCodOrder({
        ...this.shippingForm.getRawValue(),
        payment_method: 'cod',
        items: this.cart.items().map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (order) => {
          this.cart.clear();
          void this.router.navigate(['/order-confirmation', order.order_number], {
            state: { order },
          });
        },
        error: () => {
          this.submitError.set(
            'We could not place your order just now. Please review your details and try again.',
          );
        },
      });
  }

  private focusHeading(): void {
    setTimeout(() => document.querySelector<HTMLElement>('[data-checkout-heading]')?.focus());
  }
}
