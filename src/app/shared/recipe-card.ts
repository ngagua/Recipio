import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../core/lang.service';
import { Recipe } from '../core/recipe.model';
import { RecipeService } from '../core/recipe.service';
import { TiltDirective } from '../core/tilt.directive';

@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink, NgOptimizedImage, TiltDirective],
  host: { class: 'block' },
  template: `
    <a [routerLink]="lang.link('/recipes/' + recipe().slug)" appTilt class="card group flex h-full flex-col p-2">
      <div class="relative aspect-[4/5] overflow-hidden rounded-[7px] bg-hair">
        <img
          [ngSrc]="recipe().image"
          [alt]="recipe().imageAlt ?? ''"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          class="object-cover transition-transform duration-500 ease-expo group-hover:scale-[1.04]"
        />
        <span
          class="absolute top-2 left-2 rounded-[2px] bg-ink/70 px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-bone uppercase backdrop-blur-sm"
          >{{ lang.t('minutes')(recipe().time) }}</span
        >
      </div>
      <h3
        class="mt-3 px-1 font-display text-[17px] leading-[1.15] font-semibold tracking-[-0.025em] text-pretty text-bone"
      >
        {{ recipe().title }}
      </h3>
      <p class="caps mt-1.5 px-1 pb-1 text-dim">{{ categoryName() }}</p>
    </a>
  `,
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();
  protected readonly lang = inject(LangService);
  private readonly recipes = inject(RecipeService);
  protected readonly categoryName = computed(
    () => this.recipes.category(this.recipe().categories[0])?.name ?? '',
  );
}
