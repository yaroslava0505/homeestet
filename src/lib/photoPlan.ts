import { z } from 'zod';
import type { AnalyzeParams, PhotoPlan, PhotoPlanShopping } from '../types.ts';
import { BUDGET_TIERS, STYLES, ZONES } from '../data/homeestetData.ts';
import { SHOP_CATEGORIES, SHOP_CATEGORY_IDS, ZONE_SHOP_DEFAULTS, defaultShoppingFor, isShopCategoryId } from '../data/shopCategories.ts';
import { DATA_RU } from '../i18n/dataRu.ts';

/**
 * Shared between the Cloudflare Pages Function (functions/api/analyze.ts) and the unit tests:
 * the prompt the model receives, the schema its answer must follow, and the normalisation that
 * turns a model answer into the PhotoPlan the client renders.
 *
 * Nothing in here touches the DOM, so it is safe in the Workers runtime.
 */

/** Store categories the model may suggest; the client shows several real products for each. */
export const MAX_SHOPPING_CATEGORIES = 4;
/** Open models often name a single category; the block is topped up with zone defaults to this many. */
export const MIN_SHOPPING_CATEGORIES = 3;

/** Cheapest model that handles a photo plus structured JSON well; switch via ANALYSIS_MODEL. */
export const DEFAULT_ANALYSIS_MODEL = 'claude-haiku-4-5';

export type ModelFamily = 'haiku' | 'sonnet' | 'opus';

export interface ModelRequestOptions {
  family: ModelFamily;
  /** Output cap: the plan JSON is ~1 000 tokens, thinking (where enabled) needs headroom. */
  maxTokens: number;
  /** `output_config.effort` is accepted on Sonnet 5 and Opus-tier models, rejected by Haiku 4.5. */
  effort?: 'low';
  /** Server-side refusal fallbacks exist on Opus 5 / Fable; other models do without. */
  fallbacks: boolean;
}

/** Request shape per model family, so a cheaper or stronger model is a config change, not a code change. */
export function modelRequestOptions(model: string): ModelRequestOptions {
  const id = model.toLowerCase();
  if (id.includes('opus') || id.includes('fable') || id.includes('mythos')) {
    return { family: 'opus', maxTokens: 6000, effort: 'low', fallbacks: true };
  }
  if (id.includes('sonnet')) {
    return { family: 'sonnet', maxTokens: 6000, effort: 'low', fallbacks: false };
  }
  return { family: 'haiku', maxTokens: 4000, fallbacks: false };
}

const ZONE_IDS = ZONES.map((z) => z.id) as [string, ...string[]];
const STYLE_IDS = STYLES.map((s) => s.id) as [string, ...string[]];

/** Exact shape the model has to produce (structured output). Keep it flat and strict. */
export const ModelPlanSchema = z.object({
  is_interior: z.boolean(),
  zone_id: z.enum([...ZONE_IDS, 'other']),
  zone_label: z.string(),
  current_style: z.string(),
  suggested_style_id: z.enum(STYLE_IDS),
  palette: z.array(z.string()).max(5),
  materials: z.array(z.string()).max(5),
  noise_level: z.number().int().min(0).max(100),
  noise_comment: z.string(),
  problems: z.array(z.string()).max(5),
  remove: z.array(z.string()).max(5),
  rearrange: z.array(z.string()).max(5),
  use_owned: z.array(z.string()).max(5),
  steps: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        impact: z.string(),
      })
    )
    .min(3)
    .max(5),
  shopping: z
    .array(
      z.object({
        category: z.enum(SHOP_CATEGORY_IDS),
        why: z.string(),
      })
    )
    .max(MAX_SHOPPING_CATEGORIES),
  budget_min: z.number().int().min(0),
  budget_max: z.number().int().min(0),
  summary: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type ModelPlan = z.infer<typeof ModelPlanSchema>;

/** JSON Schema for providers that take a plain schema (Cloudflare Workers AI JSON mode). */
export function modelPlanJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(ModelPlanSchema) as Record<string, unknown>;
}

/**
 * Pulls the first JSON object out of a model reply that may be wrapped in prose or code fences.
 * Returns null when nothing parseable is found; the caller decides whether to retry.
 */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const direct = tryParse(trimmed);
  if (direct !== undefined) return direct;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const inner = tryParse(fenced[1].trim());
    if (inner !== undefined) return inner;
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const slice = tryParse(trimmed.slice(start, end + 1));
    if (slice !== undefined) return slice;
  }
  return null;
}

function tryParse(text: string): unknown {
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === 'object' ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Default Cloudflare Workers AI model: multimodal, free daily allocation, no card required. */
export const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

/**
 * Extra, very explicit field-by-field rules for open models (Workers AI). Claude follows the main prompt
 * on its own; smaller models need the format spelled out and an example of what "concrete" means.
 */
/** Language of the plan text. Ids and the schema never change; only the prose does. */
export type PlanLocale = 'uk' | 'ru';

/** Data names (zones, styles, categories) in the prompt language. */
function dataText(text: string, locale: PlanLocale): string {
  return locale === 'ru' ? (DATA_RU[text] ?? text) : text;
}

/**
 * Field-by-field guide for open models (Workers AI), which otherwise return vague or empty fields.
 * Written in the answer language: a Ukrainian prompt pulls the model back into Ukrainian.
 */
export function buildOpenModelGuide(locale: PlanLocale = 'uk'): string {
  if (locale === 'ru') {
    return [
      'ФОРМАТ ОТВЕТА (обязательно для каждого поля):',
      '- zone_label: название комнаты или угла по-русски, 2–5 слов, например «Диванная зона в гостиной».',
      '- current_style: 2–5 слов по-русски о том, как выглядит пространство сейчас, например «Современный со случайным декором». Не пиши id стиля.',
      '- suggested_style_id: только один id из списка стилей.',
      '- palette: 3–5 цветов #RRGGBB, которые видны на фото.',
      '- materials: 2–5 названий материалов словами (дерево, лён, металл, керамика). Не цвета.',
      '- noise_level: число 0–100. noise_comment: одно предложение о том, что именно создаёт шум, обязательно не пустое.',
      '- problems: 3–5 конкретных вещей с фото, каждая с названием предмета и местом («три пульта на журнальном столике»).',
      '- remove: 2–4 пункта, что убрать с глаз. rearrange: 2–4 пункта, что переставить и куда. use_owned: 2–4 пункта, как использовать то, что уже есть на фото.',
      '- steps: ровно 5 шагов. title: действие с конкретным предметом, 4–8 слов. description: 1–2 предложения, что именно сделать и где. impact: что изменится. Первые шаги бесплатные, покупки в конце.',
      '- shopping: 2–4 объекта {category, why}. category только из перечня категорий магазинов (например "organizers", "table-lamps", "wall-art") и только из тех, что подходят зоне с фото. why: одно предложение по-русски о том, что изменится именно здесь.',
      '- summary: 2 предложения, первое о главном впечатлении, второе о самом важном шаге.',
      '',
      'ПРИМЕР УРОВНЯ КОНКРЕТНОСТИ:',
      'Плохо: title «Добавить освещение», description «Добавить дополнительное освещение».',
      'Хорошо: title «Поставь лампу на тумбу слева от дивана», description «Вечером выключи люстру и оставь лампу на уровне глаз, чтобы свет падал на зону чтения, а не на потолок.»',
    ].join('\n');
  }
  return [
    'ФОРМАТ ВІДПОВІДІ (обов’язково для кожного поля):',
    '- zone_label: назва кімнати або кута українською, 2–5 слів, наприклад «Диванна зона у вітальні».',
    '- current_style: 2–5 слів українською про те, як виглядає простір зараз, наприклад «Сучасний із випадковим декором». Не пиши id стилю.',
    '- suggested_style_id: лише один id зі списку стилів.',
    '- palette: 3–5 кольорів #RRGGBB, які видно на фото.',
    '- materials: 2–5 назв матеріалів словами (дерево, льон, метал, кераміка). Не кольори.',
    '- noise_level: число 0–100. noise_comment: одне речення про те, що саме створює шум, обов’язково не порожнє.',
    '- problems: 3–5 конкретних речей з фото, кожна з назвою предмета і місцем («три пульти на журнальному столику»).',
    '- remove: 2–4 пункти, що прибрати з виду. rearrange: 2–4 пункти, що переставити і куди. use_owned: 2–4 пункти, як використати те, що вже є на фото.',
    '- steps: рівно 5 кроків. title: дія з конкретним предметом, 4–8 слів. description: 1–2 речення, що саме зробити і де. impact: що зміниться. Перші кроки безкоштовні, покупки в кінці.',
    '- shopping: 2–4 об’єкти {category, why}. category лише з переліку категорій магазинів (наприклад "organizers", "table-lamps", "wall-art") і лише з тих, що пасують зоні з фото. why: одне речення українською про те, що зміниться саме тут.',
    '- summary: 2 речення, перше про головне враження, друге про найважливіший крок.',
    '',
    'ПРИКЛАД РІВНЯ КОНКРЕТНОСТІ:',
    'Погано: title «Додати освітлення», description «Додати додаткове освітлення».',
    'Добре: title «Постав лампу на тумбу ліворуч від дивана», description «Увечері вимкни люстру і залиш лампу на рівні очей, щоб світло падало на зону читання, а не на стелю.»',
  ].join('\n');
}

export function budgetLimitFor(budgetId: string): number {
  return (BUDGET_TIERS.find((b) => b.id === budgetId) ?? BUDGET_TIERS[1]).limit;
}

/** Stable system prompt per language (identical for every request in that language, so it can be cached). */
export function buildSystemPrompt(locale: PlanLocale = 'uk'): string {
  const zones = ZONES.map((z) => `${z.id} = ${dataText(z.name, locale)} (${dataText(z.description, locale)})`).join('; ');
  const styles = STYLES.map((s) => `${s.id} = ${s.name} (${dataText(s.uaName, locale)})`).join('; ');
  const shopCategories = SHOP_CATEGORIES.map((c) => `${c.id} = ${dataText(c.name, locale)}: ${dataText(c.hint, locale)}`).join('; ');
  const zoneShopping = Object.entries(ZONE_SHOP_DEFAULTS)
    .map(([zoneId, ids]) => `${zoneId}: ${ids.join(', ')}`)
    .join('; ');

  if (locale === 'ru') {
    return [
      'Ты стилист интерьера сервиса HomeEstet. Пользователь присылает фото угла или комнаты своего дома, а ты составляешь честный, конкретный и доброжелательный план изменений, который опирается на то, что реально видно на фото.',
      '',
      'Принципы HomeEstet:',
      '1. Сначала используй то, что уже есть. Большинство шагов должны быть о том, что убрать, переставить, сгруппировать, а не купить.',
      '2. Покупай только то, что действительно изменит пространство: две-четыре категории вещей, часто хватает одной-двух.',
      '3. Все покупки вместе должны укладываться в бюджет пользователя. Никогда не превышай лимит.',
      '4. Никакого ремонта. Если жильё съёмное: без сверления, покраски и замены мебели владельца.',
      '',
      'Правила ответа:',
      '- Пиши по-русски, обращайся на «ты», тепло и без снисходительности. Все текстовые поля (zone_label, current_style, noise_comment, problems, remove, rearrange, use_owned, steps, shopping.why, summary) только по-русски. Идентификаторы (zone_id, suggested_style_id, shopping.category) остаются как в схеме.',
      '- Ссылайся на конкретные предметы с фото («плед на спинке дивана», «коробки на верхней полке»). Не выдумывай вещей, которых не видно.',
      '- problems: 2–5 вещей, которые больше всего мешают пространству выглядеть спокойно. remove, rearrange, use_owned: по 1–5 коротких пунктов.',
      '- steps: ровно 5 шагов в порядке выполнения, от бесплатных к покупкам. title до 8 слов, description 1–2 предложения, impact: что изменится.',
      '- noise_level: 0 означает идеально спокойное пространство, 100 означает сплошной визуальный хаос.',
      '- palette: 3–5 цветов в формате #RRGGBB, которые действительно есть на фото.',
      '- shopping: 2–4 категории вещей из перечня ниже, которые действительно помогут именно этому углу. Выбирай под зону и под то, чего на фото не хватает: для рабочего стола это органайзеры, настольная лампа, полка или постер, а не плед; для кухни банки, рейлинг, поднос; для прихожей крючки, зеркало, корзина. Ниже есть типичные категории для каждой зоны, отходи от них только когда на фото видна другая потребность. Пользователь увидит несколько реальных товаров разной цены для каждой категории, поэтому выбирай категорию, а не конкретную вещь. why: одно предложение о том, что изменится именно здесь. Не предлагай категорию, если такой вещи на фото уже достаточно.',
      '- budget_min и budget_max: реалистичная вилка в гривнах для воплощения всего плана (0, если покупать ничего не нужно).',
      '- summary: 2 предложения о главном впечатлении и главном шаге.',
      '- Если на фото не интерьер или комнаты не видно: is_interior = false, zone_id = "other", в summary коротко объясни, что нужно сфотографировать, остальные поля заполни пустыми списками или нейтральными значениями.',
      '',
      `Зоны (zone_id): ${zones}.`,
      `Стили (suggested_style_id): ${styles}.`,
      `Категории магазинов (shopping.category): ${shopCategories}.`,
      `Типичные категории для зон: ${zoneShopping}.`,
    ].join('\n');
  }

  return [
    'Ти стиліст інтер’єру сервісу HomeEstet. Користувач надсилає фото кута або кімнати свого дому, а ти складаєш чесний, конкретний і доброзичливий план змін, який спирається на те, що реально видно на фото.',
    '',
    'Принципи HomeEstet:',
    '1. Спочатку використай те, що вже є. Більшість кроків мають бути про прибрати, переставити, згрупувати, а не купити.',
    '2. Купуй лише те, що справді змінить простір: дві-чотири категорії речей, часто вистачає однієї-двох.',
    '3. Усі покупки разом мають вкладатися в бюджет користувача. Ніколи не перевищуй ліміт.',
    '4. Жодного ремонту. Якщо це орендоване житло: без свердління, фарбування і заміни меблів власника.',
    '',
    'Правила відповіді:',
    '- Пиши українською, звертайся на «ти», тепло і без зверхності.',
    '- Посилайся на конкретні предмети з фото («плед на спинці дивана», «коробки на верхній полиці»). Не вигадуй речей, яких не видно.',
    '- problems: 2–5 речей, які найбільше заважають простору виглядати спокійно. remove, rearrange, use_owned: по 1–5 коротких пунктів.',
    '- steps: рівно 5 кроків у порядку виконання, від безкоштовних до покупок. title до 8 слів, description 1–2 речення, impact: що зміниться.',
    '- noise_level: 0 означає ідеально спокійний простір, 100 означає суцільний візуальний хаос.',
    '- palette: 3–5 кольорів у форматі #RRGGBB, які справді є на фото.',
    '- shopping: 2–4 категорії речей з переліку нижче, які справді допоможуть саме цьому куту. Обирай під зону і під те, чого на фото бракує: для робочого столу це органайзери, настільна лампа, полиця чи постер, а не плед; для кухні банки, рейлінг, таця; для передпокою гачки, дзеркало, кошик. Нижче є типові категорії для кожної зони, відходь від них лише коли на фото видно іншу потребу. Користувач побачить кілька реальних товарів різної ціни для кожної категорії, тож обирай категорію, а не конкретну річ. why: одне речення про те, що зміниться саме тут. Не пропонуй категорію, якщо такої речі на фото вже достатньо.',
    '- budget_min і budget_max: реалістична вилка в гривнях для втілення всього плану (0, якщо купувати нічого не треба).',
    '- summary: 2 речення про головне враження і головний крок.',
    '- Якщо на фото не інтер’єр або кімнати не видно: is_interior = false, zone_id = "other", у summary коротко поясни, що потрібно сфотографувати, решту полів заповни порожніми списками або нейтральними значеннями.',
    '',
    `Зони (zone_id): ${zones}.`,
    `Стилі (suggested_style_id): ${styles}.`,
    `Категорії магазинів (shopping.category): ${shopCategories}.`,
    `Типові категорії для зон: ${zoneShopping}.`,
  ].join('\n');
}

/** Per-request text that accompanies the image. */
export function buildUserPrompt(params: AnalyzeParams): string {
  const tier = BUDGET_TIERS.find((b) => b.id === params.budgetId) ?? BUDGET_TIERS[1];
  const note = (params.note ?? '').trim().slice(0, 300);
  if (params.locale === 'ru') {
    const lines = [
      `Бюджет пользователя: ${tier.label}, лимит ${tier.limit} ₴.`,
      params.rental
        ? 'Жильё съёмное: без сверления, покраски и замены мебели владельца.'
        : 'Жильё собственное, небольшие изменения без ремонта допустимы.',
    ];
    if (note) lines.push(`Комментарий пользователя: «${note}».`);
    lines.push('Проанализируй фото и составь план по схеме. Весь текст ответа по-русски.');
    return lines.join('\n');
  }
  const lines = [
    `Бюджет користувача: ${tier.label}, ліміт ${tier.limit} ₴.`,
    params.rental
      ? 'Житло орендоване: без свердління, фарбування та заміни меблів власника.'
      : 'Житло власне, невеликі зміни без ремонту допустимі.',
  ];
  if (note) lines.push(`Коментар користувача: «${note}».`);
  lines.push('Проаналізуй фото і склади план за схемою.');
  return lines.join('\n');
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Turns the model answer into the plan the client shows.
 * Drops unknown products and anything that would push the total over the budget, keeps the order
 * the model chose, and clamps list lengths so the UI never gets surprises.
 */
export function normalizePlan(raw: ModelPlan, params: AnalyzeParams): PhotoPlan {
  const budgetLimit = budgetLimitFor(params.budgetId);

  const clean = (list: string[], max: number) =>
    list.map((s) => s.trim()).filter(Boolean).slice(0, max);

  const zoneId = raw.zone_id !== 'other' && ZONES.some((z) => z.id === raw.zone_id) ? raw.zone_id : null;
  const zoneLabel = raw.zone_label.trim() || (zoneId ? ZONES.find((z) => z.id === zoneId)!.name : 'Простір');
  const suggestedStyleId = STYLES.some((s) => s.id === raw.suggested_style_id) ? raw.suggested_style_id : STYLES[0].id;

  const budgetMin = Math.max(0, Math.min(raw.budget_min, raw.budget_max));
  const budgetMax = Math.max(raw.budget_min, raw.budget_max);

  const shopping: PhotoPlanShopping[] = [];
  for (const entry of raw.shopping) {
    if (!isShopCategoryId(entry.category) || shopping.some((s) => s.category === entry.category)) continue;
    shopping.push({ category: entry.category, why: entry.why.trim() });
    if (shopping.length >= MAX_SHOPPING_CATEGORIES) break;
  }
  // Interiors always get a few categories: the model's own first, then what usually helps this zone.
  // When the zone is unknown, only room-neutral categories are added (never textiles for a desk).
  if (raw.is_interior) {
    for (const fallback of defaultShoppingFor(zoneId)) {
      if (shopping.length >= MIN_SHOPPING_CATEGORIES) break;
      if (!shopping.some((s) => s.category === fallback.category)) shopping.push(fallback);
    }
  }

  return {
    isInterior: raw.is_interior,
    zoneId,
    zoneLabel,
    currentStyle: raw.current_style.trim(),
    suggestedStyleId,
    palette: raw.palette.map((c) => c.trim()).filter((c) => HEX_RE.test(c)).slice(0, 5),
    // Open models sometimes echo colours here; materials are words, so drop anything hex-like.
    materials: clean(raw.materials, 5).filter((m) => !HEX_RE.test(m)),
    noiseLevel: Math.round(Math.min(100, Math.max(0, raw.noise_level))),
    noiseComment: raw.noise_comment.trim(),
    problems: clean(raw.problems, 5),
    remove: clean(raw.remove, 5),
    rearrange: clean(raw.rearrange, 5),
    useOwned: clean(raw.use_owned, 5),
    steps: raw.steps
      .map((s) => ({ title: s.title.trim(), description: s.description.trim(), impact: s.impact.trim() }))
      .filter((s) => s.title)
      .slice(0, 5),
    products: [],
    estimatedCost: 0,
    shopping,
    budgetLimit,
    budgetMin: Math.min(budgetMin, budgetLimit),
    budgetMax: Math.min(budgetMax, budgetLimit),
    summary: raw.summary.trim(),
    confidence: raw.confidence,
  };
}

/** Used by `ANALYSIS_MOCK=1` in local development and by tests; never served in production. */
export const MOCK_MODEL_PLAN: ModelPlan = {
  is_interior: true,
  zone_id: 'sofa',
  zone_label: 'Диванна зона у вітальні',
  current_style: 'Змішаний: сучасні меблі з випадковим декором',
  suggested_style_id: 'warm-minimalism',
  palette: ['#F2EDE4', '#C9B59A', '#6B6258', '#2F2A26'],
  materials: ['бавовна', 'світле дерево', 'метал'],
  noise_level: 58,
  noise_comment: 'Дрібні предмети на столику й полицях розсіюють увагу, око не має, де зупинитися.',
  problems: [
    'На журнальному столику шість дрібних предметів різних кольорів',
    'Дроти від торшера видно вздовж стіни',
    'Подушки різних розмірів і принтів сперечаються між собою',
    'Верхнє холодне світло робить кімнату пласкою',
  ],
  remove: ['Три сувеніри та пульти зі столика', 'Паперовий пакет біля дивана'],
  rearrange: ['Торшер ближче до кута дивана, дріт за ніжку', 'Книги зі столика стопкою на полицю'],
  use_owned: ['Плед зі спинки дивана розкласти на підлокітнику', 'Одну велику подушку залишити по центру'],
  steps: [
    { title: 'Звільни столик до трьох предметів', description: 'Залиш тацю, свічку і одну книгу. Решту сховай у шухляду або коробку під столиком.', impact: 'Кімната одразу виглядає спокійнішою' },
    { title: 'Сховай дроти', description: 'Проведи дріт торшера за ніжкою дивана і закріпи стяжкою до ніжки.', impact: 'Мінус головне джерело візуального шуму' },
    { title: 'Розклади текстиль шарами', description: 'Плед недбало на підлокітник, дві однакові подушки по краях, одна фактурна по центру.', impact: 'Диван стає центром затишку' },
    { title: 'Переведи світло у теплий спектр', description: 'Увечері вимикай люстру, вмикай торшер з лампою 2700K на рівні очей.', impact: 'Вечірній релакс замість офісного світла' },
    { title: 'Додай один природний акцент', description: 'Гілка або невелика рослина в простій вазі на столику завершить композицію.', impact: 'Жива точка, на якій відпочиває око' },
  ],
  shopping: [
    { category: 'trays', why: 'Одна таця збере пульти, свічку й чашку зі столика в одну групу.' },
    { category: 'table-lamps', why: 'Лампа на тумбі дасть тепле вечірнє світло замість плаского верхнього.' },
    { category: 'throws', why: 'Плед однієї з кольорів палітри пом’якшить диван і зв’яже подушки між собою.' },
  ],
  budget_min: 900,
  budget_max: 1400,
  summary: 'Простір уже має хорошу основу: світлі стіни і зручний диван. Головний крок сьогодні: звільнити столик і сховати дроти, це дасть 70 % ефекту без витрат.',
  confidence: 'high',
};
