import { Service } from '@angular/core';
import recipesJson from '../../data/recipes.json';
import { CATEGORIES, Category, Recipe } from './recipe.model';

@Service()
export class RecipeService {
  /** Every recipe, newest first. */
  readonly all: Recipe[] = [...(recipesJson as Recipe[])].sort((a, b) =>
    b.added.localeCompare(a.added),
  );
  readonly featured: Recipe = this.all.find((r) => r.featured) ?? this.all[0];
  readonly categories: Category[] = this.buildCategories();

  /** Counts per category, each with a cover photo: a recipe without a video (reel covers show presenters) and not already used by an earlier category, where possible. */
  private buildCategories(): Category[] {
    const used = new Set<string>();
    return CATEGORIES.map((c) => {
      const inCategory = this.all.filter((r) => r.categories.includes(c.slug));
      const cover =
        inCategory.find((r) => !r.video && !used.has(r.image)) ??
        inCategory.find((r) => !r.video) ??
        inCategory.find((r) => !used.has(r.image)) ??
        inCategory[0];
      if (cover) used.add(cover.image);
      return { ...c, count: inCategory.length, image: cover?.image };
    });
  }

  bySlug(slug: string): Recipe | undefined {
    return this.all.find((r) => r.slug === slug);
  }

  category(slug: string): Category | undefined {
    return this.categories.find((c) => c.slug === slug);
  }

  byCategory(slug: string): Recipe[] {
    return this.all.filter((r) => (r.categories as string[]).includes(slug));
  }

  /** Case-insensitive match on title, blurb, categories, tags and ingredient names. */
  search(query: string): Recipe[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.all;
    return this.all.filter((r) =>
      [r.title, r.blurb, ...r.categories, ...r.tags, ...r.ingredients.map((i) => i.name)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }
}
