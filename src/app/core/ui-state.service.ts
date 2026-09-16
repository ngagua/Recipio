import { Service, signal } from '@angular/core';

/** Bits of recipe-page state the fixed header needs: set by the page, read by the header. */
@Service()
export class UiState {
  /** Replaces the wordmark in the header once the user scrolls past a recipe hero. */
  readonly barTitle = signal('');
  /** Slug of the recipe being viewed, so the header bookmark button can toggle it. */
  readonly currentRecipe = signal<string | null>(null);
}
