import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../core/lang.service';
import { RecipeService } from '../../core/recipe.service';
import { RevealDirective } from '../../core/reveal.directive';
import { SavedService } from '../../core/saved.service';
import { RecipeCard } from '../../shared/recipe-card';

@Component({
  selector: 'app-saved',
  imports: [RouterLink, RecipeCard, RevealDirective],
  host: { class: 'block animate-page-in' },
  template: `
    <div class="wrap pt-[76px] md:pt-28">
      <h1
        class="font-display text-[50px] leading-[0.92] ka:leading-[1.08] font-bold tracking-[-0.04em] text-bone md:text-[96px]"
      >
        {{ lang.t('savedTitle') }}
      </h1>
      <p class="caps mt-3.5 text-dim">{{ lang.t('recipeCount')(recipes().length) }}</p>
    </div>
    @if (saved.loaded()) {
      <div
        class="wrap grid grid-cols-2 gap-x-3.5 gap-y-6 pt-8 pb-16 md:grid-cols-3 md:gap-x-6 md:gap-y-10 md:pb-24 lg:grid-cols-4"
      >
        @for (r of recipes(); track r.slug; let i = $index) {
          <app-recipe-card [appReveal]="i" [recipe]="r" />
        } @empty {
          <p class="col-span-full max-w-md py-6 text-muted">
            {{ lang.t('nothingSaved') }}
            <a [routerLink]="lang.link('/recipes')" class="mt-4 block">{{ lang.t('browseAll') }}</a>
          </p>
        }
      </div>
    }
  `,
})
export class Saved {
  protected readonly saved = inject(SavedService);
  protected readonly lang = inject(LangService);
  private readonly all = inject(RecipeService);
  protected readonly recipes = computed(() =>
    this.saved
      .slugs()
      .map((slug) => this.all.bySlug(slug))
      .filter((r) => r !== undefined),
  );
}
