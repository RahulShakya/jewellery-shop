import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiEventsService {
  private readonly unauthorizedSequence = signal(0);

  readonly unauthorized = this.unauthorizedSequence.asReadonly();

  notifyUnauthorized(): void {
    this.unauthorizedSequence.update((sequence) => sequence + 1);
  }
}
