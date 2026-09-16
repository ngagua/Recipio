import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, inject, PLATFORM_ID, Service, signal } from '@angular/core';

@Service()
export class SavedService {
  private readonly key = 'recipio.saved';
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Saved recipe slugs. Read from localStorage only after hydration so the prerendered DOM matches on first paint. */
  readonly slugs = signal<string[]>([]);
  readonly loaded = signal(false);

  constructor() {
    afterNextRender(() => {
      try {
        this.slugs.set(JSON.parse(localStorage.getItem(this.key) ?? '[]'));
      } catch {
        // blocked or corrupt storage: start empty
      }
      this.loaded.set(true);
    });
  }

  has(slug: string): boolean {
    return this.slugs().includes(slug);
  }

  toggle(slug: string): void {
    this.slugs.update((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
    if (!this.browser) return;
    try {
      localStorage.setItem(this.key, JSON.stringify(this.slugs()));
    } catch {
      // storage unavailable: keep the in-memory list
    }
  }
}
