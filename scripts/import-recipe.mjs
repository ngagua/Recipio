#!/usr/bin/env node
// Import a recipe from any site that publishes schema.org Recipe JSON-LD (most do).
//
//   node scripts/import-recipe.mjs <url> [--category dinner,kid-friendly] [--tags "One pan,Freezer friendly"] [--level Easy|Medium|Hard] [--force]
//
// Picks the largest photo on offer, saves it to public/recipes/<slug>.<ext> (downscaled to 2000px on macOS, never upscaled),
// converts imperial amounts to metric, and appends the recipe to src/data/recipes.json.
// Review the printed JSON afterwards: blurbs, categories, ingredient parsing and cup-to-gram conversions are best guesses.
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const args = process.argv.slice(2);
const url = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!url) {
  console.error(
    'usage: node scripts/import-recipe.mjs <url> [--category a,b] [--tags "x,y"] [--level Easy|Medium|Hard] [--force]',
  );
  process.exit(1);
}
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const force = args.includes('--force');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';

const html = await (
  await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } })
).text();

// --- locate the Recipe object: top level, inside arrays, or inside @graph ---
const isRecipe = (o) =>
  o && typeof o === 'object' && [].concat(o['@type'] ?? []).includes('Recipe');
const findRecipe = (node) => {
  if (Array.isArray(node)) return node.map(findRecipe).find(Boolean);
  if (!node || typeof node !== 'object') return undefined;
  if (isRecipe(node)) return node;
  return findRecipe(node['@graph']) ?? findRecipe(node.mainEntity);
};
let ld;
for (const m of html.matchAll(
  /<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi,
)) {
  try {
    ld = findRecipe(JSON.parse(m[1].trim()));
  } catch {
    // malformed block, keep looking
  }
  if (ld) break;
}
if (!ld) {
  console.error(
    'No schema.org Recipe found on that page. Add it to src/data/recipes.json by hand.',
  );
  process.exit(2);
}

// --- text helpers ---
const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  frac13: '⅓',
  frac23: '⅔',
  frac18: '⅛',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  deg: '°',
  times: '×',
};
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const text = (v) =>
  decode(String(v ?? '').replace(/<[^>]+>/g, ''))
    .replace(/,?\s*\(?see notes?\)?/gi, '') // the notes are not imported
    .replace(/([.!?])(?=[A-Z])/g, '$1 ') // "jars.Place": sentences glued together by stripped markup
    .replace(/\s+/g, ' ')
    .trim();
const slugify = (s) =>
  text(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const minutes = (iso) => {
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso ?? '');
  return m ? (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
};
const clock = (iso) => {
  const m = /T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso ?? '');
  if (!m) return undefined;
  const mins = (+m[1] || 0) * 60 + (+m[2] || 0);
  return `${mins}:${String(+m[3] || 0).padStart(2, '0')}`;
};
const cleanUrl = (u) => {
  try {
    return new URL(text(u).replace(/[“”"'‘’]/g, '')).toString();
  } catch {
    return undefined;
  }
};
const reachable = async (u) => {
  try {
    return (await fetch(u, { method: 'HEAD', headers: { 'user-agent': UA } })).ok;
  } catch {
    return false;
  }
};
const meta = (prop) =>
  html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
  )?.[1] ??
  html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'),
  )?.[1];

// --- numbers and imperial -> metric ---
const FRACTION = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 0.33, '⅔': 0.67, '⅛': 0.125 };
const NUMBER = '(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\s*[¼½¾⅓⅔⅛]|[¼½¾⅓⅔⅛]|\\d+(?:[.,]\\d+)?)';
const toNumber = (t) =>
  t.split(/\s+/).reduce((sum, p) => {
    const mixed = /^(\d+)?([¼½¾⅓⅔⅛])$/.exec(p); // "½", "1½"
    if (mixed) return sum + (+mixed[1] || 0) + FRACTION[mixed[2]];
    const [a, b] = p.split('/');
    return sum + (b ? +a / +b : +a.replace(',', '.'));
  }, 0);
const round = (n) => (n >= 20 ? Math.round(n / 5) * 5 : Math.round(n));
const ML_PER = { cup: 240, cups: 240, pint: 475, pints: 475, quart: 950, quarts: 950 };
const G_PER_OZ = 28.35;
const G_PER_LB = 454;
// Grams per US cup for things you would weigh. Anything else converts by volume to millilitres, which is exact.
// ponytail: keyword lookup, first match wins; add a row when an import shows "ml" for a dry ingredient.
const CUP_GRAMS = [
  ['icing sugar', 120],
  ['powdered sugar', 120],
  ['brown sugar', 220],
  ['sugar', 200],
  ['bread flour', 130],
  ['wholemeal flour', 120],
  ['whole wheat flour', 120],
  ['almond flour', 96],
  ['flour', 125],
  ['rolled oats', 90],
  ['oats', 90],
  ['rice', 185],
  ['quinoa', 170],
  ['lentils', 190],
  ['couscous', 175],
  ['panko', 50],
  ['breadcrumbs', 100],
  ['cocoa', 100],
  ['cornflour', 120],
  ['cornstarch', 120],
  ['desiccated coconut', 80],
  ['shredded coconut', 80],
  ['coconut flakes', 60],
  ['chocolate chips', 170],
  ['chocolate', 170],
  ['peanut butter', 250],
  ['nut butter', 250],
  ['tahini', 240],
  ['butter', 227],
  ['almonds', 140],
  ['pecans', 100],
  ['walnuts', 100],
  ['cashews', 130],
  ['peanuts', 145],
  ['hazelnuts', 135],
  ['pistachios', 125],
  ['nuts', 120],
  ['pepitas', 130],
  ['pumpkin seeds', 130],
  ['sunflower seeds', 130],
  ['chia', 160],
  ['flax', 150],
  ['sesame', 145],
  ['seeds', 130],
  ['raisins', 150],
  ['sultanas', 150],
  ['cranberries', 120],
  ['dates', 150],
  ['dried fruit', 150],
  ['honey', 340],
  ['maple syrup', 320],
  ['golden syrup', 340],
  ['pesto', 240],
  ['cherry tomatoes', 150],
  ['tomatoes', 180],
  ['sweet potato', 135],
  ['potato', 150],
  ['cauliflower', 100],
  ['onion', 160],
  ['peppers', 150],
  ['pepper', 150],
  ['spinach', 30],
  ['mushrooms', 70],
  ['carrot', 130],
  ['celery', 100],
  ['zucchini', 125],
  ['courgette', 125],
  ['broccoli', 90],
  ['cucumber', 130],
  ['cream cheese', 225],
  ['yogurt', 245],
  ['yoghurt', 245],
  ['sour cream', 240],
  ['parmesan', 90],
  ['cheese', 100],
  ['chickpeas', 165],
  ['beans', 170],
  ['peas', 145],
  ['sweetcorn', 165],
  ['corn', 165],
  ['blueberries', 150],
  ['strawberries', 150],
  ['berries', 150],
];
const gramsPerCup = (name) => {
  const n = name.toLowerCase();
  if (/\b(milk|water|stock|broth|juice|wine|beer|vinegar|oil|coffee|tea)\b/.test(n))
    return undefined;
  return CUP_GRAMS.find(([key]) => n.includes(key))?.[1];
};
/** Converts cups / oz / lb / inches / °F inside free text. `g` is grams per cup for the ingredient the text belongs to. */
const metricText = (s, g) =>
  s
    .replace(
      new RegExp(`(${NUMBER})[\\s-]*(cups?|fl\\.? ?oz|ounces?|oz|pounds?|lbs?)\\b`, 'gi'),
      (_, n, u) => {
        const q = toNumber(n);
        const unit = u.toLowerCase();
        if (unit.startsWith('cup')) return g ? `${round(q * g)}g` : `${round(q * 240)}ml`;
        if (unit.startsWith('fl')) return `${round(q * 30)}ml`;
        if (/^(oz|ounce)/.test(unit)) return `${round(q * G_PER_OZ)}g`;
        return `${round(q * G_PER_LB)}g`;
      },
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)[- ]?inch(?:es)?\b/gi,
      (_, a, b) => `${Math.round(a * 2.54)}x${Math.round(b * 2.54)}cm`,
    )
    .replace(
      new RegExp(`(${NUMBER})[- ]?inch(?:es)?\\b`, 'gi'),
      (_, n) => `${Math.round(toNumber(n) * 2.54)}cm`,
    )
    .replace(
      new RegExp(`(${NUMBER})\\s*["”″]`, 'g'), // 1” cubes
      (_, n) => `${Math.round(toNumber(n) * 2.54)}cm`,
    )
    .replace(
      /(\d{2,3})\s*(?:(?:°|º|degrees?\s*)?(?:F|Fahrenheit)\b|degrees\b(?!\s*C))/g,
      (_, f) => {
        const c = ((f - 32) * 5) / 9;
        return `${c >= 100 ? Math.round(c / 5) * 5 : Math.round(c)}°C`; // ovens to 5°C, internal temperatures exact
      },
    );
/** Converts a parsed ingredient's own unit. */
const metric = (i) => {
  if (!i.qty || !i.unit) return i;
  const u = i.unit;
  if (ML_PER[u]) {
    const g = gramsPerCup(i.name);
    return g
      ? { ...i, qty: round((i.qty * ML_PER[u] * g) / 240), unit: 'g' }
      : { ...i, qty: round(i.qty * ML_PER[u]), unit: 'ml' };
  }
  if (u === 'oz') return { ...i, qty: round(i.qty * G_PER_OZ), unit: 'g' };
  if (u === 'floz') return { ...i, qty: round(i.qty * 30), unit: 'ml' };
  if (u === 'lb') return { ...i, qty: round(i.qty * G_PER_LB), unit: 'g' };
  if ((u === 'stick' || u === 'sticks') && /butter/i.test(i.name))
    return { ...i, qty: round(i.qty * 113), unit: 'g' };
  return i;
};

// --- ingredient lines -> { qty, unit, name } ---
const UNITS = new Set(
  'g kg ml l tsp tbsp cup cups oz floz lb pint pints quart quarts clove cloves slice slices sprig sprigs tin tins can cans handful pinch bunch stick sticks sheet sheets piece pieces'.split(
    ' ',
  ),
);
const ALIAS = {
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  millilitre: 'ml',
  millilitres: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',
};
// "1 1/2 tbsp sugar" | "1 ½ cups oats" | "400g beans" | "½ tsp salt" | "2-3 cloves garlic" | "8 fl oz milk" | "2 eggs" | "salt and pepper"
const parseIngredient = (raw) => {
  const s = text(raw);
  const m = new RegExp(
    `^(${NUMBER})(?:\\s*(?:-|–|to)\\s*\\d+(?:[.,]\\d+)?)?\\s*([a-zA-Z]+\\.?)?\\s*(.*)$`,
  ).exec(s);
  if (!m) return { name: metricText(s, gramsPerCup(s)) };
  const qty = Math.round(toNumber(m[1]) * 100) / 100;
  const rawUnit = m[2]?.replace(/\.$/, '');
  let unit = rawUnit === 'T' ? 'tbsp' : rawUnit === 't' ? 'tsp' : rawUnit?.toLowerCase();
  let name = m[3];
  if (unit === 'fl' && /^oz\b/i.test(name)) {
    unit = 'floz';
    name = name.replace(/^oz\.?\s*/i, '');
  }
  if (unit && ALIAS[unit]) unit = ALIAS[unit];
  if (unit && !UNITS.has(unit)) {
    name = `${m[2]} ${name}`.trim(); // "2 large eggs": the word after the number belongs to the name
    unit = undefined;
  }
  if (name.startsWith('of ')) name = name.slice(3);
  const parsed = metric(unit ? { qty, unit, name } : { qty, name });
  const cleanName = metricText(parsed.name, gramsPerCup(parsed.name))
    // "400 grams (13.5 oz.) tomatoes" converts to "(385g.) tomatoes": drop a leading bracketed amount, it duplicates qty
    .replace(/^\(\s*~?[\d.]+\s*(?:g|kg|ml|l)\.?\)\s*/i, '');
  return { ...parsed, name: cleanName };
};

const steps = [];
const walk = (n) => {
  if (!n) return;
  if (typeof n === 'string') steps.push(metricText(text(n)));
  else if (Array.isArray(n)) n.forEach(walk);
  else if (n.itemListElement) walk(n.itemListElement);
  else if (n.text) steps.push(metricText(text(n.text)));
};
walk(ld.recipeInstructions);

// --- photo: the largest of what the page offers ---
const imageDims = (buf) => {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (buf.toString('ascii', 1, 4) === 'PNG')
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ')
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L')
      return {
        w: 1 + (((buf[22] & 0x3f) << 8) | buf[21]),
        h: 1 + (((buf[24] & 0xf) << 10) | (buf[23] << 2) | ((buf[22] & 0xc0) >> 6)),
      };
    if (chunk === 'VP8X')
      return {
        w: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        h: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      };
  }
  return { w: 0, h: 0 };
};
const slug = slugify(ld.name);
const ldImages = []
  .concat(ld.image ?? [])
  .map((i) => (typeof i === 'string' ? i : i?.url))
  .filter(Boolean);
const candidates = [
  ...new Set(
    [
      ...ldImages.map((u) => u.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)(?:\?|$))/i, '')), // WordPress thumbnail -> original
      meta('og:image'),
      meta('twitter:image'),
      ...ldImages,
    ]
      .map(cleanUrl)
      .filter(Boolean),
  ),
].slice(0, 6);
let best;
for (const candidate of candidates) {
  try {
    const res = await fetch(candidate, { headers: { 'user-agent': UA } });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const { w, h } = imageDims(buf);
    if (!best || w > best.w) best = { w, h, buf, type: res.headers.get('content-type') ?? '' };
    if (w >= 1600) break;
  } catch {
    // unreachable candidate, try the next
  }
}
let image = '';
if (best) {
  const ext = best.type.includes('png') ? 'png' : best.type.includes('webp') ? 'webp' : 'jpg';
  const path = `public/recipes/${slug}.${ext}`;
  await mkdir('public/recipes', { recursive: true });
  await writeFile(path, best.buf);
  // macOS ships sips: keep photos at web size so the repo stays small (never upscale)
  if (process.platform === 'darwin' && Math.max(best.w, best.h) > 2000)
    await promisify(execFile)('sips', ['-Z', '2000', path]).catch(() => {});
  image = `/recipes/${slug}.${ext}`;
  console.error(`photo: ${best.w}x${best.h} from ${candidates.length} candidate(s)`);
}

// --- build the recipe ---
const time = minutes(ld.totalTime) || minutes(ld.prepTime) + minutes(ld.cookTime) || 30;
const description = metricText(text(ld.description));
const guessCategories = () => {
  const hay = [ld.recipeCategory, ld.keywords, ld.name].flat().join(' ').toLowerCase();
  const cats = ['breakfast', 'lunch', 'dinner', 'dessert', 'baking'].filter((c) => hay.includes(c));
  if (hay.includes('brunch')) cats.push('breakfast');
  return cats.length ? [...new Set(cats)] : ['dinner'];
};
const categories =
  opt('category')
    ?.split(',')
    .map((s) => s.trim()) ?? guessCategories();
const diet = `${[].concat(ld.suitableForDiet ?? []).join(' ')} ${ld.keywords ?? ''}`.toLowerCase();
if (/vegetarian|vegan/.test(diet) && !categories.includes('veggie')) categories.push('veggie');
if (time <= 30 && !categories.includes('quick')) categories.push('quick');

let video;
for (const candidate of [ld.video?.contentUrl, ld.video?.embedUrl].map(cleanUrl).filter(Boolean)) {
  if (await reachable(candidate)) {
    video = { url: candidate, duration: clock(ld.video?.duration) };
    break;
  }
}

const recipe = {
  slug,
  title: text(ld.name),
  blurb: description.split(/(?<=[.!?])\s/)[0].slice(0, 140),
  description,
  categories,
  tags:
    opt('tags')
      ?.split(',')
      .map((s) => s.trim()) ?? [],
  image,
  imageAlt: text(ld.name),
  time,
  level: opt('level') ?? 'Easy',
  servings: parseInt([].concat(ld.recipeYield ?? [])[0]) || 4,
  ingredients: [].concat(ld.recipeIngredient ?? []).map(parseIngredient),
  steps,
  ...(video ? { video } : {}),
  source: { name: new URL(url).hostname.replace(/^www\./, ''), url },
  added: new Date().toISOString().slice(0, 10),
};

const file = 'src/data/recipes.json';
const recipes = JSON.parse(await readFile(file, 'utf8'));
const existing = recipes.findIndex((r) => r.slug === slug);
if (existing >= 0 && !force) {
  console.error(`"${slug}" is already in ${file}. Re-run with --force to replace it.`);
  process.exit(3);
}
if (existing >= 0) recipes[existing] = recipe;
else recipes.push(recipe);
await writeFile(file, JSON.stringify(recipes, null, 2) + '\n');
console.log(JSON.stringify(recipe, null, 2));
console.log(`\n${existing >= 0 ? 'Replaced' : 'Added'} "${recipe.title}" → /recipes/${slug}`);
