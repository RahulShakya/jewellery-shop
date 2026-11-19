import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'lib-order-confirmation',
  imports: [RouterLink],
  templateUrl: './order-confirmation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmation {
  private readonly route = inject(ActivatedRoute);
  protected readonly orderNumber = this.route.snapshot.paramMap.get('orderNumber') ?? '';
}
