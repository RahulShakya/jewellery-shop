import { ChangeDetectionStrategy, Component, inject, Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly messagesState = signal<ToastMessage[]>([]);

  readonly messages = this.messagesState.asReadonly();

  show(message: string, tone: ToastTone = 'info'): void {
    const toast: ToastMessage = { id: this.nextId++, message, tone };
    this.messagesState.update((messages) => [...messages, toast]);
    window.setTimeout(() => this.dismiss(toast.id), 4000);
  }

  dismiss(id: number): void {
    this.messagesState.update((messages) => messages.filter((message) => message.id !== id));
  }
}

@Component({
  selector: 'lib-toast-viewport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      aria-live="polite"
    >
      @for (toast of toasts.messages(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start justify-between gap-4 rounded-2xl border bg-white p-4 text-sm shadow-xl"
          [class.border-emerald-200]="toast.tone === 'success'"
          [class.border-red-200]="toast.tone === 'error'"
          [class.border-stone-200]="toast.tone === 'info'"
        >
          <p>{{ toast.message }}</p>
          <button
            type="button"
            class="text-stone-500 hover:text-stone-900"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastViewportComponent {
  protected readonly toasts = inject(ToastService);
}
