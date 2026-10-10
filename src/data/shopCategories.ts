import type { PhotoPlanShopping } from '../types.ts';

/**
 * Categories of the partner-store catalogue (`src/data/shopCatalog.ts`).
 * The photo analysis picks 2–4 of these; the client then shows several real products per category
 * in different price ranges. Hand-written: ids are referenced from the model prompt and the schema.
 */
export const SHOP_CATEGORIES = [
  { id: 'organizers', name: 'Органайзери та коробки', hint: 'сховати дрібниці: коробки, текстильні органайзери, контейнери' },
  { id: 'baskets', name: 'Кошики', hint: 'плетені чи тканинні кошики для пледів, іграшок, білизни' },
  { id: 'shelves', name: 'Полиці', hint: 'настінні полиці, щоб звільнити поверхні' },
  { id: 'hooks', name: 'Гачки та вішалки', hint: 'настінні гачки, ключниці, вішалки для передпокою' },
  { id: 'shoe-storage', name: 'Зберігання взуття', hint: 'підставки та полиці для взуття' },
  { id: 'racks', name: 'Стелажі', hint: 'відкриті стелажі для зберігання' },
  { id: 'throws', name: 'Пледи', hint: 'плед на диван, крісло чи ліжко' },
  { id: 'bedspreads', name: 'Покривала', hint: 'покривало, що збирає ліжко в одну пляму кольору' },
  { id: 'pillows', name: 'Декоративні подушки', hint: 'подушки та наволочки однієї палітри' },
  { id: 'wall-art', name: 'Картини та постери', hint: 'одна велика картина чи панно замість дрібних' },
  { id: 'frames', name: 'Рамки для фото', hint: 'однакові рамки для галереї на стіні' },
  { id: 'mirrors', name: 'Дзеркала', hint: 'дзеркало, що додає світла й глибини' },
  { id: 'clocks', name: 'Годинники', hint: 'настінний чи настільний годинник як акцент' },
  { id: 'boxes', name: 'Скриньки', hint: 'скринька для прикрас і дрібниць на тумбі' },
  { id: 'table-lamps', name: 'Настільні лампи', hint: 'тепле світло на рівні очей' },
  { id: 'floor-lamps', name: 'Торшери', hint: 'торшер у кут біля дивана чи крісла' },
  { id: 'garlands', name: 'Гірлянди', hint: 'м’яке вечірнє світло без ремонту' },
  { id: 'candles', name: 'Свічки та аромат', hint: 'ароматичні свічки й дифузори' },
  { id: 'candle-holders', name: 'Свічники', hint: 'свічники та аромалампи' },
  { id: 'vases', name: 'Вази', hint: 'ваза для гілок чи сухоцвітів' },
  { id: 'plants', name: 'Декоративні рослини', hint: 'штучні рослини та стабілізований мох' },
  { id: 'trays', name: 'Таці', hint: 'таця, що збирає дрібниці на столику в одну групу' },
  { id: 'kitchen-jars', name: 'Банки для кухні', hint: 'однакові банки для круп і спецій' },
  { id: 'rails', name: 'Рейлінги для кухні', hint: 'рейлінг, щоб звільнити стільницю' },
] as const;

export type ShopCategoryId = (typeof SHOP_CATEGORIES)[number]['id'];

export const SHOP_CATEGORY_IDS = SHOP_CATEGORIES.map((c) => c.id) as [ShopCategoryId, ...ShopCategoryId[]];

export function isShopCategoryId(value: string): value is ShopCategoryId {
  return (SHOP_CATEGORY_IDS as readonly string[]).includes(value);
}

export function shopCategoryName(id: ShopCategoryId): string {
  return SHOP_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

/** What usually helps a zone when the model does not name categories itself. */
export const ZONE_SHOP_DEFAULTS: Record<string, ShopCategoryId[]> = {
  sofa: ['throws', 'pillows', 'table-lamps', 'wall-art'],
  coffee: ['trays', 'kitchen-jars', 'shelves', 'candles'],
  bedroom: ['bedspreads', 'pillows', 'table-lamps', 'baskets'],
  bathroom: ['baskets', 'organizers', 'candles', 'mirrors'],
  kitchen: ['kitchen-jars', 'rails', 'organizers', 'trays'],
  hallway: ['hooks', 'shoe-storage', 'mirrors', 'baskets'],
  workspace: ['organizers', 'table-lamps', 'shelves', 'wall-art'],
  balcony: ['throws', 'garlands', 'plants', 'pillows'],
};

export const DEFAULT_SHOP_CATEGORIES: ShopCategoryId[] = ['organizers', 'throws', 'wall-art', 'candles'];

/** Default shopping block for a zone (used when the model returns none and for analyses saved before this feature). */
export function defaultShoppingFor(zoneId: string | null): PhotoPlanShopping[] {
  const ids = (zoneId && ZONE_SHOP_DEFAULTS[zoneId]) || DEFAULT_SHOP_CATEGORIES;
  return ids.map((category) => ({ category, why: SHOP_CATEGORIES.find((c) => c.id === category)!.hint }));
}
