import { describe, expect, it } from 'vitest';
import { SHOP_CATALOG } from '../data/shopCatalog.ts';
import { SHOP_CATEGORIES, SHOP_CATEGORY_IDS, ZONE_SHOP_DEFAULTS, defaultShoppingFor } from '../data/shopCategories.ts';
import { shoppingFor, storeLink, variantsFor } from '../lib/shop.ts';
import { ZONES } from '../data/homeestetData.ts';

const STORE_HOSTS: Record<string, RegExp> = {
  sinsay: /^https:\/\/www\.sinsay\.com\/ua\/uk\//,
  epicentr: /^https:\/\/epicentrk\.ua\/ua\/shop\//,
};

describe('partner-store catalogue', () => {
  it('every product has a unique id, a real store link, an https image and a positive price', () => {
    const ids = new Set<string>();
    for (const p of SHOP_CATALOG) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(p.url, p.id).toMatch(STORE_HOSTS[p.store]);
      expect(p.image, p.id).toMatch(/^https:\/\//);
      expect(p.price, p.id).toBeGreaterThan(0);
      expect(Number.isInteger(p.price), p.id).toBe(true);
      expect(p.name.length, p.id).toBeGreaterThan(3);
      expect(SHOP_CATEGORY_IDS).toContain(p.category);
    }
  });

  it('every category has several variants, including some under 1 000 ₴', () => {
    for (const { id } of SHOP_CATEGORIES) {
      const items = SHOP_CATALOG.filter((p) => p.category === id);
      expect(items.length, id).toBeGreaterThanOrEqual(4);
      expect(items.filter((p) => p.price <= 1000).length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('zone defaults reference real zones and categories', () => {
    for (const [zoneId, categories] of Object.entries(ZONE_SHOP_DEFAULTS)) {
      expect(ZONES.some((z) => z.id === zoneId), zoneId).toBe(true);
      for (const c of categories) expect(SHOP_CATEGORY_IDS).toContain(c);
      expect(new Set(categories).size).toBe(categories.length);
    }
    expect(defaultShoppingFor('kitchen').map((s) => s.category)).toEqual(ZONE_SHOP_DEFAULTS.kitchen);
    expect(defaultShoppingFor(null)).toHaveLength(4);
  });
});

describe('variants for a plan', () => {
  it('stay within the budget and are sorted by price', () => {
    const items = variantsFor(SHOP_CATALOG, 'throws', 1000);
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const p of items) expect(p.price).toBeLessThanOrEqual(1000);
    for (let i = 1; i < items.length; i++) expect(items[i].price).toBeGreaterThanOrEqual(items[i - 1].price);
  });

  it('never come back empty: the cheapest items are shown when nothing fits', () => {
    const items = variantsFor(SHOP_CATALOG, 'floor-lamps', 100);
    expect(items).toHaveLength(3);
  });

  it('older saved analyses without a shopping block fall back to the zone defaults', () => {
    expect(shoppingFor({ zoneId: 'hallway', isInterior: true }).map((s) => s.category)).toEqual(ZONE_SHOP_DEFAULTS.hallway);
    expect(shoppingFor({ zoneId: null, isInterior: false })).toEqual([]);
    const own = [{ category: 'vases' as const, why: 'test' }];
    expect(shoppingFor({ zoneId: 'sofa', isInterior: true, shopping: own })).toBe(own);
  });

  it('store links are plain product URLs until an affiliate prefix is configured', () => {
    const p = SHOP_CATALOG[0];
    expect(storeLink(p)).toBe(p.url);
  });
});
