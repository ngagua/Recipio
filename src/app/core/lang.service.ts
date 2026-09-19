import { DOCUMENT, Location } from '@angular/common';
import { computed, effect, inject, Service, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { UI, UiKey, Lang } from './lang.model';

/** Georgian lives under /ka/…; the URL decides, so every page prerenders in both languages. */
export function langOfUrl(url: string): Lang {
  return /^\/ka(\/|$|\?|#)/.test(url) ? 'ka' : 'en';
}

/** For resolvers, which run before the navigation (and this service's signal) has settled. */
export function langOfRoute(route: ActivatedRouteSnapshot): Lang {
  return route.pathFromRoot.some((r) => r.routeConfig?.path === 'ka') ? 'ka' : 'en';
}

@Service()
export class LangService {
  // Location, not Router.url: the first client render happens before the initial navigation ends, and it must match the prerendered DOM.
  private readonly url = signal(inject(Location).path() || '/');
  readonly lang = computed(() => langOfUrl(this.url()));
  /** The same page in the other language. */
  readonly switchLink = computed(() => {
    const url = this.url();
    return this.lang() === 'ka'
      ? url.replace(/^\/ka(?=\/|$)/, '') || '/'
      : `/ka${url === '/' ? '' : url}`;
  });

  constructor() {
    const document = inject(DOCUMENT);
    inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.url.set(event.urlAfterRedirects);
    });
    effect(() => {
      document.documentElement.lang = this.lang();
    });
  }

  /** Path in the current language: link('/recipes') is '/ka/recipes' on the Georgian site. */
  link(path: string): string {
    return this.lang() === 'ka' ? `/ka${path === '/' ? '' : path}` : path;
  }

  t<K extends UiKey>(key: K): (typeof UI)['en'][K] {
    return UI[this.lang()][key];
  }
}
