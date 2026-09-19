import { afterNextRender, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LangService } from './core/lang.service';
import { MotionService } from './core/motion.service';
import { BottomNav } from './layout/bottom-nav';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, BottomNav],
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-acid focus:px-4 focus:py-2 focus:font-semibold focus:text-surface"
      >{{ lang.t('skipToContent') }}</a
    >
    <app-header />
    <div class="pb-20 md:pb-0">
      <main id="main" class="min-h-dvh" tabindex="-1"><router-outlet /></main>
      <app-footer />
    </div>
    <app-bottom-nav />
  `,
})
export class App {
  protected readonly lang = inject(LangService);

  constructor() {
    const motion = inject(MotionService);
    afterNextRender(() => motion.start());
  }
}
