#!/usr/bin/env node
// Estimate per-serving nutrition from a recipe's ingredient list, for recipes whose source publishes none.
//
//   node scripts/nutrition.mjs               fills every recipe in src/data/recipes.json that has no nutrition yet
//   node scripts/nutrition.mjs <slug> ...    (re)estimates just those, replacing what is there
//
// Ingredient names are matched to FOODS by keyword (whole word, longest key wins), amounts are turned into grams
// via the unit tables below, and the totals are divided by the recipe's servings. Rows marked optional or given
// without an amount "to serve" are left out. The report lists every row's match and grams: an unmatched row means
// a keyword is missing from FOODS, so add it there rather than accepting the gap. Values are USDA-style averages;
// treat the result as an estimate, which is how the site labels it.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Per 100 g: kcal, protein, fat, saturated fat, carbohydrate, sugars, fibre (g), sodium (mg). Optional gram weights per tbsp / piece. */
const FOODS = [
  // dairy and eggs
  { keys: ['butter'], per100: [717, 0.9, 81, 51, 0.1, 0.1, 0, 640], tbsp: 14 },
  { keys: ['unsalted butter'], per100: [717, 0.9, 81, 51, 0.1, 0.1, 0, 11], tbsp: 14 },
  { keys: ['egg', 'eggs'], per100: [143, 12.6, 9.5, 3.1, 0.7, 0.4, 0, 142], piece: 50 },
  { keys: ['egg yolk', 'egg yolks'], per100: [322, 15.9, 26.5, 9.6, 3.6, 0.6, 0, 48], piece: 17 },
  { keys: ['milk'], per100: [61, 3.2, 3.3, 1.9, 4.8, 5.1, 0, 43], tbsp: 15 },
  { keys: ['almond milk'], per100: [17, 0.6, 1.2, 0.1, 0.6, 0.2, 0.3, 60], tbsp: 15 },
  { keys: ['coconut milk'], per100: [197, 2, 21, 19, 2.8, 1, 0, 13], tbsp: 15 },
  { keys: ['oat cream', 'vegan cream'], per100: [148, 1, 13, 1.2, 5, 1, 0.5, 40], tbsp: 15 },
  { keys: ['cream'], per100: [292, 2.3, 31, 19.4, 3, 3, 0, 27], tbsp: 15 },
  { keys: ['double cream'], per100: [449, 1.7, 48, 30, 2.7, 2.7, 0, 27], tbsp: 15 },
  {
    keys: [
      '0% greek yoghurt',
      '0% greek yogurt',
      'fat-free greek yoghurt',
      'fat-free greek yogurt',
    ],
    per100: [59, 10.3, 0.4, 0.1, 3.6, 3.2, 0, 36],
    tbsp: 15,
  },
  {
    keys: ['greek yoghurt', 'greek yogurt', 'yogurt', 'yoghurt'],
    per100: [97, 9, 5, 3.5, 3.8, 3.5, 0, 35],
    tbsp: 15,
  },
  { keys: ['cottage cheese'], per100: [98, 11, 4.3, 1.7, 3.4, 2.7, 0, 364], tbsp: 15 },
  { keys: ['feta'], per100: [264, 14, 21, 15, 4.1, 4.1, 0, 917] },
  { keys: ['halloumi'], per100: [321, 22, 25, 17, 2.2, 1.5, 0, 1100] },
  { keys: ['mozzarella'], per100: [280, 28, 17, 11, 3, 1, 0, 620], tbsp: 7 },
  { keys: ['fat-free mozzarella'], per100: [141, 32, 0, 0, 3.5, 1, 0, 700], tbsp: 7 },
  {
    keys: ['parmesan', 'parmigiano', 'parmigiano-reggiano'],
    per100: [431, 38, 29, 19, 4, 0.9, 0, 1530],
    tbsp: 5,
  },
  { keys: ['vegan parmesan'], per100: [400, 12, 32, 8, 14, 2, 4, 900], tbsp: 5 },
  { keys: ['pecorino', 'pecorino romano'], per100: [387, 32, 27, 17, 3.6, 0.7, 0, 1200], tbsp: 5 },
  {
    keys: ['cheese', 'cheddar', 'grated cheese'],
    per100: [403, 25, 33, 21, 1.3, 0.5, 0, 621],
    tbsp: 7,
  },
  // meat and fish
  {
    keys: ['salmon', 'salmon fillet', 'salmon fillets'],
    per100: [208, 20, 13, 3.1, 0, 0, 0, 59],
    piece: 170,
  },
  { keys: ['cooked salmon'], per100: [206, 22, 12, 2.6, 0, 0, 0, 61] },
  { keys: ['beef mince', 'mince'], per100: [137, 21, 5, 2.3, 0, 0, 0, 66] },
  {
    keys: ['bacon', 'streaky bacon', 'smoked bacon', 'smoked streaky bacon'],
    per100: [400, 13, 38, 13, 0.7, 0, 0, 1500],
  },
  {
    keys: ['sausage', 'cheese-filled sausage'],
    per100: [300, 13, 26, 10, 3, 1, 0, 900],
    piece: 90,
  },
  { keys: ['frankfurter'], per100: [290, 11, 26, 9.5, 2.5, 1, 0, 1000], piece: 45 },
  {
    keys: ['chicken', 'chicken breast', 'chicken thigh', 'chicken thighs'],
    per100: [165, 25, 6.5, 1.8, 0, 0, 0, 70],
    piece: 150,
  },
  {
    keys: ['chicken stock', 'stock', 'broth'],
    per100: [4, 0.5, 0.1, 0, 0.4, 0.2, 0, 340],
    tbsp: 15,
  },
  // vegetables
  { keys: ['banana', 'bananas'], per100: [89, 1.1, 0.3, 0.1, 22.8, 12.2, 2.6, 1], piece: 118 },
  { keys: ['avocado'], per100: [160, 2, 14.7, 2.1, 8.5, 0.7, 6.7, 7], piece: 150 },
  { keys: ['blueberries', 'blueberry'], per100: [57, 0.7, 0.3, 0, 14.5, 10, 2.4, 1] },
  {
    keys: ['lemon', 'lemon juice', 'lemons'],
    per100: [22, 0.4, 0.2, 0, 6.9, 2.5, 0.3, 1],
    piece: 45,
    tbsp: 15,
  },
  {
    keys: ['lime', 'lime juice', 'limes'],
    per100: [25, 0.4, 0.1, 0, 8.4, 1.7, 0.4, 2],
    piece: 30,
    tbsp: 15,
  },
  {
    keys: ['zucchini', 'courgette', 'courgettes'],
    per100: [17, 1.2, 0.3, 0.1, 3.1, 2.5, 1, 8],
    piece: 196,
  },
  {
    keys: ['eggplant', 'eggplants', 'aubergine'],
    per100: [25, 1, 0.2, 0, 5.9, 3.5, 3, 2],
    piece: 400,
  },
  {
    keys: ['tomato', 'tomatoes', 'cherry tomatoes'],
    per100: [18, 0.9, 0.2, 0, 3.9, 2.6, 1.2, 5],
    piece: 123,
  },
  {
    keys: ['large tomatoes', 'large tomato'],
    per100: [18, 0.9, 0.2, 0, 3.9, 2.6, 1.2, 5],
    piece: 180,
  },
  {
    keys: ['tinned tomatoes', 'tinned diced tomatoes', 'canned tomatoes'],
    per100: [21, 1, 0.1, 0, 4.4, 2.6, 1, 130],
  },
  {
    keys: ['garlic', 'garlic clove', 'garlic cloves'],
    per100: [149, 6.4, 0.5, 0.1, 33, 1, 2.1, 17],
    piece: 3,
    tbsp: 8.5,
  },
  {
    keys: ['onion', 'onions', 'yellow onion', 'red onion', 'red onions'],
    per100: [40, 1.1, 0.1, 0, 9.3, 4.2, 1.7, 4],
    piece: 110,
  },
  {
    keys: ['spring onion', 'spring onions'],
    per100: [32, 1.8, 0.2, 0, 7.3, 2.3, 2.6, 16],
    piece: 15,
  },
  {
    keys: ['spinach', 'baby spinach'],
    per100: [23, 2.9, 0.4, 0.1, 3.6, 0.4, 2.2, 79],
    handful: 30,
  },
  {
    keys: ['cucumber', 'cucumbers', 'grated cucumber'],
    per100: [15, 0.7, 0.1, 0, 3.6, 1.7, 0.5, 2],
    piece: 150,
  },
  {
    keys: ['sweet potato', 'sweet potatoes'],
    per100: [86, 1.6, 0.1, 0, 20, 4.2, 3, 55],
    piece: 350,
  },
  {
    keys: ['pepper', 'green pepper', 'red pepper', 'bell pepper', 'peppers'],
    per100: [26, 1, 0.3, 0, 6, 4.2, 2.1, 4],
    piece: 120,
  },
  {
    keys: ['jalapeño', 'jalapeños', 'jalapeno'],
    per100: [29, 0.9, 0.4, 0, 6.5, 4.1, 2.8, 3],
    piece: 14,
  },
  {
    keys: ['chilli', 'chili', 'red chilli', 'long red chilli', 'red chili', 'fresh chilli'],
    per100: [40, 1.9, 0.4, 0, 8.8, 5.3, 1.5, 9],
    piece: 15,
  },
  { keys: ['mushroom', 'mushrooms'], per100: [22, 3.1, 0.3, 0, 3.3, 2, 1, 5], piece: 18 },
  { keys: ['carrot', 'carrots'], per100: [41, 0.9, 0.2, 0, 9.6, 4.7, 2.8, 69], piece: 61, tbsp: 7 },
  { keys: ['broccoli', 'broccoli florets'], per100: [34, 2.8, 0.4, 0.1, 6.6, 1.7, 2.6, 33] },
  { keys: ['asparagus'], per100: [20, 2.2, 0.1, 0, 3.9, 1.9, 2.1, 2] },
  { keys: ['ginger', 'fresh ginger'], per100: [80, 1.8, 0.8, 0.2, 18, 1.7, 2, 13], tbsp: 6, cm: 4 },
  { keys: ['chickpeas', 'chickpea'], per100: [139, 7.3, 2.6, 0.3, 22, 4, 6, 240], piece: 400 },
  { keys: ['red lentils', 'lentils'], per100: [352, 24, 1, 0.2, 63, 2, 11, 6] },
  {
    keys: ['chipotle', 'chipotle peppers', 'chipotle peppers in adobo'],
    per100: [79, 2, 2.5, 0.3, 14, 7, 5, 1500],
    piece: 7,
  },
  { keys: ['adobo sauce'], per100: [79, 2, 2.5, 0.3, 14, 7, 5, 1500], tbsp: 15 },
  {
    keys: ['basil', 'parsley', 'dill', 'mint', 'coriander', 'thyme', 'herbs', 'fresh herbs'],
    per100: [30, 3, 0.6, 0.1, 6, 0.9, 3, 50],
    tbsp: 4,
    handful: 15,
  },
  // grains, pasta, bread
  { keys: ['oats', 'rolled oats'], per100: [379, 13, 6.5, 1.2, 68, 1, 10, 6], tbsp: 6 },
  {
    keys: ['pasta', 'penne', 'spaghetti', 'linguine', 'shells', 'short pasta'],
    per100: [371, 13, 1.5, 0.3, 75, 2.7, 3.2, 6],
  },
  { keys: ['egg pasta', 'tagliatelle'], per100: [384, 14.6, 4.4, 1, 71, 2.5, 3.3, 26] },
  {
    keys: ['rice noodles', 'noodles', 'brown rice noodles'],
    per100: [364, 7, 2.8, 0.6, 76, 1, 3, 20],
  },
  {
    keys: ['glass noodles', 'bean thread noodles', 'cellophane noodles', 'mung bean noodles'],
    per100: [351, 0.2, 0.1, 0, 86, 0, 0.5, 10],
  },
  {
    keys: ['flour', 'self-raising flour', 'plain flour'],
    per100: [350, 10, 1, 0.2, 73, 0.5, 3, 1000],
    tbsp: 8,
  },
  {
    keys: ['bread', 'sourdough', 'wholegrain bread', 'toast'],
    per100: [260, 10, 3.3, 0.7, 47, 4.5, 4, 470],
    piece: 40,
  },
  {
    keys: ['tortilla', 'tortillas', 'flour tortillas'],
    per100: [312, 8.5, 7.9, 3, 51, 3, 3, 700],
    piece: 50,
  },
  // nuts, seeds, spreads
  {
    keys: ['walnuts', 'walnut', 'nuts', 'pecans'],
    per100: [654, 15, 65, 6.1, 14, 2.6, 6.7, 2],
    tbsp: 7,
  },
  { keys: ['peanut butter'], per100: [588, 25, 50, 10, 20, 9, 6, 430], tbsp: 16 },
  { keys: ['peanuts', 'crushed peanuts'], per100: [567, 26, 49, 7, 16, 4, 8.5, 18], tbsp: 9 },
  { keys: ['chia', 'chia seeds'], per100: [486, 16.5, 30.7, 3.3, 42, 0, 34, 16], tbsp: 12 },
  { keys: ['tahini'], per100: [595, 17, 54, 7.5, 21, 0.5, 9, 115], tbsp: 15 },
  {
    keys: ['raisins', 'dried fruit', 'sultanas'],
    per100: [299, 3.1, 0.5, 0.1, 79, 59, 3.7, 11],
    tbsp: 9,
  },
  { keys: ['pesto', 'basil pesto'], per100: [440, 5, 44, 7, 6, 3, 1.5, 950], tbsp: 16 },
  // oils, sauces, sweeteners
  {
    keys: [
      'oil',
      'olive oil',
      'extra virgin olive oil',
      'extra-virgin olive oil',
      'avocado oil',
      'sunflower oil',
      'kakhetian oil',
      'sesame oil',
      'toasted sesame oil',
    ],
    per100: [884, 0, 100, 14, 0, 0, 0, 2],
    tbsp: 13.6,
    drizzle: 5,
  },
  { keys: ['coconut oil'], per100: [892, 0, 99, 83, 0, 0, 0, 0], tbsp: 13.6 },
  { keys: ['honey'], per100: [304, 0.3, 0, 0, 82, 82, 0.2, 4], tbsp: 21 },
  { keys: ['maple syrup', 'maple'], per100: [260, 0, 0.1, 0, 67, 60, 0, 12], tbsp: 20 },
  { keys: ['sugar', 'caster sugar'], per100: [387, 0, 0, 0, 100, 100, 0, 1], tbsp: 12.5 },
  {
    keys: ['vanilla', 'vanilla extract'],
    per100: [288, 0.1, 0.1, 0, 12.7, 12.7, 0, 9],
    tbsp: 13,
    little: 2,
  },
  {
    keys: ['soy sauce', 'tamari', 'low-sodium soy sauce', 'low sodium soy sauce'],
    per100: [57, 8, 0.1, 0, 7, 2, 0.8, 3600],
    tbsp: 16,
  },
  { keys: ['fish sauce'], per100: [35, 5.1, 0, 0, 3.6, 3.6, 0, 7850], tbsp: 18 },
  {
    keys: ['sweet dark soy sauce', 'sweet soy sauce', 'kecap manis'],
    per100: [260, 5, 0, 0, 60, 55, 0, 3500],
    tbsp: 20,
  },
  { keys: ['hoisin sauce', 'hoisin'], per100: [220, 3.3, 3.4, 0.5, 44, 27, 2.8, 1615], tbsp: 16 },
  { keys: ['hot sauce', 'sriracha'], per100: [93, 1.9, 0.9, 0.1, 19, 15, 2.2, 2100], tbsp: 17 },
  {
    keys: ['chilli garlic sauce', 'chili garlic sauce'],
    per100: [90, 2, 1, 0.2, 18, 12, 2, 2500],
    tbsp: 17,
  },
  { keys: ['chili crisp', 'chilli crisp'], per100: [480, 8, 42, 6, 20, 5, 6, 2500], tbsp: 14 },
  { keys: ['mustard', 'dijon mustard'], per100: [100, 4.4, 4, 0.2, 5, 1, 4, 1120], tbsp: 15 },
  {
    keys: ['vinegar', 'rice vinegar', 'white wine vinegar'],
    per100: [19, 0, 0, 0, 0.3, 0.3, 0, 1],
    tbsp: 15,
  },
  { keys: ['balsamic vinegar', 'balsamic'], per100: [88, 0.5, 0, 0, 17, 15, 0, 23], tbsp: 16 },
  {
    keys: ['water', 'hot water', 'pasta water', 'cooking water', 'pasta cooking water'],
    per100: [0, 0, 0, 0, 0, 0, 0, 0],
    tbsp: 15,
  },
  // spices and seasoning (per tsp weights in TSP below)
  {
    keys: [
      'salt',
      'sea salt',
      'fine salt',
      'fine sea salt',
      'flaky salt',
      'garlic salt',
      'salt and pepper',
      'salt and black pepper',
    ],
    per100: [0, 0, 0, 0, 0, 0, 0, 38758],
    tbsp: 18,
    pinch: 0.4,
    taste: 1,
  },
  {
    keys: ['black pepper', 'white pepper', 'ground white pepper', 'pepper flakes', 'peppercorns'],
    per100: [251, 10, 3.3, 1.4, 64, 0.6, 25, 20],
    tbsp: 7,
    pinch: 0.3,
  },
  {
    keys: ['chilli flakes', 'chili flakes', 'red pepper flakes'],
    per100: [318, 12, 17, 3, 57, 10, 27, 30],
    tbsp: 5.4,
    pinch: 0.3,
  },
  {
    keys: ['paprika', 'smoked paprika', 'sweet paprika'],
    per100: [282, 14, 13, 2.1, 54, 10, 35, 68],
    tbsp: 7,
  },
  { keys: ['cumin', 'ground cumin'], per100: [375, 18, 22, 1.5, 44, 2.3, 10.5, 168], tbsp: 6 },
  {
    keys: ['cinnamon', 'ground cinnamon'],
    per100: [247, 4, 1.2, 0.3, 81, 2.2, 53, 10],
    tbsp: 7.8,
    pinch: 0.3,
  },
  {
    keys: ['nutmeg', 'ground nutmeg'],
    per100: [525, 5.8, 36, 26, 49, 3, 21, 16],
    tbsp: 7,
    pinch: 0.3,
  },
  { keys: ['ground ginger'], per100: [335, 9, 4.2, 2.6, 72, 3.4, 14, 27], tbsp: 5.4 },
  { keys: ['curry powder', 'garam masala'], per100: [325, 14, 14, 2.3, 56, 2.8, 53, 52], tbsp: 6 },
  {
    keys: [
      'oregano',
      'dried oregano',
      'italian seasoning',
      'italian herb seasoning',
      'mixed herbs',
    ],
    per100: [265, 9, 4.3, 1.5, 69, 4.1, 42.5, 25],
    tbsp: 3,
  },
  { keys: ['garlic powder'], per100: [331, 16.5, 0.7, 0.2, 73, 2.4, 9, 60], tbsp: 9.3 },
  { keys: ['onion powder'], per100: [341, 10, 1, 0.2, 79, 6.6, 15, 73], tbsp: 7.2 },
  { keys: ['baking powder'], per100: [53, 0, 0, 0, 28, 0, 0, 10600], tbsp: 13.8 },
  {
    keys: ['utskho suneli', 'suneli', 'fenugreek', "za'atar", 'zaatar'],
    per100: [323, 23, 6.4, 1.5, 58, 0, 25, 67],
    tbsp: 6,
  },
];

const KEYS = FOODS.flatMap((food) =>
  food.keys.map((key) => ({
    food,
    key,
    re: new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`),
  })),
);

/** Longest keyword wins; the text before the first comma or bracket decides, like the icon lookup. */
function matchFood(name) {
  const text = name.toLowerCase().replace(/[‘’]/g, "'");
  const find = (t) => {
    let best;
    for (const k of KEYS) {
      const at = k.re.exec(t)?.index;
      if (at === undefined) continue;
      if (
        !best ||
        k.key.length > best.key.length ||
        (k.key.length === best.key.length && at < best.at)
      )
        best = { ...k, at };
    }
    return best?.food;
  };
  return find(text.split(/[,(:]| and /)[0]) ?? find(text);
}

/** Grams for one ingredient row, or 0 when it should not count (optional, garnish without an amount). */
function grams(i, food) {
  const name = i.name.toLowerCase();
  const unit = (i.unit ?? '').toLowerCase();
  if (/optional/.test(name)) return 0;
  const about = name.match(/about (\d+)\s*g( each)?/);
  const tbsp = food.tbsp ?? 15;
  if (i.qty !== undefined) {
    switch (unit) {
      case 'g':
        return i.qty;
      case 'kg':
        return i.qty * 1000;
      case 'ml':
        return i.qty * (food.per100[0] > 800 ? 0.92 : food.keys.includes('honey') ? 1.42 : 1);
      case 'l':
        return i.qty * 1000;
      case 'tbsp':
        return i.qty * tbsp;
      case 'tsp':
        return i.qty * (tbsp / 3);
      case 'cm':
        return i.qty * (food.cm ?? 4);
      case 'slice':
      case 'slices':
        return i.qty * (food.piece ?? 40);
      case 'clove':
      case 'cloves':
        return i.qty * 3;
      case 'jar':
        return i.qty * (food.piece ?? 400);
      case '': {
        if (about) return about[2] ? i.qty * Number(about[1]) : Number(about[1]);
        if (/^small|small /.test(name) && food.piece) return i.qty * food.piece * 0.7;
        if (/large/.test(name) && food.piece) return i.qty * food.piece * 1.2;
        return i.qty * (food.piece ?? NaN);
      }
      default:
        return NaN;
    }
  }
  if (unit === 'to cover') return 120;
  if (unit === 'to serve') return 0;
  if (unit === 'pinch') return food.pinch ?? 0.5;
  if (unit === 'handful') return food.handful ?? 25;
  if (unit === 'drizzle') return food.drizzle ?? 5;
  if (unit === 'a little') return food.little ?? 2;
  if (unit === 'spoonful') return tbsp * 2;
  if (unit === 'to taste' || /salt/.test(name)) return food.taste ?? 1;
  if (/black pepper/.test(name)) return 2;
  return 0;
}

const FIELDS = ['calories', 'protein', 'fat', 'saturatedFat', 'carbs', 'sugars', 'fibre', 'sodium'];

/** @returns {{ nutrition: object, report: string[] }} per-serving values plus one report line per row */
export function estimateNutrition(recipe) {
  const totals = [0, 0, 0, 0, 0, 0, 0, 0];
  const report = [];
  for (const i of recipe.ingredients) {
    const food = matchFood(i.name);
    if (!food) {
      report.push(`  ?? no match: ${i.name}`);
      continue;
    }
    const g = grams(i, food);
    if (Number.isNaN(g)) {
      report.push(
        `  ?? no weight for "${[i.qty, i.unit].filter(Boolean).join(' ')}" of ${food.keys[0]}: ${i.name}`,
      );
      continue;
    }
    food.per100.forEach((v, n) => (totals[n] += (v * g) / 100));
    report.push(
      `  ${String(Math.round(g)).padStart(5)} g  ${String(Math.round((food.per100[0] * g) / 100)).padStart(5)} kcal  ${food.keys[0].padEnd(22)} ${i.name}`,
    );
  }
  const per = totals.map((t) => t / recipe.servings);
  const nutrition = { basis: 'estimate' };
  FIELDS.forEach(
    (f, n) =>
      (nutrition[f] =
        Math.round(f === 'calories' || f === 'sodium' ? per[n] : per[n] * 10) /
        (f === 'calories' || f === 'sodium' ? 1 : 10)),
  );
  return { nutrition, report };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL('../src/data/recipes.json', import.meta.url);
  const recipes = JSON.parse(await readFile(file, 'utf8'));
  const slugs = process.argv.slice(2);
  const targets = slugs.length
    ? recipes.filter((r) => slugs.includes(r.slug))
    : recipes.filter((r) => !r.nutrition);
  for (const r of targets) {
    const { nutrition, report } = estimateNutrition(r);
    r.nutrition = nutrition;
    console.log(
      `\n${r.slug} (serves ${r.servings})\n${report.join('\n')}\n  = per serving ${JSON.stringify(nutrition)}`,
    );
  }
  await writeFile(file, JSON.stringify(recipes, null, 2) + '\n');
  console.log(`\n${targets.length} recipe(s) estimated`);
}
