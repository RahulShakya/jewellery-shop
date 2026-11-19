import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lib-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center"
    >
      <div
        class="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-white text-xl text-amber-800 shadow-sm"
        aria-hidden="true"
      >
        {{ icon() }}
      </div>
      <h2 class="font-serif text-xl text-stone-900">{{ title() }}</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">{{ description() }}</p>
      <div class="mt-6"><ng-content /></div>
    </section>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('◇');
  readonly title = input.required<string>();
  readonly description = input('');
}
