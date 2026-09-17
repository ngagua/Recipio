import recipes from '../data/recipes.json';
import { CATEGORIES } from './core/recipe.model';

describe('recipes.json', () => {
  const known = new Set<string>(CATEGORIES.map((c) => c.slug));

  it('has unique slugs', () => {
    const slugs = recipes.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every recipe is complete and filed under known categories', () => {
    for (const r of recipes) {
      expect(r.categories.length, `${r.slug} has no category`).toBeGreaterThan(0);
      for (const c of r.categories)
        expect(known.has(c), `${r.slug}: unknown category "${c}"`).toBe(true);
      expect(r.ingredients.length, `${r.slug} has no ingredients`).toBeGreaterThan(0);
      expect(r.steps.length, `${r.slug} has no steps`).toBeGreaterThan(0);
      expect(r.servings, `${r.slug} needs servings for the stepper`).toBeGreaterThan(0);
      expect(r.image, `${r.slug} image must be a URL or a /path`).toMatch(/^(https:\/\/|\/)/);
      expect(r.added, `${r.slug} added must be an ISO date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (r.cover)
        expect(
          r.categories,
          `${r.slug}: cover "${r.cover}" is not one of its categories`,
        ).toContain(r.cover);
    }
  });
});
