import { describe, expect, it } from 'vitest';
import { generateZoneSolution, isCoveredByOwned } from '../utils/solutionEngine.ts';
import { BUDGET_TIERS, ZONES } from '../data/homeestetData.ts';
import { PRODUCTS_CATALOG, getProduct } from '../data/products.ts';

const limitOf = (budgetId: string) => BUDGET_TIERS.find((b) => b.id === budgetId)!.limit;

describe('generateZoneSolution', () => {
  it('scenario 1: kitchen + warm minimalism + up to 1 000 ₴ never exceeds the budget', () => {
    const solution = generateZoneSolution({
      zoneId: 'kitchen',
      styleId: 'warm-minimalism',
      moodId: 'minimal',
      budgetId: 'under-1000',
      existingItems: ZONES.find((z) => z.id === 'kitchen')!.defaultExistingItems,
    });

    expect(solution.products.length).toBeGreaterThan(0);
    expect(solution.estimatedCost).toBeLessThanOrEqual(limitOf('under-1000'));
    for (const product of solution.products) {
      expect(product.price).toBeLessThanOrEqual(limitOf('under-1000'));
      expect(product.zones).toContain('kitchen');
    }
    expect(solution.isPartial).toBe(true);
  });

  it('scenario 2: living room + japandi + 3 000 ₴ recommends only japandi products', () => {
    const solution = generateZoneSolution({
      zoneId: 'sofa',
      styleId: 'japandi',
      moodId: 'cozy',
      budgetId: '1000-3000',
      existingItems: ['диван', 'журнальний столик', 'подушки'],
    });

    expect(solution.relaxedStyle).toBe(false);
    expect(solution.products.length).toBeGreaterThanOrEqual(3);
    expect(solution.estimatedCost).toBeLessThanOrEqual(limitOf('1000-3000'));
    for (const product of solution.products) {
      expect(product.styles).toContain('japandi');
      expect(product.zones).toContain('sofa');
    }
  });

  it('scenario 3: bedroom with existing cushions does not recommend cushions', () => {
    const solution = generateZoneSolution({
      zoneId: 'bedroom',
      styleId: 'warm-minimalism',
      moodId: 'calm',
      budgetId: '3000-5000',
      existingItems: ['ліжко', 'декоративні подушки'],
    });

    const names = solution.products.map((p) => p.name.toLowerCase());
    expect(names.some((n) => n.includes('подушк') || n.includes('наволочк'))).toBe(false);
    expect(solution.skippedOwned.map((p) => p.id)).toEqual(
      expect.arrayContaining(['prod-jute-cushion', 'prod-linen-cushions'])
    );
  });

  it('scenario 4: kitchen defaults do not contain sofa items', () => {
    const kitchen = ZONES.find((z) => z.id === 'kitchen')!;
    expect(kitchen.defaultExistingItems).not.toContain('диван');
    expect(kitchen.defaultExistingItems).not.toContain('подушки');
    for (const item of kitchen.defaultExistingItems) {
      expect(kitchen.commonExistingItems).toContain(item);
    }
    for (const zone of ZONES) {
      expect(zone.defaultExistingItems.length).toBeGreaterThan(0);
      for (const item of zone.defaultExistingItems) {
        expect(zone.commonExistingItems).toContain(item);
      }
    }
  });

  it('scenario 5: when the user already owns everything, the solution is honestly empty', () => {
    const solution = generateZoneSolution({
      zoneId: 'balcony',
      styleId: 'cozy',
      moodId: 'cozy',
      budgetId: '1000-3000',
      existingItems: ['плед', 'кашпо з рослинами', 'подушки', 'кошик'],
    });

    expect(solution.products).toHaveLength(0);
    expect(solution.estimatedCost).toBe(0);
    expect(solution.skippedOwned.length).toBeGreaterThan(0);
    expect(solution.freeTips.length).toBeGreaterThan(0);
  });

  it('never recommends a product the user already owns, for every zone and budget', () => {
    for (const zone of ZONES) {
      for (const budget of BUDGET_TIERS) {
        const solution = generateZoneSolution({
          zoneId: zone.id,
          styleId: 'warm-minimalism',
          moodId: 'calm',
          budgetId: budget.id,
          existingItems: zone.commonExistingItems,
        });
        expect(solution.estimatedCost).toBeLessThanOrEqual(budget.limit);
        for (const product of solution.products) {
          expect(isCoveredByOwned(product, zone.commonExistingItems)).toBe(false);
        }
      }
    }
  });

  it('is deterministic: the same params give the same id and products', () => {
    const params = { zoneId: 'coffee', styleId: 'natural', moodId: 'warm', budgetId: '1000-3000', existingItems: ['чашки'] };
    const a = generateZoneSolution(params);
    const b = generateZoneSolution({ ...params, existingItems: ['Чашки '] });
    expect(a.id).toBe(b.id);
    expect(a.products.map((p) => p.id)).toEqual(b.products.map((p) => p.id));
  });

  it('style is not relaxed when enough products match, and reported when it is', () => {
    const strict = generateZoneSolution({ zoneId: 'sofa', styleId: 'cozy', moodId: 'cozy', budgetId: '3000-5000', existingItems: [] });
    expect(strict.relaxedStyle).toBe(false);
    expect(strict.products.every((p) => p.styles.includes('cozy'))).toBe(true);

    const relaxed = generateZoneSolution({ zoneId: 'bathroom', styleId: 'classic', moodId: 'calm', budgetId: '3000-5000', existingItems: [] });
    expect(relaxed.relaxedStyle).toBe(true);
  });
});

describe('product catalogue integrity', () => {
  it('every product references known zones and has matching keywords', () => {
    const zoneIds = new Set(ZONES.map((z) => z.id));
    for (const product of PRODUCTS_CATALOG) {
      expect(product.zones.length).toBeGreaterThan(0);
      for (const zone of product.zones) expect(zoneIds.has(zone)).toBe(true);
      expect(product.styles.length).toBeGreaterThan(0);
      expect(product.moods.length).toBeGreaterThan(0);
      expect(product.coversItems.length).toBeGreaterThan(0);
      expect(product.affiliateUrl === undefined || product.affiliateUrl.startsWith('http')).toBe(true);
    }
    expect(getProduct('prod-waffle-throw').price).toBe(650);
  });
});
