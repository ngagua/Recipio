import { FALLBACK_ICON, ingredientIcon } from './ingredient-icon';

describe('ingredientIcon', () => {
  it('goes by the ingredient before the first comma or bracket', () => {
    expect(ingredientIcon('bread, toasted, or 2 baked sweet potatoes')).toBe('🍞');
    expect(ingredientIcon('salmon fillets (about 170g each), skin removed')).toBe('🐟');
  });

  it('lets the longer keyword win', () => {
    expect(ingredientIcon('full-fat coconut milk')).toBe('🥥');
    expect(ingredientIcon('red pepper flakes')).toBe('🌶️');
    expect(ingredientIcon('chicken stock')).toBe('🍲');
    expect(ingredientIcon('salt and freshly ground black pepper')).toBe('🧂');
  });

  it('matches at word starts only', () => {
    expect(ingredientIcon('unsalted butter, melted')).toBe('🧈');
  });

  it('falls back to a spoon', () => {
    expect(ingredientIcon('xanthan gum')).toBe(FALLBACK_ICON);
  });
});

describe('ingredientIcon svg illustrations', () => {
  it('uses an illustration where no emoji fits', () => {
    expect(ingredientIcon('thick asparagus, trimmed')).toBe('icons/asparagus.svg');
    expect(ingredientIcon('ground cinnamon')).toBe('icons/cinnamon.svg');
    expect(ingredientIcon('lime, juiced')).toBe('icons/lime.svg');
  });
});
