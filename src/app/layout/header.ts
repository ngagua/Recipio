import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LangService } from '../core/lang.service';
import { SavedService } from '../core/saved.service';
import { UiState } from '../core/ui-state.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'fixed inset-x-0 top-0 z-40' },
  template: `
    <header
      class="flex h-16 items-center justify-between border-b px-3 transition-[background-color,border-color] duration-300 md:px-6"
      [class]="
        solid() ? 'border-line bg-surface/90 backdrop-blur-xl' : 'border-transparent bg-transparent'
      "
    >
      <a
        [routerLink]="lang.link('/')"
        class="max-w-[58vw] truncate pl-1 font-display text-xl font-bold tracking-[-0.03em] text-bone hover:text-bone md:max-w-md"
        >{{ solid() && ui.barTitle() ? ui.barTitle() : 'Recipio' }}</a
      >

      <nav class="hidden items-center gap-8 md:flex" aria-label="Primary">
        @for (item of items; track item.path) {
          <a
            [routerLink]="lang.link(item.path)"
            routerLinkActive="text-acid"
            #link="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            ariaCurrentWhenActive="page"
            class="text-[13px] font-semibold tracking-[0.1em] uppercase transition-colors hover:text-bone"
            [class.text-muted]="!link.isActive"
            >{{ lang.t(item.label) }}</a
          >
        }
      </nav>

      <div class="flex items-center gap-0.5">
        <a
          [routerLink]="lang.switchLink()"
          [attr.aria-label]="lang.t('switchAria')"
          [attr.hreflang]="lang.lang() === 'ka' ? 'en' : 'ka'"
          class="icon-btn text-[11px] font-bold tracking-[0.1em]"
          >{{ lang.t('switchLabel') }}</a
        >
        <a
          [routerLink]="lang.link('/recipes')"
          fragment="search"
          class="icon-btn"
          [attr.aria-label]="lang.t('searchRecipes')"
        >
          <span class="ms text-[23px]" aria-hidden="true">search</span>
        </a>
        @if (ui.currentRecipe(); as slug) {
          <button
            type="button"
            class="icon-btn"
            (click)="saved.toggle(slug)"
            [attr.aria-pressed]="saved.has(slug)"
            [attr.aria-label]="saved.has(slug) ? lang.t('unsaveRecipe') : lang.t('saveRecipe')"
          >
            <span
              class="ms text-[23px]"
              [class.fill]="saved.has(slug)"
              [class.text-acid]="saved.has(slug)"
              aria-hidden="true"
              >bookmark</span
            >
          </button>
        } @else {
          <a
            [routerLink]="lang.link('/saved')"
            class="icon-btn"
            [attr.aria-label]="lang.t('savedRecipes')"
          >
            <span class="ms text-[23px]" aria-hidden="true">bookmark</span>
          </a>
        }
      </div>
    </header>
  `,
})
export class Header {
  protected readonly ui = inject(UiState);
  protected readonly saved = inject(SavedService);
  protected readonly lang = inject(LangService);
  protected readonly items = [
    { path: '/', label: 'navHome' },
    { path: '/recipes', label: 'navBrowse' },
    { path: '/saved', label: 'navSaved' },
  ] as const;
  private readonly scrollY = signal(0);
  /** Transparent at the very top, solid with a blur once content scrolls underneath. */
  protected readonly solid = computed(() => this.scrollY() > 40);

  constructor() {
    afterNextRender(() => {
      const update = () => this.scrollY.set(window.scrollY);
      update();
      window.addEventListener('scroll', update, { passive: true });
    });
  }
}
