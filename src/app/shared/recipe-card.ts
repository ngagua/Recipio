import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES, Recipe } from '../core/recipe.model';

@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink, NgOptimizedImage],
  host: { class: 'block' },
  template: `
    <a [routerLink]="['/recipes', recipe().slug]" class="group block">
      <div class="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-raised">
        <img
          [ngSrc]="recipe().image"
          [alt]="recipe().imageAlt ?? ''"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          class="object-cover transition-transform duration-500 ease-expo group-hover:scale-[1.04]"
        />
        <span
          class="absolute top-2 left-2 rounded-[2px] bg-ink/70 px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-bone uppercase backdrop-blur-sm"
          >{{ recipe().time }} min</span
        >
      </div>
      <h3
        class="mt-3 font-display text-[17px] leading-[1.15] font-semibold tracking-[-0.025em] text-pretty text-bone"
      >
        {{ recipe().title }}
      </h3>
      <p class="caps mt-1.5 text-dim">{{ categoryName() }}</p>
    </a>
  `,
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();
  protected readonly categoryName = computed(
    () => CATEGORIES.find((c) => c.slug === this.recipe().categories[0])?.name ?? '',
  );
}
