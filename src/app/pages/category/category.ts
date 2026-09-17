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
  /** Neighbouring non-empty categories in menu order, wrapping at the ends, so a reader can walk through the meals without going back. */
  protected readonly previous = computed(() => this.neighbour(-1));
  protected readonly next = computed(() => this.neighbour(1));
  /** "All", a time cut, then the tags in this category; a chip earns its place by matching at least three recipes. */
  protected readonly filters = computed(() => {
    const tags = new Set(this.all().flatMap((r) => r.tags));
    return ['All', 'Under 30 min', ...tags].filter(
      (f) => f === 'All' || this.matching(f).length >= 3,
    );
  });
  protected readonly filter = linkedSignal<string, string>({
    source: this.slug,
    computation: () => 'All',
  });
  protected readonly filtered = computed(() => this.matching(this.filter()));

  private matching(f: string) {
    if (f === 'All') return this.all();
    if (f === 'Under 30 min') return this.all().filter((r) => r.time <= 30);
    return this.all().filter((r) => r.tags.includes(f));
  }

  private neighbour(step: number) {
    const list = this.recipes.categories.filter((c) => c.count > 0);
    const i = list.findIndex((c) => c.slug === this.slug());
    return i < 0 ? undefined : list[(i + step + list.length) % list.length];
  }
}
