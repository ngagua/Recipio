import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LangService } from '../../core/lang.service';
import { MotionService } from '../../core/motion.service';

/** Full-screen, one-step-at-a-time view. A native modal dialog: focus trapped, Escape closes, page behind is inert. */
@Component({
  selector: 'app-cook-mode',
  template: `
    <dialog
      #dlg
      (close)="closed.emit()"
      (keydown)="onKey($event)"
      [attr.aria-label]="lang.t('cookMode')"
      class="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none animate-sheet-in flex-col border-0 bg-ink px-6 pt-7 pb-8 text-bone open:flex md:px-12 backdrop:bg-ink"
    >
      <div class="flex items-center justify-between">
        <p class="eyebrow text-acid">{{ lang.t('cookMode') }}</p>
        <button
          type="button"
          (click)="dlg.close()"
          class="grid size-11 place-items-center rounded-full border border-line-2 text-bone transition-colors hover:border-acid"
          [attr.aria-label]="lang.t('closeCookMode')"
        >
          <span class="ms text-[22px]" aria-hidden="true">close</span>
        </button>
      </div>
      <div class="mt-[26px] flex gap-1.5" aria-hidden="true">
        @for (s of steps(); track $index) {
          <div
            class="h-0.5 flex-1 transition-colors duration-300"
            [class]="$index <= step() ? 'bg-acid' : 'bg-line'"
          ></div>
        }
      </div>
      <p
        class="mt-6 text-[11px] font-semibold tracking-[0.14em] text-dim uppercase"
        aria-live="polite"
      >
        {{ lang.t('stepOf')(step() + 1, steps().length) }}
      </p>
      <div class="flex flex-1 items-center md:mx-auto md:w-full md:max-w-3xl">
        <p
          class="font-display text-[32px] leading-[1.15] font-semibold tracking-[-0.035em] text-pretty text-bone md:text-5xl"
        >
          {{ steps()[step()] }}
        </p>
      </div>
      <div class="flex gap-2.5 md:mx-auto md:w-full md:max-w-3xl">
        <button
          type="button"
          (click)="prev()"
          [disabled]="step() === 0"
          class="grid size-14 shrink-0 place-items-center rounded-full border border-line-2 text-bone transition-colors hover:border-acid disabled:opacity-40 disabled:hover:border-line-2"
          [attr.aria-label]="lang.t('previousStep')"
        >
          <span class="ms text-2xl" aria-hidden="true">arrow_back</span>
        </button>
        <button
          type="button"
          (click)="next()"
          autofocus
          class="h-14 flex-1 rounded-full bg-acid text-[13px] font-bold tracking-[0.1em] text-surface uppercase transition-colors hover:bg-acid-hi"
        >
          {{ last() ? lang.t('done') : lang.t('nextStep') }}
        </button>
      </div>
    </dialog>
  `,
})
export class CookMode {
  readonly steps = input.required<string[]>();
  readonly closed = output<void>();
  protected readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  protected readonly step = signal(0);
  protected readonly last = computed(() => this.step() >= this.steps().length - 1);
  private readonly motion = inject(MotionService);
  protected readonly lang = inject(LangService);
  private wakeLock?: WakeLockSentinel;

  constructor() {
    afterNextRender(async () => {
      this.dialog().nativeElement.showModal();
      this.motion.lock(true);
      try {
        this.wakeLock = await navigator.wakeLock?.request('screen');
      } catch {
        // unsupported or refused: the screen may sleep mid-recipe
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.motion.lock(false);
      void this.wakeLock?.release();
    });
  }

  protected next(): void {
    if (this.last()) this.dialog().nativeElement.close();
    else this.step.update((s) => s + 1);
  }

  protected prev(): void {
    this.step.update((s) => Math.max(0, s - 1));
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.next();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'Escape') {
      // the browser closes modal dialogs on Escape itself, but not in every embedding; make it explicit
      event.preventDefault();
      this.dialog().nativeElement.close();
    }
  }
}
