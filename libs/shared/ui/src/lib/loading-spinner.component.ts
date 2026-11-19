import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lib-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center gap-3 text-sm text-stone-600"
      role="status"
      aria-live="polite"
    >
      <span
        class="size-5 animate-spin rounded-full border-2 border-stone-200 border-t-amber-700"
        aria-hidden="true"
      ></span>
      <span>{{ label() }}</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly label = input('Loading…');
}
