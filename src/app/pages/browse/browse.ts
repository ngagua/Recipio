import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LangService } from '../../core/lang.service';
import { RecipeService } from '../../core/recipe.service';
import { RevealDirective } from '../../core/reveal.directive';
import { RecipeCard } from '../../shared/recipe-card';

@Component({
  selector: 'app-browse',
  imports: [RouterLink, RecipeCard, RevealDirective],
  templateUrl: './browse.html',
  host: { class: 'block animate-page-in' },
})
export class Browse {
  private readonly recipes = inject(RecipeService);
  protected readonly lang = inject(LangService);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('search');
  protected readonly categories = computed(() =>
    this.recipes.categories().filter((c) => c.count > 0),
  );
  protected readonly total = computed(() => this.recipes.all().length);
  protected readonly query = signal('');
  protected readonly results = computed(() => this.recipes.search(this.query()));

  constructor() {
    const fragment = inject(ActivatedRoute).snapshot.fragment;
    afterNextRender(() => {
      if (fragment === 'search') this.searchInput().nativeElement.focus();
    });
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
