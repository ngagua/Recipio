import { RenderMode, ServerRoute } from '@angular/ssr';
import recipes from '../data/recipes.json';
import { CATEGORIES } from './core/recipe.model';

const recipeSlugs = async () => recipes.map((r) => ({ slug: r.slug }));
const categorySlugs = async () => CATEGORIES.map((c) => ({ slug: c.slug }));

export const serverRoutes: ServerRoute[] = [
  { path: 'recipes/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: recipeSlugs },
  { path: 'category/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: categorySlugs },
  { path: 'ka/recipes/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: recipeSlugs },
  {
    path: 'ka/category/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: categorySlugs,
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
