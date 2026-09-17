import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../core/recipe.service';
import { RevealDirective } from '../../core/reveal.directive';
import { RecipeCard } from '../../shared/recipe-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgOptimizedImage, RecipeCard, RevealDirective],
  templateUrl: './home.html',
  host: { class: 'block animate-page-in' },
})
export class Home {
  private readonly recipes = inject(RecipeService);
  protected readonly featured = this.recipes.featured;
  protected readonly categories = this.recipes.categories.filter((c) => c.count > 0);
  protected readonly latest = this.recipes.all.slice(0, 6);
  protected readonly kids = this.recipes.category('kid-friendly');
}
