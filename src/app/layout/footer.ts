import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="border-t border-line py-12 md:py-16">
      <div class="wrap flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="font-display text-2xl font-bold tracking-[-0.03em] text-bone">Recipio</p>
          <p class="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Recipes rescued from bookmarks, screenshots and group chats. Cooked, then kept.
          </p>
        </div>
        <nav class="flex gap-6" aria-label="Footer">
          <a routerLink="/" class="caps text-muted hover:text-bone">Home</a>
          <a routerLink="/recipes" class="caps text-muted hover:text-bone">Browse</a>
          <a routerLink="/saved" class="caps text-muted hover:text-bone">Saved</a>
        </nav>
      </div>
      <p class="wrap mt-10 text-[11px] text-dim">Photography via Unsplash.</p>
    </footer>
  `,
})
export class Footer {}
