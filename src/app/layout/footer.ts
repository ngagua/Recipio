import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../core/lang.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="border-t border-line py-12 md:py-16">
      <div class="wrap flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="font-display text-2xl font-bold tracking-[-0.03em] text-bone">Recipio</p>
          <p class="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            {{ lang.t('footerTagline') }}
          </p>
        </div>
        <nav class="flex gap-6" aria-label="Footer">
          <a [routerLink]="lang.link('/')" class="caps text-muted hover:text-bone">{{
            lang.t('navHome')
          }}</a>
          <a [routerLink]="lang.link('/recipes')" class="caps text-muted hover:text-bone">{{
            lang.t('navBrowse')
          }}</a>
          <a [routerLink]="lang.link('/saved')" class="caps text-muted hover:text-bone">{{
            lang.t('navSaved')
          }}</a>
        </nav>
      </div>
      <p class="wrap mt-10 text-[11px] text-dim">{{ lang.t('footerPhoto') }}</p>
    </footer>
  `,
})
export class Footer {
  protected readonly lang = inject(LangService);
}
