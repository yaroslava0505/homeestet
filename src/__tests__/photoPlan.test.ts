import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ANALYSIS_MODEL,
  MOCK_MODEL_PLAN,
  ModelPlanSchema,
  buildSystemPrompt,
  buildUserPrompt,
  extractJsonObject,
  modelPlanJsonSchema,
  modelRequestOptions,
  normalizePlan,
} from '../lib/photoPlan.ts';
import { DEFAULT_SHOP_CATEGORIES, SHOP_CATEGORIES, ZONE_SHOP_DEFAULTS } from '../data/shopCategories.ts';
import { ZONES } from '../data/homeestetData.ts';


describe('photo plan schema and prompt', () => {
  it('the mock plan satisfies the schema the model must follow', () => {
    expect(() => ModelPlanSchema.parse(MOCK_MODEL_PLAN)).not.toThrow();
  });

  it('system prompt lists every zone, style and store category, plus the typical categories per zone', () => {
    const prompt = buildSystemPrompt();
    for (const z of ZONES) expect(prompt).toContain(`${z.id} = ${z.name}`);
    for (const c of SHOP_CATEGORIES) expect(prompt).toContain(`${c.id} = ${c.name}`);
    for (const [zoneId, ids] of Object.entries(ZONE_SHOP_DEFAULTS)) expect(prompt).toContain(`${zoneId}: ${ids.join(', ')}`);
    expect(prompt).toContain('warm-minimalism');
    expect(prompt).not.toMatch(/prod-[a-z-]+/); // the illustrative catalogue is no longer sent to the model
  });

  it('request options follow the model family (effort and fallbacks only where supported)', () => {
    expect(modelRequestOptions(DEFAULT_ANALYSIS_MODEL)).toEqual({ family: 'haiku', maxTokens: 4000, fallbacks: false });
    expect(modelRequestOptions('claude-sonnet-5')).toMatchObject({ family: 'sonnet', effort: 'low', fallbacks: false });
    expect(modelRequestOptions('claude-opus-5')).toMatchObject({ family: 'opus', effort: 'low', fallbacks: true });
    expect(modelRequestOptions('claude-haiku-4-5').effort).toBeUndefined();
  });

  it('JSON schema for open models lists every required field', () => {
    const schema = modelPlanJsonSchema() as { type: string; required?: string[]; properties: Record<string, unknown> };
    expect(schema.type).toBe('object');
    for (const key of ['is_interior', 'zone_id', 'steps', 'shopping', 'summary', 'confidence']) {
      expect(schema.properties).not.toHaveProperty('products');
      expect(schema.properties).toHaveProperty(key);
      expect(schema.required).toContain(key);
    }
  });

  it('extracts a JSON object from prose, code fences or bare text', () => {
    const plain = JSON.stringify(MOCK_MODEL_PLAN);
    expect(extractJsonObject(plain)).toEqual(MOCK_MODEL_PLAN);
    expect(extractJsonObject('Ось план:\n```json\n' + plain + '\n```\nГотово.')).toEqual(MOCK_MODEL_PLAN);
    expect(extractJsonObject('Відповідь: ' + plain + ' кінець')).toEqual(MOCK_MODEL_PLAN);
    expect(extractJsonObject('жодного json тут немає')).toBeNull();
    expect(extractJsonObject('{"broken": ')).toBeNull();
  });

  it('user prompt carries budget, rental flag and a trimmed note', () => {
    const text = buildUserPrompt({ budgetId: 'under-1000', rental: true, note: '  Не люблю жовтий  ' });
    expect(text).toContain('1000 ₴');
    expect(text).toContain('орендоване');
    expect(text).toContain('«Не люблю жовтий»');
    expect(buildUserPrompt({ budgetId: '3000-5000', rental: false })).not.toContain('Коментар');
  });
});

describe('normalizePlan', () => {
  it('maps "other" zones to null and unknown styles to the default', () => {
    const plan = normalizePlan(
      { ...MOCK_MODEL_PLAN, zone_id: 'other', zone_label: '', suggested_style_id: 'japandi' },
      { budgetId: '1000-3000', rental: true }
    );
    expect(plan.zoneId).toBeNull();
    expect(plan.zoneLabel).toBe('Простір');
    expect(plan.suggestedStyleId).toBe('japandi');
  });

  it('cleans palette, clamps noise and orders the budget range', () => {
    const plan = normalizePlan(
      { ...MOCK_MODEL_PLAN, palette: ['#ABCDEF', 'beige', ' #123456 '], noise_level: 140, budget_min: 900, budget_max: 300 },
      { budgetId: 'under-1000', rental: false }
    );
    expect(plan.palette).toEqual(['#ABCDEF', '#123456']);
    expect(plan.noiseLevel).toBe(100);
    expect(plan.budgetMin).toBe(300);
    expect(plan.budgetMax).toBe(900);
  });

  it('keeps known shopping categories in order, drops unknown and duplicate ones, caps at 4', () => {
    const plan = normalizePlan(
      {
        ...MOCK_MODEL_PLAN,
        shopping: [
          { category: 'throws', why: ' плед ' },
          { category: 'unicorns' as never, why: 'вигадка' },
          { category: 'throws', why: 'дубль' },
          { category: 'vases', why: 'ваза' },
          { category: 'mirrors', why: 'дзеркало' },
          { category: 'candles', why: 'свічки' },
          { category: 'trays', why: 'зайва п’ята' },
        ],
      },
      { budgetId: '1000-3000', rental: false }
    );
    expect(plan.shopping!.map((s) => s.category)).toEqual(['throws', 'vases', 'mirrors', 'candles']);
    expect(plan.shopping![0].why).toBe('плед');
  });

  it('fills the shopping block with zone defaults when the model names nothing', () => {
    const plan = normalizePlan({ ...MOCK_MODEL_PLAN, zone_id: 'kitchen', shopping: [] }, { budgetId: 'under-1000', rental: false });
    expect(plan.shopping!.map((s) => s.category)).toEqual(ZONE_SHOP_DEFAULTS.kitchen.slice(0, 3));
    for (const s of plan.shopping!) expect(s.why.length).toBeGreaterThan(5);
  });

  it('tops up a short model list with zone defaults, keeping the model choice first and without duplicates', () => {
    const plan = normalizePlan(
      { ...MOCK_MODEL_PLAN, zone_id: 'sofa', shopping: [{ category: 'pillows', why: 'подушки' }] },
      { budgetId: 'under-1000', rental: false }
    );
    // sofa defaults: throws, pillows, table-lamps, wall-art → pillows already there, so throws + table-lamps follow
    expect(plan.shopping!.map((s) => s.category)).toEqual(['pillows', 'throws', 'table-lamps']);
    expect(plan.shopping![0].why).toBe('подушки');
  });

  it('never adds textiles when the zone is unknown: only room-neutral categories top up the list', () => {
    const plan = normalizePlan(
      { ...MOCK_MODEL_PLAN, zone_id: 'other', shopping: [{ category: 'table-lamps', why: 'лампа' }] },
      { budgetId: '1000-3000', rental: false }
    );
    const ids = plan.shopping!.map((s) => s.category);
    expect(ids[0]).toBe('table-lamps');
    expect(ids).toHaveLength(3);
    for (const id of ids.slice(1)) expect(DEFAULT_SHOP_CATEGORIES).toContain(id);
    expect(ids).not.toContain('throws');
    expect(ids).not.toContain('pillows');
  });

  it('non-interior photos come through with an empty shopping list', () => {
    const plan = normalizePlan(
      { ...MOCK_MODEL_PLAN, is_interior: false, shopping: [], steps: [] },
      { budgetId: '1000-3000', rental: false }
    );
    expect(plan.isInterior).toBe(false);
    expect(plan.shopping).toEqual([]);
  });
});
