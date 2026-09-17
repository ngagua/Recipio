import { ImageLoaderConfig, Location } from '@angular/common';
import { inject } from '@angular/core';

/**
 * NgOptimizedImage loader: asks Unsplash for the width the browser needs; local files under public/
 * are prefixed with the base href so they resolve when the site is served from a sub-path (GitHub Pages).
 */
export function recipeImageLoaderFactory() {
  const location = inject(Location);
  return ({ src, width }: ImageLoaderConfig): string => {
    if (src.startsWith('/')) return location.prepareExternalUrl(src);
    if (!src.startsWith('https://images.unsplash.com/')) return src;
    const url = new URL(src);
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('q', '80');
    if (width) url.searchParams.set('w', String(width));
    return url.toString();
  };
}
