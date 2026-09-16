import { Ingredient } from './recipe.model';

const FRACTIONS: Record<string, string> = {
  '.25': '¼',
  '.33': '⅓',
  '.5': '½',
  '.67': '⅔',
  '.75': '¾',
};
const TIGHT_UNITS = /^(g|kg|ml|l)$/;

/** "400g", "2 tbsp", "1½ tsp": the ingredient amount scaled by `ratio`. Entries without a qty show their unit text. */
export function formatQuantity(ingredient: Ingredient, ratio: number): string {
  if (ingredient.qty === undefined) return ingredient.unit ?? '';
  const n = Math.round(ingredient.qty * ratio * 100) / 100;
  const whole = Math.floor(n);
  const fraction = FRACTIONS[(n - whole).toFixed(2).replace(/0+$/, '').replace(/^0/, '')];
  const amount = fraction ? `${whole || ''}${fraction}` : String(n);
  if (!ingredient.unit) return amount;
  return TIGHT_UNITS.test(ingredient.unit)
    ? `${amount}${ingredient.unit}`
    : `${amount} ${ingredient.unit}`;
}
