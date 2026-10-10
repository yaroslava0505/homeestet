// Builds src/data/shopCatalog.ts from the raw store exports in assets-src/shop/*.json.
// Run: npm run shop. Picks up to TARGET_PER_CATEGORY items per category, balanced across price bands,
// so every category has cheap, mid and upper variants. Pure data step: no network.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['sinsay', 'epicentr'];
const OUT = path.join(ROOT, 'src/data/shopCatalog.ts');

const TARGET_PER_CATEGORY = 14;
const MAX_PER_STORE_PER_CATEGORY = { sinsay: 7, epicentr: 14 };
const MIN_PRICE = 40;
const PRICE_BANDS = [250, 600, 1200, Infinity];

// Must match SHOP_CATEGORIES in src/data/shopCategories.ts.
const CATEGORY_IDS = [
  'organizers', 'baskets', 'shelves', 'hooks', 'shoe-storage', 'racks',
  'throws', 'bedspreads', 'pillows', 'wall-art', 'frames', 'mirrors', 'clocks', 'boxes',
  'table-lamps', 'floor-lamps', 'garlands', 'candles', 'candle-holders', 'vases', 'plants', 'trays',
  'kitchen-jars', 'rails',
];

/** Source category → our category. A function may look at the product name. */
const MAP = {
  epicentr: {
    'organayzery-tekstilnye': 'organizers',
    'yashchiki-dlya-khraneniya': 'organizers',
    'kashpo-i-korzinki-dekorativnye': 'baskets',
    'korziny-dlya-belya': 'baskets',
    polki: 'shelves',
    'klyuchnitsy-nastennye': 'hooks',
    veshalki: 'hooks',
    'podstavki-dlya-obuvi': 'shoe-storage',
    'stellazhi-dlya-khraneniya': 'racks',
    pledy: 'throws',
    pokryvala: 'bedspreads',
    'dekorativnye-podushki': 'pillows',
    kartiny: 'wall-art',
    'panno-i-dekor-nastennyy': 'wall-art',
    'ramki-dlya-foto': 'frames',
    dzerkala: 'mirrors',
    chasy: 'clocks',
    shkatulki: 'boxes',
    'nastolnye-lampy': 'table-lamps',
    torshery: 'floor-lamps',
    girlyandy: 'garlands',
    aromasvechi: 'candles',
    aromadiffuzory: 'candles',
    svechi: 'candles',
    podsvechniki: 'candle-holders',
    vazy: 'vases',
    'tsvety-dekorativnye': 'plants',
    'banki-i-butylki': 'kitchen-jars',
    'reylingi-dlya-kukhni': 'rails',
  },
  sinsay: {
    pledy: 'throws',
    navolochky: 'pillows',
    tatsi: 'trays',
    vazy: 'vases',
    zberihannia: (name) => (/кошик/i.test(name) ? 'baskets' : 'organizers'),
    aromat: 'candles',
    svichnyky: 'candle-holders',
    lampy: (name) => (/підлогов/i.test(name) ? 'floor-lamps' : 'table-lamps'),
    dzerkala: 'mirrors',
    spetsii: 'kitchen-jars',
  },
};

/** Seasonal, children's and off-topic items never make good "variants". */
const EXCLUDE =
  /дитяч|новорічн|різдвян|геловін|хелоу|хеллоу|hello kitty|kuromi|disney|mickey|minecraft|автомобіл|худі|hoodie|шкарпетк|великодн|пасхал|сніговик|ялинк|гном|олен|пряник|омел|гарбуз|для собак|для кот|кліт|гараж|складськ|архівн|плечик|тремпел|наручн|пляшк|для води|спортивн|для макіяж|косметичн|кишеньков|єдиноріг|динозавр|астронавт|bambinelli|уцінк|б\/у/i;

const sha = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

const candidates = [];
for (const store of SOURCES) {
  const file = path.join(ROOT, 'assets-src/shop', `${store}.json`);
  const { items } = JSON.parse(readFileSync(file, 'utf8'));
  for (const raw of items) {
    const rule = MAP[store][raw.cat];
    if (!rule) continue;
    const category = typeof rule === 'function' ? rule(raw.name) : rule;
    if (!category || !CATEGORY_IDS.includes(category)) continue;
    const name = String(raw.name).replace(/\s+/g, ' ').trim();
    const price = Math.round(Number(raw.price));
    if (!name || !Number.isFinite(price) || price < MIN_PRICE) continue;
    if (!/^https:\/\//.test(raw.url) || !/^https:\/\//.test(raw.image)) continue;
    if (EXCLUDE.test(name)) continue;
    const item = { id: `shop-${store}-${sha(raw.url)}`, name, category, price, store, url: raw.url, image: raw.image };
    if (raw.rating) item.rating = Number(raw.rating);
    if (raw.reviews) item.reviews = Number(raw.reviews);
    candidates.push(item);
  }
}

// Dedupe by url and by name within a store (colour variants of one product keep only the first).
const seenUrl = new Set();
const seenName = new Set();
const unique = candidates.filter((p) => {
  const nameKey = `${p.store}:${p.name.toLowerCase()}`;
  if (seenUrl.has(p.url) || seenName.has(nameKey)) return false;
  seenUrl.add(p.url);
  seenName.add(nameKey);
  return true;
});

const bandOf = (price) => PRICE_BANDS.findIndex((limit) => price < limit);
const storeRank = { sinsay: 0, epicentr: 1 };
const byPreference = (a, b) =>
  storeRank[a.store] - storeRank[b.store] || (b.reviews ?? 0) - (a.reviews ?? 0) || a.price - b.price;

const selected = [];
const report = [];
for (const category of CATEGORY_IDS) {
  const pool = unique.filter((p) => p.category === category).sort(byPreference);
  const bands = PRICE_BANDS.map(() => []);
  for (const p of pool) bands[bandOf(p.price)].push(p);
  const picked = [];
  const perStore = { sinsay: 0, epicentr: 0 };
  // Round-robin across price bands so the cheap and the upper range are both represented.
  while (picked.length < TARGET_PER_CATEGORY && bands.some((b) => b.length)) {
    for (const band of bands) {
      while (band.length) {
        const p = band.shift();
        if (perStore[p.store] >= MAX_PER_STORE_PER_CATEGORY[p.store]) continue;
        perStore[p.store] += 1;
        picked.push(p);
        break;
      }
      if (picked.length >= TARGET_PER_CATEGORY) break;
    }
  }
  picked.sort((a, b) => a.price - b.price);
  selected.push(...picked);
  report.push(`${category.padEnd(15)} ${String(picked.length).padStart(2)} items  ${picked[0]?.price ?? '-'}–${picked.at(-1)?.price ?? '-'} ₴  sinsay ${perStore.sinsay}, epicentr ${perStore.epicentr}`);
}

const header = [
  '// Generated by scripts/build-shop-catalog.mjs from assets-src/shop/*.json. Do not edit by hand: run `npm run shop`.',
  '// Prices and links as collected on the date in the source files; images load from the stores’ CDNs.',
  "import type { ShopProduct } from '../types.ts';",
  '',
  'export const SHOP_CATALOG: ShopProduct[] = [',
];
const body = selected.map((p) => `  ${JSON.stringify(p)},`);
writeFileSync(OUT, [...header, ...body, '];', ''].join('\n'));
console.log(report.join('\n'));
console.log(`\n${selected.length} products → ${path.relative(ROOT, OUT)}`);
