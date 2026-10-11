import type { PhotoPlan, PhotoPlanShopping, ShopProduct, ShopStore } from '../types.ts';
import type { ShopCategoryId } from '../data/shopCategories.ts';
import { defaultShoppingFor } from '../data/shopCategories.ts';

/**
 * Helpers for the "variants from stores" block. The catalogue itself (`src/data/shopCatalog.ts`, ~120 KB)
 * is loaded on demand by the component, so these functions take it as an argument and stay pure.
 */

export const STORE_NAMES: Record<ShopStore, string> = { sinsay: 'Sinsay', epicentr: 'Епіцентр', bi: 'Будинок іграшок' };

/**
 * Affiliate deeplink prefix per store. Empty until the partner-network account (Admitad) is approved;
 * then set e.g. `https://ad.admitad.com/g/<code>/?ulp=` and every store link becomes a tracked one.
 */
const AFFILIATE_PREFIX: Partial<Record<ShopStore, string>> = {
  bi: 'https://gndrz.com/g/1xuxd52d9o28fa5118602165fe5e9d/?ulp=',
};

/** Store URL wrapped into the partner-network deeplink when the store has one. */
export function affiliateLink(store: ShopStore, url: string): string {
  const prefix = AFFILIATE_PREFIX[store];
  return prefix ? `${prefix}${encodeURIComponent(url)}` : url;
}

export function storeLink(product: ShopProduct): string {
  return affiliateLink(product.store, product.url);
}

/** At least this many variants are shown even when nothing fits the budget, so the block is never empty. */
const MIN_VARIANTS = 3;

/** Variants of one category within the budget, cheapest first. */
export function variantsFor(catalog: ShopProduct[], category: ShopCategoryId, budgetLimit: number): ShopProduct[] {
  const all = catalog.filter((p) => p.category === category).sort((a, b) => a.price - b.price);
  const within = all.filter((p) => p.price <= budgetLimit);
  return within.length >= MIN_VARIANTS ? within : all.slice(0, MIN_VARIANTS);
}

/** Up to `count` items spread evenly over a price-sorted list, so cheap, mid and upper prices all show up front. */
export function pickSpread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const picked: T[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round((i * (items.length - 1)) / (count - 1));
    const candidate = items[index];
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
}

/** Categories to show for a plan: the model's choice, or zone defaults for analyses saved before this feature. */
export function shoppingFor(plan: Pick<PhotoPlan, 'shopping' | 'zoneId' | 'isInterior'>): PhotoPlanShopping[] {
  if (plan.shopping && plan.shopping.length > 0) return plan.shopping;
  if (!plan.isInterior) return [];
  return defaultShoppingFor(plan.zoneId);
}

/** Loads the catalogue chunk once; later calls reuse the same promise. */
let catalogPromise: Promise<ShopProduct[]> | null = null;
export function loadShopCatalog(): Promise<ShopProduct[]> {
  catalogPromise ??= import('../data/shopCatalog.ts').then((m) => m.SHOP_CATALOG);
  return catalogPromise;
}
