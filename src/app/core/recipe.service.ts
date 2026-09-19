import { computed, inject, Service } from '@angular/core';
import recipesJson from '../../data/recipes.json';
import kaJson from '../../data/recipes.ka.json';
import { Lang, LEVELS_KA, UNITS_KA } from './lang.model';
import { LangService } from './lang.service';
import { CATEGORIES, Category, Recipe, RecipeTranslation, Translations } from './recipe.model';

interface Catalogue {
  all: Recipe[];
  featured: Recipe;
  categories: Category[];
}

const KA = kaJson as Translations;

/** The Georgian recipe: same numbers, photo and slug, Georgian words. Rows without a translation keep the English. */
function translate(r: Recipe, t: RecipeTranslation | undefined): Recipe {
  if (!t) return r;
  return {
    ...r,
    title: t.title,
    blurb: t.blurb,
    description: t.description ?? r.description,
    imageAlt: t.imageAlt ?? r.imageAlt,
    tags: r.tags.map((tag) => KA.tags[tag] ?? tag),
    ingredients: r.ingredients.map((i, n) => ({
      ...i,
      group: i.group && (KA.groups[i.group] ?? i.group),
      unit: t.ingredients[n]?.unit ?? (i.unit && (UNITS_KA[i.unit] ?? i.unit)),
      name: t.ingredients[n]?.name ?? i.name,
    })),
    steps: t.steps,
  };
}

function build(lang: Lang): Catalogue {
  const all = [...(recipesJson as Recipe[])]
    .sort((a, b) => b.added.localeCompare(a.added))
    .map((r) => (lang === 'ka' ? translate(r, KA.recipes[r.slug]) : r));
  // Counts per category, each with a cover photo: a recipe without a video (reel covers show presenters) and not already used by an earlier category, where possible.
  const used = new Set<string>();
  const categories = CATEGORIES.map((c) => {
    const inCategory = all.filter((r) => r.categories.includes(c.slug));
    const cover =
      inCategory.find((r) => r.cover === c.slug) ??
      inCategory.find((r) => !r.video && !used.has(r.image)) ??
      inCategory.find((r) => !r.video) ??
      inCategory.find((r) => !used.has(r.image)) ??
      inCategory[0];
    if (cover) used.add(cover.image);
    const name = lang === 'ka' ? c.nameKa : c.name;
    return { slug: c.slug, name, count: inCategory.length, image: cover?.image };
  });
  return { all, featured: all.find((r) => r.featured) ?? all[0], categories };
}

@Service()
export class RecipeService {
  private readonly lang = inject(LangService);
  private readonly catalogues: Record<Lang, Catalogue> = { en: build('en'), ka: build('ka') };
  private readonly current = computed(() => this.catalogues[this.lang.lang()]);
  /** Every recipe in the current language, newest first. */
  readonly all = computed(() => this.current().all);
  readonly featured = computed(() => this.current().featured);
  readonly categories = computed(() => this.current().categories);

  bySlug(slug: string, lang = this.lang.lang()): Recipe | undefined {
    return this.catalogues[lang].all.find((r) => r.slug === slug);
  }

  category(slug: string, lang = this.lang.lang()): Category | undefined {
    return this.catalogues[lang].categories.find((c) => c.slug === slug);
  }

  byCategory(slug: string): Recipe[] {
    return this.all().filter((r) => (r.categories as string[]).includes(slug));
  }

  /** Level name in the current language. */
  level(level: Recipe['level']): string {
    return this.lang.lang() === 'ka' ? (LEVELS_KA[level] ?? level) : level;
  }

  /** Case-insensitive match on title, blurb, categories, tags and ingredient names, in both languages. */
  search(query: string): Recipe[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.all();
    const haystack = (r: Recipe) =>
      [r.title, r.blurb, ...r.categories, ...r.tags, ...r.ingredients.map((i) => i.name)].join(' ');
    return this.all().filter((r) =>
      (
        haystack(r) +
        ' ' +
        haystack(this.bySlug(r.slug, this.lang.lang() === 'ka' ? 'en' : 'ka') ?? r)
      )
        .toLowerCase()
        .includes(q),
    );
  }
}
