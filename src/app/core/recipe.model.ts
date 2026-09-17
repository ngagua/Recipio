export const CATEGORIES = [
  { slug: 'breakfast', name: 'Breakfast' },
  { slug: 'lunch', name: 'Lunch' },
  { slug: 'dinner', name: 'Dinner' },
  { slug: 'kid-friendly', name: 'Kid friendly' },
  { slug: 'dessert', name: 'Dessert' },
  { slug: 'quick', name: 'Quick & easy' },
  { slug: 'veggie', name: 'Veggie' },
  { slug: 'baking', name: 'Baking' },
  { slug: 'sauces', name: 'Sauces' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export interface Category {
  slug: CategorySlug;
  name: string;
  count: number;
  /** Cover photo: the first recipe filed under the category. */
  image?: string;
}

export interface Ingredient {
  /** Optional section heading, e.g. "For the sauce"; consecutive rows with the same group share one heading. */
  group?: string;
  /** Numeric amount, scaled with the servings stepper. Leave out for "to taste" style entries. */
  qty?: number;
  /** "g", "tbsp", "cloves"… or the whole amount text when there is no qty ("pinch"). */
  unit?: string;
  name: string;
}

export type Level = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  slug: string;
  title: string;
  /** One line shown under the title in lists. */
  blurb: string;
  /** Longer intro on the recipe page; falls back to blurb. */
  description?: string;
  categories: CategorySlug[];
  /** Free-form labels used as filter chips, e.g. "One pan", "Freezer friendly". */
  tags: string[];
  /** Absolute URL or a path under public/, e.g. /recipes/my-dish.jpg */
  image: string;
  imageAlt?: string;
  /** Total minutes. */
  time: number;
  level: Level;
  /** Optional cost per head, e.g. "£1.80". */
  cost?: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  video?: { url: string; duration?: string };
  source?: { name: string; url: string };
  /** Shown in the home hero. First match wins. */
  featured?: boolean;
  /** Category slug whose browse tile shows this recipe's photo. */
  cover?: string;
  /** ISO date; the home page lists newest first. */
  added: string;
}
