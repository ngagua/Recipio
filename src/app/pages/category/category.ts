import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../core/recipe.service';
import { RevealDirective } from '../../core/reveal.directive';
import { RecipeRow } from '../../shared/recipe-row';

@Component({
  selector: 'app-category',
  imports: [RouterLink, RecipeRow, RevealDirective],
  templateUrl: './category.html',
  host: { class: 'block animate-page-in' },
})
export class CategoryPage {
  readonly slug = input.required<string>();
  private readonly recipes = inject(RecipeService);
  protected readonly category = computed(() => this.recipes.category(this.slug()));
  protected readonly all = computed(() => this.recipes.byCategory(this.slug()));
  /** "All", a time cut, then every tag used by a recipe in this category. Resets when the category changes. */
  protected readonly filters = computed(() => [
    'All',
    'Under 30 min',
    ...new Set(this.all().flatMap((r) => r.tags)),
  ]);
  protected readonly filter = linkedSignal<string, string>({
    source: this.slug,
    computation: () => 'All',
  });
  protected readonly filtered = computed(() => {
    const f = this.filter();
    if (f === 'All') return this.all();
    if (f === 'Under 30 min') return this.all().filter((r) => r.time <= 30);
    return this.all().filter((r) => r.tags.includes(f));
  });
}
