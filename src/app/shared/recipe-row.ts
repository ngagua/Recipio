import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../core/recipe.model';

@Component({
  selector: 'app-recipe-row',
  imports: [RouterLink, NgOptimizedImage],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/recipes', recipe().slug]"
      class="group flex items-center gap-4 border-b border-hair py-[18px]"
    >
      <div class="relative size-[104px] shrink-0 overflow-hidden rounded-[3px] bg-raised">
        <img
          [ngSrc]="recipe().image"
          [alt]="recipe().imageAlt ?? ''"
          fill
          ngSrcset="104w, 208w, 312w"
          sizes="104px"
          class="object-cover transition-transform duration-500 ease-expo group-hover:scale-105"
        />
      </div>
      <div class="min-w-0">
        <h3
          class="font-display text-[19px] leading-[1.1] font-semibold tracking-[-0.025em] text-pretty text-bone"
        >
          {{ recipe().title }}
        </h3>
        <p class="mt-[7px] text-[13px] leading-[1.45] text-muted">{{ recipe().blurb }}</p>
        <p class="mt-[11px] flex gap-3.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
          <span class="text-acid">{{ recipe().time }} min</span>
          <span class="text-dim">{{ recipe().level }}</span>
        </p>
      </div>
    </a>
  `,
})
export class RecipeRow {
  readonly recipe = input.required<Recipe>();
}
