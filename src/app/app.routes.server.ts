import { RenderMode, ServerRoute } from '@angular/ssr';
import recipes from '../data/recipes.json';
import { CATEGORIES } from './core/recipe.model';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'recipes/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => recipes.map((r) => ({ slug: r.slug })),
  },
  {
    path: 'category/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => CATEGORIES.map((c) => ({ slug: c.slug })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
