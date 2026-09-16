import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { RecipeService } from './core/recipe.service';

const recipeTitle: ResolveFn<string> = (route) =>
  `${inject(RecipeService).bySlug(route.paramMap.get('slug') ?? '')?.title ?? 'Recipe not found'} · Recipio`;

const categoryTitle: ResolveFn<string> = (route) =>
  `${inject(RecipeService).category(route.paramMap.get('slug') ?? '')?.name ?? 'Category not found'} recipes · Recipio`;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Recipio · recipes worth cooking again',
  },
  {
    path: 'recipes',
    loadComponent: () => import('./pages/browse/browse').then((m) => m.Browse),
    title: 'All recipes · Recipio',
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
    title: 'Saved recipes · Recipio',
  },
  { path: '**', redirectTo: '' },
];
