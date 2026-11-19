import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiService, apiConfig } from '@carat-line/api';
import type { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs';

export interface CheckoutAddress {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  city: string;
  pincode: string;
}

export interface PlaceOrderRequest extends CheckoutAddress {
  payment_method: 'cod';
  items: Array<{ product_id: number; quantity: number }>;
}

export interface CheckoutOrder {
  id: number;
  order_number: string;
  total?: number | string;
  total_amount?: number | string;
  status?: string;
  order_status?: string;
}

export interface PlaceOrderResponse {
  message: string;
  data?: CheckoutOrder;
  order?: CheckoutOrder;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  placeCodOrder(payload: PlaceOrderRequest): Observable<CheckoutOrder> {
    return this.http.get<void>(apiConfig.csrfUrl).pipe(
      switchMap(() => this.api.post<PlaceOrderResponse>('orders', payload)),
      map((response) => {
        const order = response.data ?? response.order;
        if (!order) {
          throw new Error('The order response did not include an order.');
        }
        return order;
      }),
    );
  }
}
