import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ingredientIcon } from '../../core/ingredient-icon';
import { LangService } from '../../core/lang.service';
import { formatQuantity } from '../../core/quantity';
import { RecipeService } from '../../core/recipe.service';
import { SavedService } from '../../core/saved.service';
import { UiState } from '../../core/ui-state.service';
import { CookMode } from './cook-mode';

@Component({
  selector: 'app-recipe',
  imports: [RouterLink, NgOptimizedImage, CookMode],
  templateUrl: './recipe.html',
  host: { class: 'block animate-page-in' },
})
export class RecipePage {
  readonly slug = input.required<string>();
  protected readonly recipes = inject(RecipeService);
  protected readonly lang = inject(LangService);
  private readonly ui = inject(UiState);
  protected readonly saved = inject(SavedService);
  protected readonly recipe = computed(() => this.recipes.bySlug(this.slug()));
  protected readonly category = computed(() => {
    const first = this.recipe()?.categories[0];
    return first && this.recipes.category(first);
  });
  /** Phones show one panel at a time; from md both are visible side by side. */
  protected readonly tab = signal<'ingredients' | 'method'>('ingredients');
  protected readonly servings = linkedSignal(() => this.recipe()?.servings ?? 4);
  /** Batch recipes start high, so the stepper allows up to double the stated servings. */
  protected readonly maxServings = computed(() => Math.max(12, (this.recipe()?.servings ?? 4) * 2));
  protected readonly ingredients = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    const ratio = this.servings() / r.servings;
    // Icons are keyed on English ingredient names, whatever language the list is shown in.
    const english = this.recipes.bySlug(r.slug, 'en')?.ingredients ?? r.ingredients;
    return r.ingredients.map((i, n) => ({
      icon: ingredientIcon(english[n]?.name ?? i.name),
      qty: formatQuantity(i, ratio),
      name: i.name,
      group: i.group,
    }));
  });
  protected readonly cookOpen = signal(false);

  constructor() {
    effect(() => {
      const r = this.recipe();
      this.ui.barTitle.set(r?.title ?? '');
      this.ui.currentRecipe.set(r?.slug ?? null);
    });
    inject(DestroyRef).onDestroy(() => {
      this.ui.barTitle.set('');
      this.ui.currentRecipe.set(null);
    });
  }

  protected adjust(delta: number): void {
    this.servings.update((s) => Math.min(this.maxServings(), Math.max(1, s + delta)));
  }
}
