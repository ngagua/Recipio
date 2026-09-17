import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'fixed inset-x-0 bottom-0 z-40 md:hidden' },
  template: `
    <nav
      class="flex min-h-20 items-center justify-around border-t border-line bg-surface/92 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="Primary"
    >
      @for (item of items; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="text-acid"
          #link="routerLinkActive"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }"
          ariaCurrentWhenActive="page"
          class="flex min-w-20 flex-col items-center gap-1 px-4 py-2 transition-colors"
          [class.text-dim]="!link.isActive"
        >
          <span class="ms text-[23px]" [class.fill]="link.isActive" aria-hidden="true">{{
            item.icon
          }}</span>
          <span class="text-[10px] font-semibold tracking-[0.08em] uppercase">{{
            item.label
          }}</span>
        </a>
      }
    </nav>
  `,
})
export class BottomNav {
  protected readonly items = [
    { path: '/', icon: 'home', label: 'Home' },
    { path: '/recipes', icon: 'grid_view', label: 'Browse' },
    { path: '/saved', icon: 'bookmark', label: 'Saved' },
  ];
}
