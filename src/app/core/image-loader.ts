import { ImageLoaderConfig } from '@angular/common';

/** NgOptimizedImage loader: asks Unsplash for the width the browser needs; local files under public/ pass through as-is. */
export function recipeImageLoader({ src, width }: ImageLoaderConfig): string {
  if (!src.startsWith('https://images.unsplash.com/')) return src;
  const url = new URL(src);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('q', '80');
  if (width) url.searchParams.set('w', String(width));
  return url.toString();
}
