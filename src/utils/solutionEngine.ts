import type { ProductItem, SolutionParams, SolutionStep, ZoneSolution } from '../types.ts';
import { t } from '../i18n/index.ts';
import { BUDGET_TIERS, MOODS, STYLES, ZONES } from '../data/homeestetData.ts';
import { PRODUCTS_CATALOG } from '../data/products.ts';
import { hashString } from './format.ts';

/** Max products in one solution. */
export const MAX_PRODUCTS = 4;
/** A "full" makeover needs at least this many products; fewer → the solution is marked partial. */
export const FULL_SOLUTION_MIN = 3;
/** Relax the style filter when fewer than this many products match the style. */
const MIN_STYLE_MATCHES = 2;

const normalize = (value: string) => value.trim().toLowerCase();

/** True when the user already owns something this product would duplicate. */
export function isCoveredByOwned(product: ProductItem, ownedItems: string[]): boolean {
  const owned = ownedItems.map(normalize).filter(Boolean);
  return owned.some((item) => product.coversItems.some((keyword) => item.includes(normalize(keyword))));
}

interface RankedProduct {
  product: ProductItem;
  score: number;
}

function rankProducts(products: ProductItem[], styleId: string, moodId: string): RankedProduct[] {
  return products
    .map((product) => ({
      product,
      score:
        (product.styles.includes(styleId) ? 3 : 0) +
        (product.moods.includes(moodId) ? 2 : 0) +
        (4 - product.priority) * 0.5,
    }))
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price || a.product.id.localeCompare(b.product.id));
}

const MOOD_STEP: Record<string, { title: string; description: string; impact: string }> = {
  calm: {
    title: t('Залиш одну спокійну палітру'),
    description: t('Прибери з поля зору яскраві кольорові плями (упаковки, строкатий текстиль). Три відтінки одного тону заспокоюють око.'),
    impact: t('Простір читається як єдине ціле'),
  },
  natural: {
    title: t('Додай природні матеріали'),
    description: t('Дерево, льон, глина або ротанг: одна-дві натуральні фактури на рівні очей роблять зону живою.'),
    impact: t('Відчуття свіжості та зв’язку з природою'),
  },
  cozy: {
    title: t('Створи шари текстилю'),
    description: t('Плед на підлокітнику, дві подушки різної фактури й м’яке світло поруч: затишок складається з шарів.'),
    impact: t('Хочеться залишитися в цій зоні довше'),
  },
  minimal: {
    title: t('Прибери все, що не використовуєш щотижня'),
    description: t('Звільни поверхні до двох-трьох предметів. Порожнє місце в мінімалізмі є частиною композиції.'),
    impact: t('Легкість і повітря'),
  },
  modern: {
    title: t('Додай один чіткий контраст'),
    description: t('Темний акцент (рама, лампа, ваза) на світлому фоні структурує простір без зайвих деталей.'),
    impact: t('Динаміка та зібраність'),
  },
  light: {
    title: t('Відкрий максимум денного світла'),
    description: t('Звільни підвіконня, обери світлий текстиль і дзеркало навпроти вікна: кімната стане просторішою.'),
    impact: t('Більше світла та об’єму'),
  },
  warm: {
    title: t('Переведи світло у теплий спектр'),
    description: t('Лампи 2700K, свічка та бурштинові відтінки текстилю створюють вечірню атмосферу без ремонту.'),
    impact: t('Вечірній релакс і камерність'),
  },
};

function buildSteps(params: SolutionParams, styleMaterials: string[], moodId: string): SolutionStep[] {
  const owned = params.existingItems.map(normalize);
  const has = (...keywords: string[]) => owned.some((item) => keywords.some((k) => item.includes(k)));
  const hasLamp = has(t('лампа'), t('торшер'), t('світильник'));
  const hasTextile = has(t('плед'), t('подушк'), t('покривало'));
  const hasPlant = has(t('рослин'), t('кашпо'), t('квіт'));
  const moodStep = MOOD_STEP[moodId] ?? MOOD_STEP.calm;

  return [
    {
      number: '01',
      title: hasTextile ? t('Оптимізуй наявний текстиль') : t('Додай тактильну текстуру'),
      description: hasTextile
        ? t('Скомбінуй наявні подушки з одним фактурним акцентом або поверни їх більш фактурною стороною назовні.')
        : t('Використай текстиль із натуральних волокон ({materials}), щоб пом’якшити геометрію простору.', { materials: styleMaterials[1] ?? t('льон, бавовна') }),
      impact: t('Миттєве відчуття м’якості та глибини'),
    },
    {
      number: '02',
      title: t('Зменш візуальний шум на 30–40 %'),
      description: t('Прибери з відкритих поверхонь фабричні упаковки, зайві сувеніри та дрібні дроти. Згрупуй потрібні дрібниці на одній таці або поличці.'),
      impact: t('Око відпочиває, простір здається просторішим'),
    },
    {
      number: '03',
      title: hasLamp ? t('Налаштуй теплу температуру світла') : t('Додай локальне тепле освітлення'),
      description: hasLamp
        ? t('Переконайся, що в наявному світильнику стоїть лампа 2700K (тепле світло). У вечірній час вимикай верхню люстру.')
        : t('Одне локальне джерело світла на рівні очей створює інтимний острівець затишку та розслабляє після робочого дня.'),
      impact: t('Вечірній психологічний релакс'),
    },
    {
      number: '04',
      title: moodStep.title,
      description: hasPlant && moodId === 'natural'
        ? t('Постав наявну рослину ближче до джерела світла поруч з керамічною вазою чи книгою: вона стане фокусною точкою.')
        : moodStep.description,
      impact: moodStep.impact,
    },
  ];
}

const FREE_TIPS = [
  t('Зніміть паперові етикетки зі скляних банок і пляшок: ви отримаєте безкоштовні мінімалістичні вазочки.'),
  t('Використайте красиву обробну дошку як тацю для чашки, книги та свічки.'),
  t('Вимкніть верхнє світло та ввімкніть екран телевізора у режимі каміна або затишної галереї.'),
  t('Складіть стопку з 3 найкрасивіших книг і поставте на неї чашку або свічник: це класичний прийом дизайнерів.'),
];

/**
 * Builds a solution for a zone from the user's style, mood, budget and the items they already own.
 *
 * Rules:
 *  1. Only products meant for this zone are considered.
 *  2. Products the user already owns an equivalent of are never recommended (see coversItems).
 *  3. Products must match the chosen style; if fewer than two do, the style filter is relaxed and
 *     the result says so.
 *  4. Products are ranked by style match, mood match and impact, then added greedily while the total
 *     stays within the budget limit. Nothing above the budget is ever included.
 */
export function generateZoneSolution(params: SolutionParams): ZoneSolution {
  const zone = ZONES.find((z) => z.id === params.zoneId) ?? ZONES[0];
  const style = STYLES.find((s) => s.id === params.styleId) ?? STYLES[0];
  const mood = MOODS.find((m) => m.id === params.moodId) ?? MOODS[0];
  const budget = BUDGET_TIERS.find((b) => b.id === params.budgetId) ?? BUDGET_TIERS[1];
  const existingItems = params.existingItems.map((item) => item.trim()).filter(Boolean);

  const inZone = PRODUCTS_CATALOG.filter((p) => p.zones.includes(zone.id));
  const skippedOwned = inZone.filter((p) => isCoveredByOwned(p, existingItems));
  const available = inZone.filter((p) => !skippedOwned.includes(p));

  const styleMatched = available.filter((p) => p.styles.includes(style.id));
  const relaxedStyle = styleMatched.length < MIN_STYLE_MATCHES && available.length > styleMatched.length;
  const pool = relaxedStyle ? available : styleMatched;

  const ranked = rankProducts(pool, style.id, mood.id);

  const selected: ProductItem[] = [];
  const overBudget: ProductItem[] = [];
  let total = 0;
  for (const { product } of ranked) {
    if (selected.length >= MAX_PRODUCTS) break;
    if (total + product.price <= budget.limit) {
      selected.push(product);
      total += product.price;
    } else {
      overBudget.push(product);
    }
  }

  const cheaperCost = selected.reduce(
    (sum, p) => sum + (p.budgetAlternativePrice ?? Math.round(p.price * 0.5)),
    0
  );
  const isPartial = selected.length < Math.min(FULL_SOLUTION_MIN, pool.length);

  const ownedKey = [...existingItems.map(normalize)].sort().join('|');
  const id = `sol-${zone.id}-${style.id}-${mood.id}-${budget.id}-${hashString(ownedKey)}`;

  return {
    id,
    params: { zoneId: zone.id, styleId: style.id, moodId: mood.id, budgetId: budget.id, existingItems },
    zoneId: zone.id,
    zoneName: zone.name,
    zoneIcon: zone.icon,
    styleId: style.id,
    styleName: style.name,
    moodId: mood.id,
    moodName: mood.label,
    budgetId: budget.id,
    budgetName: budget.label,
    budgetLimit: budget.limit,
    existingItems,
    conceptImage: zone.image,
    tagline: t('{zone}: стилістика «{style}», настрій «{mood}»', { zone: zone.name, style: style.uaName, mood: mood.label.toLowerCase() }),
    steps: buildSteps({ ...params, existingItems }, style.materials, mood.id),
    products: selected,
    estimatedCost: Math.round(total),
    cheaperCost: Math.round(cheaperCost),
    isPartial,
    relaxedStyle,
    skippedOwned,
    overBudget,
    freeTips: FREE_TIPS,
    renterFriendly: selected.every((p) => p.canTakeWhenMoving !== false),
  };
}
