// Refreshes assets-src/shop/epicentr.json: downloads the listing page of each category below and reads the
// products from the page's JSON-LD ItemList (name, image, price) plus the product link from the card markup.
// Run: npm run shop:fetch && npm run shop. Polite: 4 requests at a time, one page per category (60 items).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets-src/shop/epicentr.json');
const BASE = 'https://epicentrk.ua';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

const CATEGORIES = [
  'organayzery-tekstilnye', 'yashchiki-dlya-khraneniya', 'kashpo-i-korzinki-dekorativnye', 'korziny-dlya-belya',
  'polki', 'klyuchnitsy-nastennye', 'veshalki', 'podstavki-dlya-obuvi', 'stellazhi-dlya-khraneniya',
  'pledy', 'pokryvala', 'dekorativnye-podushki',
  'kartiny', 'panno-i-dekor-nastennyy', 'ramki-dlya-foto', 'dzerkala', 'chasy', 'shkatulki',
  'nastolnye-lampy', 'torshery', 'girlyandy',
  'aromasvechi', 'aromadiffuzory', 'svechi', 'podsvechniki', 'vazy', 'tsvety-dekorativnye',
  'banki-i-butylki', 'reylingi-dlya-kukhni',
];

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function fetchCategory(cat) {
  const res = await fetch(`${BASE}/ua/shop/${cat}/`, { headers: { 'User-Agent': UA, 'Accept-Language': 'uk-UA,uk;q=0.9' } });
  if (!res.ok) throw new Error(`${cat}: HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/<script[^>]*type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"ItemList"[\s\S]*?)<\/script>/);
  if (!m) return [];
  const list = JSON.parse(m[1]).itemListElement ?? [];
  const items = [];
  for (const el of list) {
    const p = el.item ?? {};
    const name = String(p.name ?? '').trim();
    if (!name) continue;
    // The wishlist button carries the product name; the first product link after it is the card link.
    let at = html.indexOf('товар: ' + escapeAttr(name));
    if (at < 0) at = html.indexOf('товар: ' + name);
    const link = at >= 0 ? html.slice(at, at + 6000).match(/href="(\/ua\/shop\/[^"]+\.html)"/) : null;
    if (!link) continue;
    items.push({
      cat,
      name,
      price: p.offers?.price ?? null,
      image: Array.isArray(p.image) ? p.image[0] : p.image ?? null,
      url: BASE + link[1],
      rating: p.aggregateRating?.ratingValue ?? null,
      reviews: p.aggregateRating?.reviewCount ?? null,
    });
  }
  return items;
}

const queue = [...CATEGORIES];
const all = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const cat = queue.shift();
      try {
        const items = await fetchCategory(cat);
        all.push(...items);
        console.log(`${cat}: ${items.length}`);
      } catch (err) {
        console.error(String(err));
      }
    }
  })
);
const items = all.filter((x) => x.price && x.image && x.url);
writeFileSync(
  OUT,
  JSON.stringify(
    { store: 'epicentr', collected: new Date().toISOString().slice(0, 10), note: 'Згенеровано scripts/fetch-epicentr.mjs. cat = slug категорії epicentrk.ua/ua/shop/<cat>/', items },
    null,
    0
  )
);
console.log(`${items.length} products → ${path.relative(ROOT, OUT)}`);
