import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'admin-discounts-page',
  templateUrl: './discounts.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountsPage {}
