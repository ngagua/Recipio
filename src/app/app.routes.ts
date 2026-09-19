import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { UI } from './core/lang.model';
import { langOfRoute } from './core/lang.service';
import { RecipeService } from './core/recipe.service';

const homeTitle: ResolveFn<string> = (route) => UI[langOfRoute(route)].siteTitle;
const browseTitle: ResolveFn<string> = (route) => UI[langOfRoute(route)].allRecipesTitle;
const savedTitle: ResolveFn<string> = (route) => UI[langOfRoute(route)].savedRecipesTitle;

const recipeTitle: ResolveFn<string> = (route) => {
  const lang = langOfRoute(route);
  const recipe = inject(RecipeService).bySlug(route.paramMap.get('slug') ?? '', lang);
  return `${recipe?.title ?? UI[lang].recipeNotFound} · Recipio`;
};

const categoryTitle: ResolveFn<string> = (route) => {
  const lang = langOfRoute(route);
  const category = inject(RecipeService).category(route.paramMap.get('slug') ?? '', lang);
  return category
    ? UI[lang].categoryTitle(category.name)
    : `${UI[lang].categoryNotFound} · Recipio`;
};

const pages: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: homeTitle,
  },
  {
    path: 'recipes',
    loadComponent: () => import('./pages/browse/browse').then((m) => m.Browse),
    title: browseTitle,
  },
  {
    path: 'recipes/:slug',
    loadComponent: () => import('./pages/recipe/recipe').then((m) => m.RecipePage),
    title: recipeTitle,
  },
  {
    path: 'category/:slug',
    loadComponent: () => import('./pages/category/category').then((m) => m.CategoryPage),
    title: categoryTitle,
  },
  {
    path: 'saved',
    loadComponent: () => import('./pages/saved/saved').then((m) => m.Saved),
    title: savedTitle,
  },
];

/** The same pages twice: English at the root, Georgian under /ka. */
export const routes: Routes = [
  ...pages,
  { path: 'ka', children: pages },
  { path: '**', redirectTo: '' },
];
