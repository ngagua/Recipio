/**
 * Icon per keyword: an emoji where one matches the ingredient, otherwise a CC0 illustration from
 * svgrepo.com in `public/icons`. A keyword matches at a word start; the longest match wins, ties go
 * to the earliest.
 */
const ICONS: [string, ...string[]][] = [
  ['🧄', 'garlic'],
  ['🧅', 'onion', 'shallot', 'leek'],
  ['🫚', 'ginger'],
  ['🥕', 'carrot'],
  ['🥔', 'potato'],
  ['🍠', 'sweet potato'],
  ['🍅', 'tomato', 'passata'],
  ['🫑', 'pepper', 'capsicum'],
  [
    '🌶️',
    'chilli',
    'chili',
    'chile',
    'jalapeño',
    'jalapeno',
    'chipotle',
    'adobo',
    'paprika',
    'cayenne',
  ],
  ['🌶️', 'pepper flakes', 'hot sauce', 'sriracha'],
  ['🥒', 'cucumber', 'zucchini', 'courgette'],
  ['icons/asparagus.svg', 'asparagus'],
  ['🍆', 'eggplant', 'aubergine'],
  ['🥦', 'broccoli', 'cauliflower'],
  ['🥬', 'spinach', 'kale', 'lettuce', 'cabbage', 'rocket', 'arugula', 'chard'],
  ['🍄', 'mushroom'],
  ['🌽', 'corn', 'sweetcorn'],
  ['🫛', 'peas'],
  ['🫘', 'lentil', 'bean', 'chickpea'],
  ['🥑', 'avocado'],
  ['🫒', 'olive', 'oil', 'olive oil', 'avocado oil'],
  ['🌻', 'sunflower'],
  [
    '🌿',
    'basil',
    'parsley',
    'coriander',
    'cilantro',
    'dill',
    'mint',
    'thyme',
    'rosemary',
    'oregano',
  ],
  ['🌿', 'sage', 'chives', 'herb', 'pesto', 'italian seasoning'],
  ['🍋', 'lemon'],
  ['icons/lime.svg', 'lime'],
  ['🍊', 'orange'],
  ['🍎', 'apple'],
  ['🍌', 'banana'],
  ['🫐', 'blueberr'],
  ['🍓', 'strawberr'],
  ['🥭', 'mango'],
  ['🍇', 'grape', 'raisins', 'sultana', 'dried fruit'],
  ['🥥', 'coconut'],
  ['🥚', 'egg'],
  ['🍗', 'chicken', 'turkey'],
  ['🥩', 'beef', 'steak', 'lamb', 'pork', 'mince'],
  ['🥓', 'bacon', 'pancetta'],
  ['icons/sausage.svg', 'sausage', 'frankfurter', 'chorizo'],
  ['🐟', 'salmon', 'fish', 'cod', 'tuna', 'trout', 'anchov'],
  ['🦐', 'prawn', 'shrimp'],
  ['🍲', 'stock', 'broth', 'chicken stock', 'chicken broth'],
  ['🥛', 'milk', 'almond milk'],
  ['icons/cream.svg', 'cream'],
  ['icons/yogurt.svg', 'yogurt', 'yoghurt'],
  ['🧈', 'butter'],
  [
    '🧀',
    'cheese',
    'feta',
    'halloumi',
    'mozzarella',
    'parmesan',
    'parmigiano',
    'cheddar',
    'ricotta',
  ],
  ['🍝', 'pasta', 'penne', 'spaghetti', 'linguine', 'tagliatelle', 'noodle'],
  ['🍚', 'rice'],
  ['🥣', 'oats', 'granola'],
  ['icons/flour.svg', 'flour'],
  ['icons/baking-powder.svg', 'baking powder', 'baking soda', 'bicarbonate'],
  ['🫓', 'tortilla', 'flatbread', 'pita'],
  ['🍞', 'bread', 'toast', 'sourdough'],
  ['🍯', 'honey', 'syrup'],
  ['icons/maple-syrup.svg', 'maple'],
  ['icons/sugar.svg', 'sugar'],
  ['icons/vanilla.svg', 'vanilla'],
  ['🍫', 'chocolate', 'cocoa'],
  ['🥜', 'peanut'],
  ['icons/nut.svg', 'walnut', 'pecan', 'almond', 'cashew', 'hazelnut', 'pistachio', 'nuts'],
  ['icons/seeds.svg', 'chia', 'seeds'],
  ['icons/spice.svg', 'curry', 'garam masala', 'cumin', 'nutmeg', 'turmeric', 'suneli', 'spice'],
  ['icons/cinnamon.svg', 'cinnamon'],
  ['icons/mustard.svg', 'mustard'],
  ['🧂', 'salt'],
  ['icons/pepper.svg', 'black pepper', 'white pepper', 'peppercorn'],
  ['🫙', 'sauce', 'paste', 'tahini'],
  ['icons/vinegar.svg', 'vinegar'],
  ['🍷', 'wine'],
  ['💧', 'water', 'pasta water', 'cooking water'],
];
const KEYS = ICONS.flatMap(([icon, ...keys]) =>
  keys.map((key) => ({ icon, key, re: new RegExp(`\\b${key}`) })),
);
export const FALLBACK_ICON = '🥄';

function find(text: string): string | undefined {
  let best: { icon: string; key: string; at: number } | undefined;
  for (const k of KEYS) {
    const at = k.re.exec(text)?.index;
    if (at === undefined) continue;
    const better =
      !best || k.key.length > best.key.length || (k.key.length === best.key.length && at < best.at);
    if (better) best = { icon: k.icon, key: k.key, at };
  }
  return best?.icon;
}

/** Icon for an ingredient, guessed from its name. The part before the first comma, bracket or "and" decides ("salt and pepper" is salt). */
export function ingredientIcon(name: string): string {
  const text = name.toLowerCase();
  return find(text.split(/[,(:]| and /)[0]) ?? find(text) ?? FALLBACK_ICON;
}
