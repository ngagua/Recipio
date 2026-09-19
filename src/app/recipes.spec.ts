import recipes from '../data/recipes.json';
import kaJson from '../data/recipes.ka.json';
import { CATEGORIES, Recipe, Translations } from './core/recipe.model';

const ka = kaJson as Translations;

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
      const n = (r as Recipe).nutrition;
      expect(n, `${r.slug} has no nutrition (node scripts/nutrition.mjs ${r.slug})`).toBeTruthy();
      expect(['source', 'estimate']).toContain(n.basis);
      for (const key of [
        'calories',
        'protein',
        'fat',
        'saturatedFat',
        'carbs',
        'sugars',
        'fibre',
        'sodium',
      ] as const)
        expect(n[key], `${r.slug}: nutrition.${key}`).toBeGreaterThanOrEqual(0);
      if (r.cover)
        expect(
          r.categories,
          `${r.slug}: cover "${r.cover}" is not one of its categories`,
        ).toContain(r.cover);
    }
  });
});

describe('recipes.ka.json', () => {
  it('translates every recipe row for row', () => {
    for (const r of recipes) {
      const t = ka.recipes[r.slug];
      expect(t, `${r.slug} has no Georgian translation`).toBeTruthy();
      expect(t.title, `${r.slug}: Georgian title`).toMatch(/[\u10D0-\u10FF]/);
      expect(t.ingredients.length, `${r.slug}: ingredient rows differ`).toBe(r.ingredients.length);
      expect(t.steps.length, `${r.slug}: steps differ`).toBe(r.steps.length);
      for (const tag of r.tags) expect(ka.tags[tag], `tag "${tag}" has no Georgian`).toBeTruthy();
      for (const i of r.ingredients as Recipe['ingredients'])
        if (i.group) expect(ka.groups[i.group], `group "${i.group}" has no Georgian`).toBeTruthy();
    }
  });

  it('has no translations for recipes that no longer exist', () => {
    const slugs = new Set(recipes.map((r) => r.slug));
    for (const slug of Object.keys(ka.recipes))
      expect(slugs.has(slug), `${slug} was removed`).toBe(true);
  });
});
