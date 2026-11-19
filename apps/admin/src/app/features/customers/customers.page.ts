import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'admin-customers-page',
  templateUrl: './customers.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {}
